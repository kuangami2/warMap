import { chromium } from 'playwright-core';

const baseUrl = process.env.CAPTURE_BASE_URL ?? 'http://127.0.0.1:3000';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
});

const page = await browser.newPage({ viewport: { width: 1600, height: 1050 }, deviceScaleFactor: 1 });
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'artifacts/desktop-overview.png', fullPage: true });

await page.getByRole('button', { name: '楚汉相争' }).click();
await page.waitForTimeout(400);
await page.locator('[aria-label="查看还定三秦详情"]').click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'artifacts/route-detail.png', fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'artifacts/mobile-overview.png', fullPage: true });
await browser.close();
