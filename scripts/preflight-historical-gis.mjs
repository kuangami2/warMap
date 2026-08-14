import { existsSync, lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function usage() {
  console.log('Usage: node scripts/preflight-historical-gis.mjs <authorized-package-directory> [--report <path>]');
}

function parseArgs(argv) {
  const packagePath = argv.find((value) => !value.startsWith('--'));
  const reportIndex = argv.indexOf('--report');
  const reportPath = reportIndex >= 0 ? argv[reportIndex + 1] : undefined;
  return { packagePath, reportPath, wantsHelp: argv.includes('--help') || argv.includes('-h') };
}

function isInside(child, parent) {
  const childRelative = relative(resolve(parent), resolve(child));
  return childRelative === '' || (childRelative !== '..' && !childRelative.startsWith(`..${sep}`) && !isAbsolute(childRelative));
}

function readText(path) {
  return readFileSync(path, 'utf8');
}

function addIssue(report, severity, code, message, context = {}) {
  report.issues.push({ severity, code, message, ...context });
}

function checkRequiredText(report, text, patterns, label) {
  const missing = patterns.filter((pattern) => !pattern.test(text));
  if (missing.length) {
    addIssue(report, 'error', 'license-field-missing', `${label} 未明确写出：${missing.map((pattern) => pattern.source).join('、')}`);
  }
}

function inspectLicense(report, licenseText) {
  checkRequiredText(report, licenseText, [
    /权利人|来源机构|rights? holder|attribution|institution/i,
    /数据名称|dataset|data name/i,
    /版本|version/i,
    /发布日期|发布日|release date|published/i,
    /许可范围|授权范围|permission|license scope|use scope/i,
    /公开.*展示|public.*display|website.*display|online.*display/i,
    /静态网站.*再分发|再分发|redistribut|static site/i,
    /署名|版权|引用|attribution|copyright|citation/i,
  ], 'LICENSE.md');

  const prohibited = [
    /仅限研究|仅供研究|research\s+only/i,
    /个人使用|personal\s+use/i,
    /仅限在线查看|online\s+viewing\s+only/i,
    /禁止再分发|不得再分发|不允许再分发|no\s+redistribution|not\s+for\s+redistribution/i,
  ];
  for (const pattern of prohibited) {
    if (pattern.test(licenseText)) {
      addIssue(report, 'error', 'redistribution-prohibited', `许可证包含禁止进入静态发布物的限制：${pattern.source}`);
    }
  }
}

function walkCoordinates(geometry, visitor) {
  if (!geometry) return;
  const visit = (value) => {
    if (typeof value?.[0] === 'number' && typeof value?.[1] === 'number') {
      visitor(value);
      return;
    }
    if (Array.isArray(value)) value.forEach(visit);
  };
  visit(geometry.coordinates);
}

function validateRing(report, ring, periodId) {
  if (!Array.isArray(ring) || ring.length < 4) {
    addIssue(report, 'error', 'invalid-ring', `${periodId}: 多边形环少于 4 个点`);
    return;
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!Array.isArray(first) || !Array.isArray(last) || first[0] !== last[0] || first[1] !== last[1]) {
    addIssue(report, 'error', 'unclosed-ring', `${periodId}: 多边形环未闭合`);
  }
}

function inspectGeoJson(report, filePath, period) {
  let parsed;
  try {
    parsed = JSON.parse(readText(filePath));
  } catch (error) {
    addIssue(report, 'error', 'invalid-json', `${period.id}: GeoJSON 无法解析`, { detail: String(error) });
    return;
  }

  const features = parsed.type === 'FeatureCollection' ? parsed.features : parsed.type === 'Feature' ? [parsed] : [];
  if (!features.length) {
    addIssue(report, 'error', 'unsupported-geojson', `${period.id}: 需要 FeatureCollection 或 Feature`);
    return;
  }

  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const feature of features) {
    if (!feature?.geometry || !['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
      addIssue(report, 'error', 'unsupported-geometry', `${period.id}: 仅接受 Polygon 或 MultiPolygon`);
      continue;
    }
    if (feature.geometry.type === 'Polygon') feature.geometry.coordinates.forEach((ring) => validateRing(report, ring, period.id));
    if (feature.geometry.type === 'MultiPolygon') feature.geometry.coordinates.forEach((polygon) => polygon.forEach((ring) => validateRing(report, ring, period.id)));
    walkCoordinates(feature.geometry, ([longitude, latitude]) => {
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
        addIssue(report, 'error', 'invalid-coordinate', `${period.id}: 坐标超出 WGS84 范围`);
        return;
      }
      bbox[0] = Math.min(bbox[0], longitude);
      bbox[1] = Math.min(bbox[1], latitude);
      bbox[2] = Math.max(bbox[2], longitude);
      bbox[3] = Math.max(bbox[3], latitude);
    });
  }
  report.periods.push({ id: period.id, file: period.file, format: 'GeoJSON', featureCount: features.length, bbox });
}

function inspectShapefile(report, packageRoot, period, filePath) {
  const stem = filePath.slice(0, -extname(filePath).length);
  const sidecars = ['.shp', '.dbf', '.shx', '.prj'].map((extension) => `${stem}${extension}`);
  const missing = sidecars.filter((path) => !existsSync(path));
  if (missing.length) addIssue(report, 'error', 'missing-shapefile-sidecar', `${period.id}: Shapefile 缺少配套文件`, { files: missing.map((path) => relative(packageRoot, path)) });
  addIssue(report, 'warning', 'shapefile-geometry-pending', `${period.id}: 已检查 Shapefile 配套文件，但仍需 GIS 解析器完成几何有效性和坐标系预检`);
  report.periods.push({ id: period.id, file: period.file, format: 'Shapefile', sidecarsPresent: missing.length === 0, geometryValidation: 'pending-gis-parser' });
}

