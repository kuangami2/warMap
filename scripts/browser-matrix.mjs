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
  await page.locator('.geography-layer').waitFor({ state: 'attached' });
  ensure(await page.locator('.geography-layer path').count() <= 20, `${profile.name}: physical geography regressed to a high-node SVG layer`);
  ensure((await page.locator('.timeline-range').first().inputValue()) === '-230', `${profile.name}: an unparameterized Qin-Han URL did not begin at the topic start year`);
  if (!profile.mobile) {
    const mapBoxAtStart = await page.locator('.map-frame').boundingBox();
    const desktopTimelineBoxAtStart = await page.locator('.desktop-timeline').boundingBox();
    ensure(mapBoxAtStart && desktopTimelineBoxAtStart && desktopTimelineBoxAtStart.y >= mapBoxAtStart.y + mapBoxAtStart.height - 1, `${profile.name}: desktop timeline overlays the map instead of following it`);
  }
  await page.waitForFunction(() => window.location.search.includes('year='), undefined, { timeout: 5_000 });
  ensure(page.url().includes('year='), `${profile.name}: map state was not written to the shareable URL`);
  ensure(page.url().includes('scenario=qin-han'), `${profile.name}: legacy topic was not written to the shareable URL`);
  const mapSearch = page.locator('#map-search');
  await mapSearch.fill('函谷关');
  const hanguResult = page.getByRole('option').filter({ hasText: /^函谷关/ });
  ensure(await hanguResult.isVisible(), `${profile.name}: historical place search did not return 函谷关`);
  await hanguResult.click({ force: true });
  await page.waitForTimeout(250);
  ensure(Number(await page.locator('.map-canvas').getAttribute('data-map-scale')) >= 1.5, `${profile.name}: place search did not focus the map`);
  await page.getByRole('button', { name: '重置地图缩放' }).click();

  const scenarioSwitcher = page.getByRole('combobox', { name: '选择历史专题' });
  await scenarioSwitcher.selectOption('han-three-kingdoms');
  await page.waitForFunction(() => window.location.search.includes('scenario=han-three-kingdoms'), undefined, { timeout: 5_000 });
  ensure((await page.locator('.timeline-range').first().inputValue()) === '-202', `${profile.name}: scenario switch did not reset to the Han topic start year`);
  await mapSearch.fill('昆阳');
  ensure(await page.getByRole('option').filter({ hasText: /^昆阳/ }).count() >= 2, `${profile.name}: Han topic search did not return 昆阳`);
  await mapSearch.fill('函谷关');
  ensure(!(await page.getByRole('option').filter({ hasText: /^函谷关/ }).isVisible()), `${profile.name}: old topic place leaked into Han topic search`);
  await mapSearch.fill('赤壁');
  ensure(await page.getByRole('option', { name: /赤壁之战/ }).isVisible(), `${profile.name}: Three Kingdoms search did not return 赤壁之战`);
  await mapSearch.fill('');
  const researchFilters = page.locator('.explorer-filters');
  await researchFilters.locator('summary').click();
  const jingzhouFilter = researchFilters.getByRole('button', { name: '荆州与长江' });
  await jingzhouFilter.click();
  await page.waitForFunction(() => window.location.search.includes('region=han-jingzhou-yangtze'), undefined, { timeout: 5_000 });
  await page.keyboard.press('Escape');
  ensure(!(await researchFilters.getAttribute('open')), `${profile.name}: Escape did not close research filters`);
  ensure(await page.getByRole('option', { name: /赤壁之战/ }).isVisible(), `${profile.name}: research-region filtering did not return 赤壁之战`);
  await researchFilters.locator('summary').click();
  await jingzhouFilter.click();
  await page.keyboard.press('Escape');
  const hanRange = page.locator('.timeline-range').first();
  for (const checkpoint of [184, 208, 220, 229, 263, 265, 280]) {
    await hanRange.evaluate((element, year) => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      valueSetter?.call(element, String(year));
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }, checkpoint);
    await page.waitForTimeout(90);
    ensure((await hanRange.inputValue()) === String(checkpoint), `${profile.name}: Han–Three Kingdoms checkpoint ${checkpoint} did not render`);
  }
  ensure(await page.getByText('西晋统一', { exact: true }).isVisible(), `${profile.name}: 280 historical breakpoint notice is missing`);
  await scenarioSwitcher.selectOption('qin-han');
  await page.waitForFunction(() => window.location.search.includes('scenario=qin-han'), undefined, { timeout: 5_000 });
  ensure((await page.locator('.timeline-range').first().inputValue()) === '-230', `${profile.name}: switching back did not restore Qin-Han start year`);
  ensure(await page.locator('.map-region-list').count() === 0, `${profile.name}: generic region shortcuts should not be shown`);

  if (profile.mobile) {
    const mobileTimeline = page.locator('.mobile-timeline-shell');
    ensure(await mobileTimeline.isVisible(), `${profile.name}: mobile timeline is not visible`);
    ensure(!(await page.locator('.desktop-timeline').isVisible()), `${profile.name}: desktop timeline should be hidden`);
    const playButton = mobileTimeline.getByRole('button', { name: '播放历史' });
    const playBox = await playButton.boundingBox();
    ensure(playBox && playBox.y + playBox.height <= profile.viewport.height, `${profile.name}: play button is outside the initial viewport`);
    ensure(playBox && playBox.width >= 44 && playBox.height >= 44, `${profile.name}: primary play action misses the 44px touch target`);

    const legendToggle = page.getByRole('button', { name: '图例', exact: true });
    ensure(await legendToggle.isVisible(), `${profile.name}: legend toggle is not visible`);
    ensure(!(await page.locator('#map-legend').isVisible()), `${profile.name}: legend should be collapsed initially`);
    await legendToggle.click();
    ensure(await page.locator('#map-legend').isVisible(), `${profile.name}: legend did not open`);
    if (profile.primary) await capture(page, 'mobile-legend-open.png', false);
    await page.keyboard.press('Escape');
    ensure(!(await page.locator('#map-legend').isVisible()), `${profile.name}: Escape did not close the legend`);
    await legendToggle.click();
    const mapBox = await page.locator('.map-frame').boundingBox();
    ensure(mapBox, `${profile.name}: map frame has no dimensions`);
    await page.locator('.map-frame').click({ position: { x: mapBox.width - 18, y: mapBox.height - 18 } });
    ensure(!(await page.locator('#map-legend').isVisible()), `${profile.name}: map click did not close the legend`);

    const mapCanvas = page.locator('.map-canvas');
    ensure(await mapCanvas.evaluate((element) => getComputedStyle(element).touchAction === 'none'), `${profile.name}: map canvas must disable browser touch handling`);
    const mapCanvasBox = await mapCanvas.boundingBox();
    ensure(mapCanvasBox, `${profile.name}: map canvas has no dimensions`);
    const dispatchPointer = (type, pointerId, x, y) => mapCanvas.evaluate((element, payload) => {
      element.dispatchEvent(new PointerEvent(payload.type, {
        bubbles: true,
        cancelable: true,
        pointerId: payload.pointerId,
        pointerType: 'touch',
        isPrimary: payload.pointerId === 1,
        button: 0,
        buttons: 1,
        clientX: payload.x,
        clientY: payload.y,
      }));
    }, { type, pointerId, x, y });
    const firstTouch = { x: mapCanvasBox.x + mapCanvasBox.width * .37, y: mapCanvasBox.y + mapCanvasBox.height * .48 };
    const secondTouch = { x: mapCanvasBox.x + mapCanvasBox.width * .55, y: mapCanvasBox.y + mapCanvasBox.height * .48 };
    await dispatchPointer('pointerdown', 1, firstTouch.x, firstTouch.y);
    await dispatchPointer('pointerdown', 2, secondTouch.x, secondTouch.y);
    await dispatchPointer('pointermove', 2, mapCanvasBox.x + mapCanvasBox.width * .73, secondTouch.y);
    await page.waitForTimeout(100);
    ensure(Number(await mapCanvas.getAttribute('data-map-scale')) > 1.5, `${profile.name}: pinch gesture did not zoom the map`);
    await dispatchPointer('pointerup', 2, mapCanvasBox.x + mapCanvasBox.width * .73, secondTouch.y);
    await dispatchPointer('pointerup', 1, firstTouch.x, firstTouch.y);
    await page.getByRole('button', { name: '重置地图缩放' }).click();
    ensure((await mapCanvas.getAttribute('data-map-scale')) === '1.000', `${profile.name}: map reset did not restore the whole-map scale`);

    const moreControls = mobileTimeline.locator('.mobile-timeline-more');
    await moreControls.locator('summary').click();
    const doubleSpeed = moreControls.getByRole('button', { name: '2×' });
    await doubleSpeed.click();
    ensure((await doubleSpeed.getAttribute('class'))?.includes('speed-active'), `${profile.name}: speed selection did not update`);
    await moreControls.getByRole('button', { name: '楚汉相争' }).click();
    ensure((await mobileTimeline.locator('.mobile-current-year').textContent())?.includes('前206年'), `${profile.name}: era jump did not update the year`);
    await moreControls.locator('summary').click();

    await mobileTimeline.getByRole('button', { name: '播放历史' }).click();
    await page.waitForTimeout(300);
    ensure(await mobileTimeline.getByRole('button', { name: '暂停播放' }).isVisible(), `${profile.name}: playback did not start`);
    ensure(await page.locator('.narrative-map-panel').isVisible(), `${profile.name}: narrative playback did not open its story panel`);
    ensure(await page.locator('.geography-layer-performance').count() === 1, `${profile.name}: story playback did not enable the lightweight map mode`);
    if (profile.primary) await capture(page, 'mobile-playing.png', false);
    await mobileTimeline.getByRole('button', { name: '暂停播放' }).click();
    const pausedStoryTitle = await page.locator('.narrative-map-heading h2').textContent();
    const pausedStoryYear = await page.locator('.timeline-range').first().inputValue();
    await mobileTimeline.getByRole('button', { name: '播放历史' }).click();
    await page.waitForTimeout(80);
    ensure((await page.locator('.narrative-map-heading h2').textContent()) === pausedStoryTitle, `${profile.name}: resuming playback restarted the story chapter`);
    ensure((await page.locator('.timeline-range').first().inputValue()) === pausedStoryYear, `${profile.name}: resuming playback reset the story year`);
    await mobileTimeline.getByRole('button', { name: '暂停播放' }).click();
    const mobileRange = mobileTimeline.locator('.timeline-range');
    await mobileRange.evaluate((element) => {
      const input = element;
      input.value = '-201';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(80);
    ensure(!(page.url().includes('story=')), `${profile.name}: manual mobile timeline movement retained stale story state`);
    await mobileTimeline.getByRole('button', { name: '播放历史' }).click();
    ensure((await page.locator('.narrative-map-heading h2').textContent()) === '白登之围', `${profile.name}: mobile playback did not resume at the next chapter after a timeline gap`);
    await mobileTimeline.getByRole('button', { name: '暂停播放' }).click();
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
    const desktopPlay = page.locator('.desktop-timeline .timeline-primary-action');
    ensure(await desktopPlay.isVisible(), `${profile.name}: primary playback action is not visible`);
    const desktopPlayBox = await desktopPlay.boundingBox();
    ensure(desktopPlayBox && desktopPlayBox.height >= 44, `${profile.name}: desktop playback action is too small`);
    await desktopPlay.click();
    ensure(await page.locator('.narrative-map-panel').isVisible(), `${profile.name}: desktop playback did not open its story panel`);
    ensure(await page.locator('.geography-layer-performance').count() === 1, `${profile.name}: desktop playback did not enable the lightweight map mode`);
    const pausedStoryTitle = await page.locator('.narrative-map-heading h2').textContent();
    const pausedStoryYear = await page.locator('.timeline-range').first().inputValue();
    await desktopPlay.click();
    await desktopPlay.click();
    await page.waitForTimeout(80);
    ensure((await page.locator('.narrative-map-heading h2').textContent()) === pausedStoryTitle, `${profile.name}: desktop playback resumed from the beginning instead of the paused chapter`);
    ensure((await page.locator('.timeline-range').first().inputValue()) === pausedStoryYear, `${profile.name}: desktop playback reset the paused story year`);
    await page.waitForFunction(() => window.location.search.includes('story='), undefined, { timeout: 5_000 });
    ensure(page.url().includes('story='), `${profile.name}: story state was not written to the shareable URL`);
    await desktopPlay.click();
    const draggedDesktopRange = page.locator('.desktop-timeline .timeline-range');
    await draggedDesktopRange.evaluate((element) => {
      const input = element;
      input.value = '-205';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(80);
    ensure(!(page.url().includes('story=')), `${profile.name}: manual desktop timeline movement retained stale story state`);
    await desktopPlay.click();
    ensure((await page.locator('.narrative-map-heading h2').textContent()) === '彭城之战', `${profile.name}: desktop playback did not resume from the dragged timeline position`);
    const initialNarrativeTitle = await page.locator('.narrative-map-heading h2').textContent();
    await page.locator('.narrative-map-controls').getByRole('button', { name: '下一节' }).click();
    ensure((await page.locator('.narrative-map-heading h2').textContent()) !== initialNarrativeTitle, `${profile.name}: next narrative step did not change the story`);
    await page.locator('.narrative-map-controls').getByRole('button', { name: '退出叙事' }).click();
    ensure(!(await page.locator('.narrative-map-panel').isVisible()), `${profile.name}: exiting narrative did not close the story panel`);
    ensure(await page.locator('.geography-layer-performance').count() === 0, `${profile.name}: full geography did not return after narrative exit`);
    const desktopMapCanvas = page.locator('.map-canvas');
    const nativeWheelPrevented = await desktopMapCanvas.evaluate((element) => {
      const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -120, clientX: 220, clientY: 220 });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    });
    ensure(nativeWheelPrevented, `${profile.name}: map wheel listener did not prevent browser scrolling`);
    await page.waitForTimeout(100);
    const mapScaleBeforeWheel = Number(await desktopMapCanvas.getAttribute('data-map-scale'));
    const mapCanvasBox = await desktopMapCanvas.boundingBox();
    ensure(mapCanvasBox, `${profile.name}: map canvas has no dimensions`);
    await desktopMapCanvas.hover({ position: { x: mapCanvasBox.width * .78, y: mapCanvasBox.height * .78 } });
    const pageScrollBeforeWheel = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, -240);
    await page.waitForTimeout(120);
    ensure(Number(await desktopMapCanvas.getAttribute('data-map-scale')) > mapScaleBeforeWheel, `${profile.name}: native desktop wheel did not zoom the map`);
    const pageScrollAfterWheel = await page.evaluate(() => window.scrollY);
    ensure(Math.abs(pageScrollAfterWheel - pageScrollBeforeWheel) <= 1, `${profile.name}: native map wheel scrolled the document (${pageScrollBeforeWheel} -> ${pageScrollAfterWheel})`);
    ensure(await page.locator('#map-legend').isVisible(), `${profile.name}: desktop legend is not visible`);
    ensure(await page.getByText('台湾省', { exact: true }).isVisible(), `${profile.name}: Taiwan province is missing from the default map view`);
    const desktopRange = page.locator('.desktop-timeline .timeline-range');
    const territoryStages = [
      { year: '-230', polityId: 'han-state' },
      { year: '-220', polityId: 'qin' },
      { year: '-209', polityId: 'zhangchu' },
      { year: '-201', polityId: 'xiongnu' },
      { year: '-206', polityId: 'western-chu' },
    ];
    for (const stage of territoryStages) {
      await desktopRange.evaluate((element, year) => {
        const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        valueSetter?.call(element, year);
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }, stage.year);
      await page.waitForTimeout(450);
      ensure(await page.locator(`[data-polity-id="${stage.polityId}"].territory-current`).count() >= 1, `${profile.name}: territory stage ${stage.year} is missing ${stage.polityId}`);
    }
    ensure(await page.locator('.event-card').count() >= 4, `${profile.name}: event overview does not expose enough simultaneous events`);
    ensure(await page.locator('.territory-current').count() >= 2, `${profile.name}: Chu-Han territory layer is missing`);
    ensure(await page.locator('[data-polity-id="han"].territory-current').count() >= 1, `${profile.name}: Han territory is missing`);
    ensure(await page.locator('[data-polity-id="western-chu"].territory-current').count() >= 1, `${profile.name}: Western Chu territory is missing`);
    const territoryFont = await page.locator('.territory-label text').first().evaluate((element) => getComputedStyle(element).fontFamily);
    ensure(!territoryFont.includes('LiSu') && !territoryFont.includes('STLiti'), `${profile.name}: territory labels still use clerical script`);
    await desktopRange.evaluate((element) => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      valueSetter?.call(element, '-180');
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(450);
    ensure((await desktopRange.inputValue()) === '-200', `${profile.name}: legacy out-of-range year did not clamp to the compact topic end`);
    ensure(!(await page.locator('.map-empty-state').isVisible()), `${profile.name}: compact topic end should show its final historical event`);
    ensure(await page.locator('.event-card').filter({ hasText: '白登之围' }).count() >= 1, `${profile.name}: final White Deng event is missing at the compact topic end`);
    await desktopRange.evaluate((element, year) => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      valueSetter?.call(element, year);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }, '-206');
    await page.waitForTimeout(450);
    const browserBox = await page.locator('.event-browser').boundingBox();
    const overviewBox = await page.locator('.event-overview').boundingBox();
    ensure(browserBox && overviewBox && overviewBox.height >= browserBox.height * .45, `${profile.name}: event overview is still vertically constrained`);
    await page.locator('.event-overview').evaluate((element) => { element.scrollTop = 90; });
    const firstDesktopEvent = page.locator('.event-card').nth(3);
    await firstDesktopEvent.hover();
    ensure(await page.locator('.event-node-active').count() > 0, `${profile.name}: list hover did not activate a map node`);
    await firstDesktopEvent.click();
    ensure(await page.getByRole('dialog').isVisible(), `${profile.name}: event detail drawer did not open`);
    ensure(await page.locator('.territory-active').count() > 0, `${profile.name}: selected event did not highlight related territory`);
    ensure(await page.locator('.territory-muted').count() > 0, `${profile.name}: selected event did not mute unrelated territory`);
    const scrollBefore = await page.locator('.event-overview').evaluate((element) => element.scrollTop);
    await page.getByRole('button', { name: '关闭详情' }).click();
    ensure(!(await page.getByRole('dialog').isVisible()), `${profile.name}: close button did not close event detail`);
    const scrollAfter = await page.locator('.event-overview').evaluate((element) => element.scrollTop);
    ensure(Math.abs(scrollAfter - scrollBefore) <= 2, `${profile.name}: event list scroll position was not preserved (${scrollBefore} -> ${scrollAfter})`);
    const territoryToggle = page.getByRole('button', { name: '势力', exact: true });
    const geographyToggle = page.getByRole('button', { name: '地形', exact: true });
    const placesToggle = page.getByRole('button', { name: '古地名', exact: true });
    const modernToggle = page.getByRole('button', { name: '今地名', exact: true });
    await geographyToggle.click();
    ensure((await geographyToggle.getAttribute('aria-pressed')) === 'false', `${profile.name}: geography toggle did not turn off`);
    ensure(await page.locator('.geography-layer').count() === 0, `${profile.name}: geography layer remained after being disabled`);
    await geographyToggle.click();
    ensure((await geographyToggle.getAttribute('aria-pressed')) === 'true', `${profile.name}: geography toggle did not turn back on`);
    ensure(await page.locator('.geography-layer').count() === 1, `${profile.name}: geography layer did not return after being enabled`);
    ensure(await page.locator('.historical-place-layer').count() === 1, `${profile.name}: historical place layer is missing`);
    await placesToggle.click();
    ensure((await placesToggle.getAttribute('aria-pressed')) === 'false', `${profile.name}: places toggle did not turn off`);
    ensure(await page.locator('.historical-place-layer').count() === 0, `${profile.name}: place layer remained after being disabled`);
    await placesToggle.click();
    ensure((await placesToggle.getAttribute('aria-pressed')) === 'true', `${profile.name}: places toggle did not turn back on`);
    ensure(await page.locator('.historical-place-layer').count() === 1, `${profile.name}: place layer did not return after being enabled`);
    await modernToggle.click();
    ensure((await modernToggle.getAttribute('aria-pressed')) === 'true', `${profile.name}: modern place layer did not turn on`);
    ensure(await page.locator('.modern-place-layer').count() === 1, `${profile.name}: modern reference place layer is missing`);
    await modernToggle.click();
    ensure((await modernToggle.getAttribute('aria-pressed')) === 'false', `${profile.name}: modern place layer did not turn off`);
    await territoryToggle.click();
    ensure((await territoryToggle.getAttribute('aria-pressed')) === 'false', `${profile.name}: territory toggle did not turn off`);
    ensure(await page.locator('.territory-layer').count() === 0, `${profile.name}: territory layer remained after being disabled`);
    ensure(await page.locator('.event-node').count() > 0, `${profile.name}: disabling territory hid event nodes`);
    await territoryToggle.click();
    ensure((await territoryToggle.getAttribute('aria-pressed')) === 'true', `${profile.name}: territory toggle did not turn back on`);
    await page.getByRole('button', { name: '关闭动效' }).click();
    ensure(await page.getByRole('button', { name: '开启动效' }).isVisible(), `${profile.name}: animation toggle did not update`);
    const zoomIn = page.getByRole('button', { name: '放大地图' });
    await zoomIn.click();
    await zoomIn.click();
    ensure(await page.getByText('台湾省', { exact: true }).isVisible(), `${profile.name}: Taiwan province disappeared after zooming`);
    const firstEventTransform = await page.locator('.event-node').first().getAttribute('transform');
    const markerScale = Number(/scale\(([^)]+)\)/.exec(firstEventTransform ?? '')?.[1]);
    const mapScale = Number(await page.locator('.map-canvas').getAttribute('data-map-scale'));
    ensure(Number.isFinite(markerScale) && Math.abs(markerScale - 1 / mapScale) < .001, `${profile.name}: event markers did not counter-scale after zooming`);
  }

  // Desktop full-page rasterization can exceed the local automation watchdog
  // on high-resolution profiles without increasing interaction coverage.
  // The viewport capture still records the complete desktop map workspace.
  await capture(page, `${profile.name}.png`, profile.mobile);
  await page.goto(`${baseUrl}/?scenario=qin-han&year=-206&event=gaixia-battle&z=2.00&x=0&y=0`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.locator('.map-frame').waitFor({ state: 'visible' });
  await page.waitForTimeout(550);
  ensure((await page.locator('.timeline-range').first().inputValue()) === '-206', `${profile.name}: shared URL did not restore the requested year`);
  ensure((await page.locator('.map-canvas').getAttribute('data-map-scale')) === '2.000', `${profile.name}: shared URL did not restore the requested map scale`);
  ensure(await page.getByRole('dialog').isVisible(), `${profile.name}: shared URL did not restore the selected event detail`);
  ensure(await page.getByRole('dialog').getByText('垓下之战', { exact: true }).isVisible(), `${profile.name}: shared URL restored the wrong event`);
  await page.goto(`${baseUrl}/?scenario=han-three-kingdoms&year=23&event=han-kunyang-battle&story=han-kunyang-battle&z=1.85&x=0&y=0`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.locator('.map-frame').waitFor({ state: 'visible' });
  await page.waitForTimeout(550);
  ensure((await page.locator('.timeline-range').first().inputValue()) === '23', `${profile.name}: Han topic shared URL did not restore the requested year`);
  ensure(await page.locator('.narrative-map-panel').isVisible(), `${profile.name}: Han topic shared URL did not restore narrative context`);
  ensure((await page.locator('.narrative-map-heading .eyebrow').textContent())?.includes('两汉至三国'), `${profile.name}: narrative card did not identify its scenario`);
  ensure(!(await page.getByRole('button', { name: '暂停播放' }).isVisible()), `${profile.name}: restored Han story began playing automatically`);
  await page.goto(`${baseUrl}/?scenario=han-three-kingdoms&year=280&event=tk-jianye-surrenders&story=tk-jianye-surrenders&z=1.85&x=0&y=0`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.locator('.map-frame').waitFor({ state: 'visible' });
  await page.waitForTimeout(550);
  ensure((await page.locator('.timeline-range').first().inputValue()) === '280', `${profile.name}: Three Kingdoms endpoint URL did not restore year 280`);
  ensure(await page.getByText('西晋统一', { exact: true }).isVisible(), `${profile.name}: endpoint URL did not restore the historical breakpoint`);
  ensure(await page.locator('.narrative-map-heading h2').getByText('建业降晋与吴亡', { exact: true }).isVisible(), `${profile.name}: endpoint URL restored the wrong event`);
  ensure(runtimeErrors.length === 0, `${profile.name}: ${runtimeErrors.join('; ')}`);
  await context.close();
}
} finally {
  await Promise.all(Array.from(activeBrowsers.values(), (browser) => browser.close()));
}

process.stdout.write(`Browser matrix passed for ${selectedProfiles.length} profiles at ${baseUrl}\n`);
