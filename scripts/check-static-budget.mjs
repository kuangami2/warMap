import { gzipSync } from 'node:zlib';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = path.resolve('out');
const baseline = JSON.parse(await readFile(path.resolve('artifacts/development-performance-baseline-v1.9.9.json'), 'utf8'));
const limits = { ...baseline.constraints, initialJavaScriptGzipBytes: 450 * 1024, largestAsyncChunkGzipBytes: 300 * 1024 };

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => entry.isDirectory() ? collectFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}

function formatBytes(bytes) { return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MiB` : `${Math.round(bytes / 1024)} KiB`; }

const files = await collectFiles(outputDirectory);
const records = await Promise.all(files.map(async (file) => ({ file, size: (await stat(file)).size })));
const javascript = records.filter(({ file }) => file.endsWith('.js'));
const gzipByFile = new Map(await Promise.all(javascript.map(async ({ file }) => [file, gzipSync(await readFile(file)).byteLength])));
const javaScriptGzipBytes = [...gzipByFile.values()].reduce((sum, size) => sum + size, 0);
const totalBytes = records.reduce((sum, record) => sum + record.size, 0);
const largestAsset = records.reduce((largest, record) => record.size > largest.size ? record : largest, { file: '', size: 0 });
const html = await Promise.all(records.filter(({ file }) => file.endsWith('.html')).map(({ file }) => readFile(file, 'utf8')));
const initialSources = new Set(html.flatMap((content) => Array.from(content.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/g), (match) => match[1].replace(/^\//, ''))));
const initialFiles = [...initialSources].map((source) => path.resolve(outputDirectory, source)).filter((file) => gzipByFile.has(file));
const initialJavaScriptGzipBytes = initialFiles.reduce((sum, file) => sum + (gzipByFile.get(file) ?? 0), 0);
const asyncChunks = [...gzipByFile.entries()].filter(([file]) => !initialFiles.includes(file));
const largestAsyncChunkGzipBytes = asyncChunks.reduce((largest, [, size]) => Math.max(largest, size), 0);
const externalUrls = html.flatMap((content) => Array.from(content.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/g), (match) => match[1]));
const physicalVectorBytes = gzipSync(await readFile(path.resolve('data/naturalEarth10m.ts'))).byteLength;
const report = { baseline: baseline.label, totalBytes, javaScriptGzipBytes, initialJavaScriptGzipBytes, largestAsyncChunkGzipBytes, largestAssetBytes: largestAsset.size, largestAsset: path.relative(process.cwd(), largestAsset.file).replaceAll('\\', '/'), physicalVectorGzipBytes: physicalVectorBytes, fileCount: records.length, javaScriptChunkCount: javascript.length, externalRuntimeUrls: [...new Set(externalUrls)] };

console.log(`Static output: ${formatBytes(totalBytes)} across ${records.length} files`);
console.log(`JavaScript gzip: ${formatBytes(javaScriptGzipBytes)} across ${javascript.length} chunks; initial ${formatBytes(initialJavaScriptGzipBytes)}, largest async ${formatBytes(largestAsyncChunkGzipBytes)}`);
console.log(`Largest asset: ${formatBytes(largestAsset.size)} (${report.largestAsset})`);
console.log(`Natural Earth 1:10m physical vector gzip: ${formatBytes(physicalVectorBytes)}`);

const failures = [
  totalBytes > limits.totalBytes && `Static output ${formatBytes(totalBytes)} exceeds ${formatBytes(limits.totalBytes)}.`,
  javaScriptGzipBytes > limits.javaScriptGzipBytes && `JavaScript gzip ${formatBytes(javaScriptGzipBytes)} exceeds ${formatBytes(limits.javaScriptGzipBytes)}.`,
  initialJavaScriptGzipBytes > limits.initialJavaScriptGzipBytes && `Initial JavaScript gzip ${formatBytes(initialJavaScriptGzipBytes)} exceeds ${formatBytes(limits.initialJavaScriptGzipBytes)}.`,
  largestAsyncChunkGzipBytes > limits.largestAsyncChunkGzipBytes && `Largest async chunk gzip ${formatBytes(largestAsyncChunkGzipBytes)} exceeds ${formatBytes(limits.largestAsyncChunkGzipBytes)}.`,
  largestAsset.size > limits.largestAssetBytes && `Largest asset ${formatBytes(largestAsset.size)} exceeds ${formatBytes(limits.largestAssetBytes)}.`,
  physicalVectorBytes > limits.physicalVectorGzipBytes && `Natural Earth 1:10m physical vector gzip ${formatBytes(physicalVectorBytes)} exceeds ${formatBytes(limits.physicalVectorGzipBytes)}.`,
  externalUrls.length > 0 && `Static HTML references external runtime assets: ${[...new Set(externalUrls)].join(', ')}.`,
].filter(Boolean);
await mkdir(path.resolve('artifacts'), { recursive: true });
await writeFile(path.resolve('artifacts/latest-performance-report.json'), `${JSON.stringify({ ...report, limits, failures }, null, 2)}\n`);
if (failures.length) { for (const failure of failures) console.error(`Budget check failed: ${failure}`); process.exitCode = 1; } else console.log('Static deployment budget check passed: package, first-screen and asynchronous-chunk budgets are within bounds.');