function inspectManifest(report, packageRoot, manifest) {
  for (const field of ['datasetId', 'version', 'license', 'sourceUrl']) {
    if (typeof manifest[field] !== 'string' || !manifest[field].trim()) addIssue(report, 'error', 'manifest-field-missing', `MANIFEST.json 缺少 ${field}`);
  }
  if (!Array.isArray(manifest.periods) || manifest.periods.length === 0) {
    addIssue(report, 'error', 'manifest-periods-missing', 'MANIFEST.json 必须包含至少一个时期');
    return;
  }
  const ids = new Set();
  for (const period of manifest.periods) {
    if (!period || typeof period !== 'object') {
      addIssue(report, 'error', 'invalid-period', 'MANIFEST.json 含有无效时期记录');
      continue;
    }
    if (!period.id || ids.has(period.id)) addIssue(report, 'error', 'invalid-period-id', `时期 id 缺失或重复：${period.id ?? '(empty)'}`);
    ids.add(period.id);
    if (!Number.isInteger(period.startYear) || !Number.isInteger(period.endYear) || period.startYear > period.endYear) addIssue(report, 'error', 'invalid-period-range', `${period.id}: 起止年份无效`);
    if (!period.file || isAbsolute(period.file)) addIssue(report, 'error', 'invalid-period-file', `${period.id}: file 必须是包内相对路径`);
    const filePath = resolve(packageRoot, period.file ?? '');
    if (period.file && !isInside(filePath, packageRoot)) addIssue(report, 'error', 'period-file-outside-package', `${period.id}: file 指向授权包之外`);
    if (!period.file || !existsSync(filePath)) {
      addIssue(report, 'error', 'period-file-missing', `${period.id}: 找不到 ${period.file ?? '(empty)'}`);
      continue;
    }
    if (!period.featureMeaning || !period.level || !period.citation) addIssue(report, 'error', 'period-metadata-missing', `${period.id}: 必须提供 featureMeaning、level 和 citation`);
    if (/势力|影响|争夺|活动范围|influence|control|activity|schematic/i.test(`${period.featureMeaning} ${period.level}`)) addIssue(report, 'error', 'administrative-meaning-unclear', `${period.id}: 要素含义看起来是势力范围或示意面，不是明确行政层级`);
    if (period.coverage === undefined) addIssue(report, 'warning', 'coverage-not-declared', `${period.id}: 未提供 coverage 字段，后续发布说明将无法完整列出覆盖缺口`);
    const extension = extname(filePath).toLowerCase();
    if (extension === '.geojson' || extension === '.json') inspectGeoJson(report, filePath, period);
    else if (extension === '.shp') inspectShapefile(report, packageRoot, period, filePath);
    else addIssue(report, 'error', 'unsupported-format', `${period.id}: 不支持的文件格式 ${extension}`);
  }
}

function main() {
  const { packagePath, reportPath, wantsHelp } = parseArgs(process.argv.slice(2));
  if (wantsHelp) {
    usage();
    process.exitCode = 0;
    return;
  }
  if (!packagePath) {
    usage();
    process.exitCode = 2;
    return;
  }
  const packageRoot = resolve(packagePath);
  const report = {
    reportVersion: '1.0',
    generatedAt: new Date().toISOString(),
    packagePath: packageRoot,
    sourceDataCopied: false,
    publishable: false,
    issues: [],
    periods: [],
  };

  if (!existsSync(packageRoot) || !lstatSync(packageRoot).isDirectory()) addIssue(report, 'error', 'package-not-directory', '输入路径必须是项目外的授权包目录');
  if (isInside(packageRoot, projectRoot)) addIssue(report, 'error', 'package-inside-project', '授权包必须放在项目目录之外，避免原始受限数据进入项目');
  if (report.issues.some((issue) => issue.severity === 'error')) return finish(report, reportPath);

  const licensePath = resolve(packageRoot, 'LICENSE.md');
  const manifestPath = resolve(packageRoot, 'MANIFEST.json');
  for (const required of [licensePath, manifestPath]) if (!existsSync(required)) addIssue(report, 'error', 'required-file-missing', `缺少 ${relative(packageRoot, required)}`);
  if (!existsSync(resolve(packageRoot, 'data'))) addIssue(report, 'error', 'data-directory-missing', '缺少 data/ 目录');
  if (!existsSync(resolve(packageRoot, 'documentation'))) addIssue(report, 'warning', 'documentation-directory-missing', '缺少 documentation/ 目录');
  if (existsSync(licensePath)) inspectLicense(report, readText(licensePath));
  if (existsSync(manifestPath)) {
    try { inspectManifest(report, packageRoot, JSON.parse(readText(manifestPath))); }
    catch (error) { addIssue(report, 'error', 'invalid-manifest-json', 'MANIFEST.json 无法解析', { detail: String(error) }); }
  }
  report.publishable = report.issues.every((issue) => issue.severity !== 'error') && report.periods.every((period) => period.geometryValidation !== 'pending-gis-parser');
  if (!report.publishable && report.periods.some((period) => period.geometryValidation === 'pending-gis-parser')) addIssue(report, 'error', 'geometry-validation-incomplete', '存在尚未完成几何有效性预检的 Shapefile，授权闸门不能通过');
  finish(report, reportPath);
}

function finish(report, reportPath) {
  const output = JSON.stringify(report, null, 2);
  if (reportPath) writeFileSync(resolve(reportPath), `${output}\n`, 'utf8');
  console.log(output);
  process.exitCode = report.publishable ? 0 : 1;
}

main();
