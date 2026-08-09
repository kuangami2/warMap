import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: process.cwd(), stdio: 'inherit', ...options });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function output(command, args) {
  const result = spawnSync(command, args, { cwd: process.cwd(), encoding: 'utf8' });
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result.stdout.trim();
}

run(process.execPath, ['scripts/build-static.mjs'], {
  env: { ...process.env, GITHUB_PAGES: 'true' },
});

const deploymentDirectory = await mkdtemp(path.join(tmpdir(), 'war-map-pages-'));

try {
  await cp(path.resolve('out'), deploymentDirectory, { recursive: true });
  await writeFile(path.join(deploymentDirectory, '.nojekyll'), '');
  await writeFile(path.join(deploymentDirectory, 'vercel.json'), '{"ignoreCommand":"exit 0"}\n');
  run('git', ['init'], { cwd: deploymentDirectory });
  run('git', ['config', 'user.name', 'Codex Pages Publisher'], { cwd: deploymentDirectory });
  run('git', ['config', 'user.email', 'pages@war-map.local'], { cwd: deploymentDirectory });
  run('git', ['checkout', '-b', 'gh-pages'], { cwd: deploymentDirectory });
  run('git', ['add', '-A'], { cwd: deploymentDirectory });
  run('git', ['commit', '-m', 'Publish static mirror'], { cwd: deploymentDirectory });
  run('git', ['remote', 'add', 'origin', output('git', ['remote', 'get-url', 'origin'])], { cwd: deploymentDirectory });
  run('git', ['push', '--force', 'origin', 'gh-pages'], { cwd: deploymentDirectory });
} finally {
  await rm(deploymentDirectory, { recursive: true, force: true });
}
