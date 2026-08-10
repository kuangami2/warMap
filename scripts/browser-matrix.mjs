import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const baseUrl = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3000';
const outputDirectory = path.resolve('artifacts/browser-matrix');

const profiles = [
  {
    name: 'wechat-320',
    browser: chromium,
    viewport: { width: 320, height: 568 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.50',
    mobile: true,
  },
  {
    name: 'android-chrome-375',
    browser: chromium,
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    mobile: true,
  },
  {
    name: 'iphone-webkit-390',
    browser: webkit,
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    mobile: true,
    primary: true,
  },
  {
    name: 'iphone-webkit-414',
    browser: webkit,
    viewport: { width: 414, height: 896 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    mobile: true,
  },
  { name: 'desktop-1280', browser: chromium, viewport: { width: 1280, height: 800 }, mobile: false },
  { name: 'desktop-1600', browser: chromium, viewport: { width: 1600, height: 1050 }, mobile: false },
];
const requestedProfiles = process.env.PROFILE_FILTER?.split(',').map((name) => name.trim()).filter(Boolean);
const selectedProfiles = requestedProfiles?.length ? profiles.filter((profile) => requestedProfiles.includes(profile.name)) : profiles;

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

async function capture(page, fileName, fullPage) {
  const screenshot = await page.screenshot({ fullPage });
  ensure(screenshot.length > 0, `${fileName}: screenshot was empty`);
  await writeFile(path.join(outputDirectory, fileName), screenshot);
}

await mkdir(outputDirectory, { recursive: true });

const activeBrowsers = new Map();

try {
for (const profile of selectedProfiles) {
  const browserName = profile.browser.name();
  let browser = activeBrowsers.get(browserName);
  if (!browser) {
    browser = await profile.browser.launch({ headless: true });
    activeBrowsers.set(browserName, browser);
  }
  process.stdout.write(`Testing ${profile.name}\n`);
  const context = await browser.newContext({
    viewport: profile.viewport,
    userAgent: profile.userAgent,
    isMobile: profile.mobile,
    hasTouch: profile.mobile,
    deviceScaleFactor: profile.mobile ? 2 : 1,
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.locator('.map-frame').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);

  if (profile.mobile) {
    const mobileTimeline = page.locator('.mobile-timeline-shell');
    ensure(await mobileTimeline.isVisible(), `${profile.name}: mobile timeline is not visible`);
    ensure(!(await page.locator('.desktop-timeline').isVisible()), `${profile.name}: desktop timeline should be hidden`);
    const playButton = mobileTimeline.getByRole('button', { name: '播放' });
    const playBox = await playButton.boundingBox();
    ensure(playBox && playBox.y + playBox.height <= profile.viewport.height, `${profile.name}: play button is outside the initial viewport`);

    const legendToggle = page.getByRole('button', { name: '图例', exact: true });
    ensure(await legendToggle.isVisible(), `${profile.name}: legend toggle is not visible`);
    ensure(!(await page.locator('#map-legend').isVisible()), `${profile.name}: legend should be collapsed initially`);
    await legendToggle.click();
    ensure(await page.locator('#map-legend').isVisible(), `${profile.name}: legend did not open`);
    if (profile.primary) await capture(page, 'mobile-legend-open.png', false);
    await page.keyboard.press('Escape');
    ensure(!(await page.locator('#map-legend').isVisible()), `${profile.name}: Escape did not close the legend`);
    await legendToggle.click();
    await page.locator('.map-frame').click({ position: { x: profile.viewport.width * 0.72, y: 90 } });
    ensure(!(await page.locator('#map-legend').isVisible()), `${profile.name}: map click did not close the legend`);

    const moreControls = mobileTimeline.locator('.mobile-timeline-more');
    await moreControls.locator('summary').click();
    const doubleSpeed = moreControls.getByRole('button', { name: '2×' });
    await doubleSpeed.click();
    ensure((await doubleSpeed.getAttribute('class'))?.includes('speed-active'), `${profile.name}: speed selection did not update`);
    await moreControls.getByRole('button', { name: '楚汉相争' }).click();
    ensure((await mobileTimeline.locator('.mobile-current-year').textContent())?.includes('前206年'), `${profile.name}: era jump did not update the year`);
    await moreControls.locator('summary').click();

    await mobileTimeline.getByRole('button', { name: '播放' }).click();
    await page.waitForTimeout(750);
    ensure(await mobileTimeline.getByRole('button', { name: '暂停' }).isVisible(), `${profile.name}: playback did not start`);
    if (profile.primary) await capture(page, 'mobile-playing.png', false);
    await mobileTimeline.getByRole('button', { name: '暂停' }).click();
    const firstMobileEvent = page.locator('.event-card').first();
    await firstMobileEvent.scrollIntoViewIfNeeded();
    await firstMobileEvent.click();
    ensure(await page.getByRole('dialog').isVisible(), `${profile.name}: event detail drawer did not open`);
    ensure(await page.locator('.detail-backdrop').isVisible(), `${profile.name}: detail backdrop is not visible`);
    ensure(await page.evaluate(() => document.body.style.overflow === 'hidden'), `${profile.name}: background scroll was not locked`);
    await page.keyboard.press('Escape');
    ensure(!(await page.getByRole('dialog').isVisible()), `${profile.name}: Escape did not close event detail`);
    ensure(await page.evaluate(() => document.body.style.overflow !== 'hidden'), `${profile.name}: background scroll lock was not restored`);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(250);
    const stickyBox = await mobileTimeline.boundingBox();
    ensure(stickyBox && stickyBox.y <= 24, `${profile.name}: mobile timeline is not sticky after scrolling`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
  } else {
    ensure(await page.locator('.desktop-timeline').isVisible(), `${profile.name}: desktop timeline is not visible`);
    ensure(!(await page.locator('.mobile-timeline-shell').isVisible()), `${profile.name}: mobile timeline should be hidden`);
    ensure(await page.locator('#map-legend').isVisible(), `${profile.name}: desktop legend is not visible`);
    ensure(await page.getByText('台湾省', { exact: true }).isVisible(), `${profile.name}: Taiwan province is missing from the default map view`);
    await page.locator('.desktop-timeline .timeline-range').evaluate((element) => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      valueSetter?.call(element, '-206');
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(250);
    ensure(await page.locator('.event-card').count() >= 4, `${profile.name}: event overview does not expose enough simultaneous events`);
    const browserBox = await page.locator('.event-browser').boundingBox();
    const overviewBox = await page.locator('.event-overview').boundingBox();
    ensure(browserBox && overviewBox && overviewBox.height >= browserBox.height * .45, `${profile.name}: event overview is still vertically constrained`);
    await page.locator('.event-overview').evaluate((element) => { element.scrollTop = 90; });
    const firstDesktopEvent = page.locator('.event-card').nth(3);
    await firstDesktopEvent.hover();
    ensure(await page.locator('.event-node-active').count() > 0, `${profile.name}: list hover did not activate a map node`);
    await firstDesktopEvent.click();
    ensure(await page.getByRole('dialog').isVisible(), `${profile.name}: event detail drawer did not open`);
    const scrollBefore = await page.locator('.event-overview').evaluate((element) => element.scrollTop);
    await page.getByRole('button', { name: '关闭详情' }).click();
    ensure(!(await page.getByRole('dialog').isVisible()), `${profile.name}: close button did not close event detail`);
    const scrollAfter = await page.locator('.event-overview').evaluate((element) => element.scrollTop);
    ensure(Math.abs(scrollAfter - scrollBefore) <= 2, `${profile.name}: event list scroll position was not preserved (${scrollBefore} -> ${scrollAfter})`);
    await page.getByRole('button', { name: '关闭动效' }).click();
    ensure(await page.getByRole('button', { name: '开启动效' }).isVisible(), `${profile.name}: animation toggle did not update`);
    const zoomIn = page.getByRole('button', { name: '放大地图' });
    await zoomIn.click();
    await zoomIn.click();
    ensure(await page.getByText('台湾省', { exact: true }).isVisible(), `${profile.name}: Taiwan province disappeared after zooming`);
  }

  ensure(runtimeErrors.length === 0, `${profile.name}: ${runtimeErrors.join('; ')}`);
  await capture(page, `${profile.name}.png`, true);
  await context.close();
}
} finally {
  await Promise.all(Array.from(activeBrowsers.values(), (browser) => browser.close()));
}

process.stdout.write(`Browser matrix passed for ${selectedProfiles.length} profiles at ${baseUrl}\n`);
