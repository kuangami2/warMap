import { webkit } from 'playwright';

const baseUrl = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3000';
const result = { browserLaunch: false, minimalDocument: false, serverReachable: false, applicationDocument: false, classification: 'unknown' };
let browser;

try {
  browser = await webkit.launch({ headless: true });
  result.browserLaunch = true;
  const page = await browser.newPage();
  await page.goto('data:text/html,<title>webkit-ok</title><main>ok</main>', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  result.minimalDocument = (await page.title()) === 'webkit-ok';
  try {
    const response = await page.request.get(baseUrl, { timeout: 15_000 });
    result.serverReachable = response.ok();
  } catch {}
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    result.applicationDocument = await page.locator('.map-frame').isVisible({ timeout: 10_000 });
  } catch {}
  result.classification = result.applicationDocument
    ? 'pass'
    : result.minimalDocument && result.serverReachable
      ? 'webkit-navigation-infrastructure'
      : 'webkit-runtime-infrastructure';
} finally {
  await browser?.close();
}

process.stdout.write(`${JSON.stringify(result)}\n`);
if (result.classification !== 'pass') process.exitCode = 2;
