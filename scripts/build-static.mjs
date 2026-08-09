import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  cwd: process.cwd(),
  env: { ...process.env, STATIC_EXPORT: 'true' },
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
