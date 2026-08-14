import { gzipSync } from 'node:zlib';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');
const files = {
  han: await readFile(path.resolve('data/hanThreeKingdoms.ts'), 'utf8'),
  qin: await readFile(path.resolve('data/wars.ts'), 'utf8'),
  packages: await readFile(path.resolve('data/scenario-registry.ts'), 'utf8'),
  packageTypes: await readFile(path.resolve('lib/scenario-package.ts'), 'utf8'),
  research: await readFile(path.resolve('data/research.ts'), 'utf8'),
  modern: await readFile(path.resolve('data/modernPlaces.ts'), 'utf8'),
  gisGuide: await readFile(path.resolve('HISTORICAL_GIS_AUTHORIZATION_GUIDE.md'), 'utf8'),
};
const staticFiles = ['README.md', 'DATA_CONTRACT.md', 'DEPLOYMENT.md', 'PROJECT_MANUAL.md'];
const documents = await Promise.all(staticFiles.map(async (file) => ({ file, content: await readFile(path.resolve(file), 'utf8') })));
const outputSize = (await stat(path.resolve('out/index.html'))).size;
function ensure(condition, message) { if (!condition) throw new Error(`2.x content-package audit: ${message}`); }
const hanEvents = (files.han.match(/id: 'han-/g) ?? []).length;
const threeKingdomsEvents = (files.han.match(/id: 'tk-/g) ?? []).length;
const hanPlaces = (files.han.match(/place\('/g) ?? []).length;
const qinEvents = (files.qin.match(/id: '/g) ?? []).length;
const territories = (files.han.match(/territory\('/g) ?? []).length;
const narrativeBlock = files.han.match(/export const HAN_THREE_KINGDOMS_NARRATIVE_EVENT_IDS = \[([\s\S]*?)\] as const;/)?.[1] ?? '';
const narratives = (narrativeBlock.match(/'tk-[^']+'/g) ?? []).length;
ensure(packageJson.version === '2.3.0', `expected package version 2.3.0, got ${packageJson.version}`);
ensure(files.packages.includes('createQinHanPackage') && files.packages.includes('createHanThreeKingdomsPackage'), 'scenario registry must contain both packages');
ensure(files.packageTypes.includes('sourceCatalog') && files.packageTypes.includes('assembleScenarioPackage'), 'content package must normalize a source catalog');
ensure(files.research.includes('coverageWindows') && files.research.includes('researchRegions'), 'research regions and coverage declarations are required');
ensure(hanEvents >= 50, `expected >=50 audited Han events, got ${hanEvents}`);
ensure(threeKingdomsEvents >= 60, `expected >=60 audited late Han/Three Kingdoms events, got ${threeKingdomsEvents}`);
ensure(hanPlaces >= 40, `expected >=40 Han historical place references, got ${hanPlaces}`);
ensure(qinEvents >= 30, `expected >=30 Qin-Han events, got ${qinEvents}`);
ensure(territories >= 25, `expected >=25 territorial/activity snapshots, got ${territories}`);
ensure(narratives >= 18, `expected >=18 Three Kingdoms narrative references, got ${narratives}`);
ensure(files.modern.includes("license: 'Public Domain'"), 'modern-reference layer must retain its public-domain license');
ensure(files.modern.includes('不代表任何时期行政边界'), 'modern-reference layer must disclaim administrative-boundary meaning');
ensure(files.gisGuide.includes('再分发'), 'historical GIS guide must retain redistribution requirements');
for (const document of documents) ensure(document.content.includes('不') && document.content.includes('行政'), `${document.file} must record administrative-boundary limitations`);
ensure(outputSize > 0, 'static export index.html is missing or empty; run npm run build:static first');
const report = { version: packageJson.version, packages: ['qin-han', 'han-three-kingdoms'], counts: { qinEvents, hanEvents, threeKingdomsEvents, hanPlaces, territories, threeKingdomsNarrativeReferences: narratives }, modernReferenceGzipBytes: gzipSync(files.modern).byteLength, historicalGis: 'disabled-awaiting-license', staticIndexBytes: outputSize, status: 'passed' };
await mkdir(path.resolve('artifacts'), { recursive: true });
await writeFile(path.resolve('artifacts/release-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log('2.x content-package audit passed');
console.log(JSON.stringify(report, null, 2));
