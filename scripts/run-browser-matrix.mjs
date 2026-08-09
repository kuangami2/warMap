import { spawn } from 'node:child_process';

const baseUrl = 'http://127.0.0.1:3000';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3000'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  windowsHide: true,
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Local Next.js production server did not become ready.');
}

try {
  await waitForServer();
  const profileGroups = process.env.PROFILE_FILTER
    ? [process.env.PROFILE_FILTER]
    : ['wechat-320,android-chrome-375,desktop-1280,desktop-1600', 'iphone-webkit-390,iphone-webkit-414'];
  for (const profileFilter of profileGroups) {
    const tests = spawn(process.execPath, ['scripts/browser-matrix.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, TEST_BASE_URL: baseUrl, PROFILE_FILTER: profileFilter },
      stdio: 'inherit',
      windowsHide: true,
    });
    const exitCode = await new Promise((resolve) => tests.once('exit', (code) => resolve(code ?? 1)));
    if (exitCode !== 0) {
      process.exitCode = exitCode;
      break;
    }
  }
} finally {
  server.kill();
}
