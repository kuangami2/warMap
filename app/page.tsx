'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { HistoricalBreakpointNotice } from '@/components/HistoricalBreakpointNotice';
import { HistoricalMap, type MapLayers } from '@/components/HistoricalMap';
import { MapExplorer } from '@/components/MapExplorer';
import { NarrativeMapPanel } from '@/components/NarrativeMapPanel';
import { StatsPanel } from '@/components/StatsPanel';
import { MobileTimeline, Timeline, type PlaybackStatus } from '@/components/Timeline';
import { WarDetailDrawer } from '@/components/WarDetailDrawer';
import { EvidenceDesk } from '@/components/EvidenceDesk';
import { mapFeatureSources } from '@/data/mapFeatures';
import { historicalBreakpointForYear } from '@/data/historicalBreakpoints';
import { scenarios } from '@/data/scenarios';
import { initialScenarioData, loadClientScenarioData, preloadClientScenario, resolveClientScenarioId } from '@/lib/client-scenario-repository';
import { emptyExplorerFilters, explorerFiltersFromUrl, sanitizeExplorerFilters, writeExplorerFiltersToUrl, type ExplorerFilters } from '@/lib/explorer';
import { createNarrativeMoments, narrativeMomentById, narrativeMomentForYear, nextNarrativeMoment, previousNarrativeMoment } from '@/lib/narrative';
import { activeTerritories } from '@/lib/territories';
import { activeWars, clampYear, formatYear } from '@/lib/timeline';
import { timelineContextForYear } from '@/lib/timeline-context';
import { constrainMapViewport, INITIAL_MAP_VIEWPORT, type MapFocusTarget } from '@/lib/mapViewport';
import type { WarEvent } from '@/lib/types';

type PlaybackCursor = { year: number; status: PlaybackStatus };

export default function Home() {
  // Static HTML and the first client render must agree. URL state is restored
  // after hydration below, so a shared non-default topic cannot cause a text
  // tree mismatch in static hosting.
  const [scenarioId, setScenarioId] = useState('qin-han');
  const [data, setData] = useState(initialScenarioData);
  const [isScenarioLoading, setIsScenarioLoading] = useState(false);
  const scenarioRequestRef = useRef(0);
  const { scenario, eras, polities, places, territories, wars, narrativeEventIds } = data;
  const [playback, setPlayback] = useState<PlaybackCursor>(() => ({ year: scenario.startYear, status: 'idle' }));
  const [speed, setSpeed] = useState<0.5 | 1 | 2 | 4>(1);
  const [selectedWar, setSelectedWar] = useState<WarEvent>();
  const [hoveredWar, setHoveredWar] = useState<WarEvent>();
  const [layers, setLayers] = useState<MapLayers>({ geography: true, places: true, modern: false, territories: true, clouds: true, nodes: true, routes: true, imagery: true });
  const [animations, setAnimations] = useState(true);
  const [mapViewport, setMapViewport] = useState(INITIAL_MAP_VIEWPORT);
  const [focusTarget, setFocusTarget] = useState<MapFocusTarget>();
  const [narrativeMomentId, setNarrativeMomentId] = useState<string>();
  const [explorerFilters, setExplorerFilters] = useState<ExplorerFilters>(emptyExplorerFilters);
  const [urlReady, setUrlReady] = useState(false);
  const narrativeMoments = useMemo(() => createNarrativeMoments(wars, narrativeEventIds), [narrativeEventIds, wars]);
  const narrativeMoment = narrativeMomentById(narrativeMoments, narrativeMomentId);
  const currentYear = playback.year;
  const isPlaying = playback.status === 'playing';
  const currentEra = eras.find((era) => currentYear >= era.startYear && currentYear <= era.endYear) ?? eras[0];
  const visibleWars = useMemo(() => activeWars(wars, currentYear), [currentYear, wars]);
  const visibleTerritories = useMemo(() => activeTerritories(territories, currentYear), [currentYear, territories]);
  const historicalBreakpoint = useMemo(() => historicalBreakpointForYear(scenario.id, currentYear), [currentYear, scenario.id]);
  const timelineContext = useMemo(() => timelineContextForYear(wars, data.coverage, currentYear), [currentYear, data.coverage, wars]);

  const updateUrlNow = useCallback((next: { scenarioId?: string; year?: number; eventId?: string; storyId?: string }) => {
    if (!urlReady) return;
    const url = new URL(window.location.href);
    url.searchParams.set('scenario', next.scenarioId ?? scenario.id);
    url.searchParams.set('year', String(next.year ?? currentYear));
    if (next.eventId) url.searchParams.set('event', next.eventId); else url.searchParams.delete('event');
    if (next.storyId) url.searchParams.set('story', next.storyId); else url.searchParams.delete('story');
    writeExplorerFiltersToUrl(url.searchParams, explorerFilters);
    window.history.replaceState(null, '', url.toString());
  }, [currentYear, explorerFilters, scenario.id, urlReady]);

  const exitNarrative = useCallback(() => { setPlayback((current) => ({ ...current, status: 'idle' })); setNarrativeMomentId(undefined); }, []);
  const closeWarDetails = useCallback(() => { exitNarrative(); setSelectedWar(undefined); }, [exitNarrative]);

  const showNarrativeMoment = useCallback((momentId: string, playing = false, requestedYear?: number) => {
    const moment = narrativeMomentById(narrativeMoments, momentId);
    const war = moment ? wars.find((candidate) => candidate.id === moment.eventId) : undefined;
    if (!moment || !war) return;
    const year = requestedYear !== undefined && requestedYear >= moment.startYear && requestedYear <= moment.endYear ? requestedYear : moment.startYear;
    setPlayback({ year, status: playing ? 'playing' : 'paused' });
    setSelectedWar(war);
    setHoveredWar(undefined);
    setNarrativeMomentId(moment.id);
    setFocusTarget((current) => ({ id: `story-${scenario.id}-${moment.id}-${current?.id === `story-${scenario.id}-${moment.id}` ? 'again' : 'focus'}`, coordinate: moment.focus.coordinate, scale: moment.focus.scale }));
    updateUrlNow({ year, eventId: war.id, storyId: moment.id });
  }, [narrativeMoments, scenario.id, updateUrlNow, wars]);

  const changeScenario = useCallback(async (nextScenarioId: string) => {
    const requestedScenarioId = resolveClientScenarioId(nextScenarioId);
    if (requestedScenarioId === scenarioId) return;
    const requestId = ++scenarioRequestRef.current;
    setIsScenarioLoading(true);
    const next = await loadClientScenarioData(requestedScenarioId);
    if (requestId !== scenarioRequestRef.current) return;
    setData(next);
    setScenarioId(next.scenario.id);
    setPlayback({ year: next.scenario.startYear, status: 'idle' });
    setSelectedWar(undefined);
    setHoveredWar(undefined);
    setNarrativeMomentId(undefined);
    setMapViewport(INITIAL_MAP_VIEWPORT);
    setFocusTarget(undefined);
    setExplorerFilters(emptyExplorerFilters());
    setIsScenarioLoading(false);
  }, [scenarioId]);

  const toggleNarrative = useCallback(() => {
    if (isPlaying) { setPlayback((current) => ({ ...current, status: 'paused' })); return; }
    if (playback.status === 'ended') {
      const first = narrativeMoments[0];
      if (first) showNarrativeMoment(first.id, true);
      return;
    }
    // A paused story already has its own chapter, year and camera. Resuming
    // must preserve those values instead of replaying chapter one.
    if (narrativeMoment) { setPlayback((current) => ({ ...current, status: 'playing' })); return; }
    const moment = narrativeMomentForYear(narrativeMoments, currentYear);
    if (moment) showNarrativeMoment(moment.id, true, currentYear);
    else setPlayback((current) => ({ ...current, status: 'ended' }));
  }, [currentYear, isPlaying, narrativeMoment, narrativeMoments, playback.status, showNarrativeMoment]);
  const timelineProps = { currentYear, startYear: scenario.startYear, endYear: scenario.endYear, playbackStatus: playback.status, speed, eras, onYearChange: changeYear, onToggle: toggleNarrative, onSpeed: setSpeed, onEra: (era: (typeof eras)[number]) => changeYear(era.startYear) };

  useEffect(() => {
    if (!isPlaying || !narrativeMoment) return;
    const timer = window.setTimeout(() => {
      const next = nextNarrativeMoment(narrativeMoments, narrativeMoment.id);
      if (next) showNarrativeMoment(next.id, true); else setPlayback((current) => ({ ...current, status: 'ended' }));
    }, 3200 / speed);
    return () => window.clearTimeout(timer);
  }, [isPlaying, narrativeMoment, narrativeMoments, showNarrativeMoment, speed]);

  useEffect(() => {
    if (urlReady) return;
    const parameters = new URLSearchParams(window.location.search);
    const requestedScenario = resolveClientScenarioId(parameters.get('scenario') ?? undefined);
    let cancelled = false;
    const restoreTimer = window.setTimeout(async () => {
      const requestedData = await loadClientScenarioData(requestedScenario);
      if (cancelled) return;
      if (requestedScenario !== scenarioId) {
        setData(requestedData);
        setScenarioId(requestedScenario);
      }
      const requestedYearParameter = parameters.get('year');
      const requestedYear = requestedYearParameter === null ? Number.NaN : Number(requestedYearParameter);
      const year = Number.isFinite(requestedYear) ? clampYear(requestedYear, requestedData.scenario.startYear, requestedData.scenario.endYear) : requestedData.scenario.startYear;
      setPlayback({ year, status: 'idle' });
      const requestedWar = parameters.get('event');
      if (requestedWar) setSelectedWar(requestedData.wars.find((war) => war.id === requestedWar));
      const moments = createNarrativeMoments(requestedData.wars, requestedData.narrativeEventIds);
      const requestedStory = narrativeMomentById(moments, parameters.get('story') ?? undefined);
      if (requestedStory) {
        const restoredYear = year >= requestedStory.startYear && year <= requestedStory.endYear ? year : requestedStory.startYear;
        setPlayback({ year: restoredYear, status: 'paused' });
        setSelectedWar(requestedData.wars.find((war) => war.id === requestedStory.eventId));
        setNarrativeMomentId(requestedStory.id);
        setFocusTarget({ id: `story-${requestedScenario}-${requestedStory.id}`, coordinate: requestedStory.focus.coordinate, scale: requestedStory.focus.scale });
      }
      const scale = Number(parameters.get('z')); const x = Number(parameters.get('x')); const y = Number(parameters.get('y'));
      if (Number.isFinite(scale) && Number.isFinite(x) && Number.isFinite(y)) setMapViewport(constrainMapViewport({ scale, x, y }));
      setExplorerFilters(explorerFiltersFromUrl(parameters, requestedData));
      setUrlReady(true);
    }, 0);
    return () => { cancelled = true; window.clearTimeout(restoreTimer); };
  }, [scenarioId, urlReady]);

  useEffect(() => {
    // Keep the alternate scenario out of the first bundle, then warm it after
    // the first map is responsive. Subsequent topic switches use this cache.
    const warm = () => preloadClientScenario('han-three-kingdoms');
    const idleWindow = window as unknown as { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (handle: number) => void };
    const idle = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(warm, { timeout: 3500 })
      : window.setTimeout(warm, 2200);
    return () => {
      if (idleWindow.cancelIdleCallback && idleWindow.requestIdleCallback) idleWindow.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
    };
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    const updateUrl = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const researchIds = url.searchParams.get('research');
      url.search = '';
      url.searchParams.set('scenario', scenario.id);
      url.searchParams.set('year', String(currentYear));
      if (selectedWar) url.searchParams.set('event', selectedWar.id);
      if (narrativeMoment) url.searchParams.set('story', narrativeMoment.id);
      writeExplorerFiltersToUrl(url.searchParams, explorerFilters);
      if (researchIds) url.searchParams.set('research', researchIds);
      url.searchParams.set('z', mapViewport.scale.toFixed(2));
      url.searchParams.set('x', mapViewport.x.toFixed(1));
      url.searchParams.set('y', mapViewport.y.toFixed(1));
      window.history.replaceState(null, '', url.toString());
    }, 180);
    return () => window.clearTimeout(updateUrl);
  }, [currentYear, explorerFilters, mapViewport, narrativeMoment, scenario.id, selectedWar, urlReady]);

  function changeYear(year: number) {
    const nextYear = clampYear(year, scenario.startYear, scenario.endYear);
    const lastMoment = narrativeMoments[narrativeMoments.length - 1];
    setPlayback({ year: nextYear, status: lastMoment && nextYear > lastMoment.endYear ? 'ended' : 'paused' });
    setNarrativeMomentId(undefined);
    setSelectedWar(undefined);
    updateUrlNow({ year: nextYear });
  }
  function requestFocus(id: string, coordinate: [number, number], scale: number) { setFocusTarget((current) => ({ id: `${id}-${current?.id === id ? 'again' : 'focus'}`, coordinate, scale })); }
  function focusPlace(place: (typeof places)[number]) { exitNarrative(); if (currentYear < place.startYear || currentYear > place.endYear) setPlayback({ year: place.startYear, status: 'idle' }); requestFocus(`place-${place.id}`, [place.longitude, place.latitude], Math.max(1.55, place.minZoom + .4)); }
  function focusWar(war: WarEvent) { exitNarrative(); setPlayback({ year: war.startYear, status: 'idle' }); setSelectedWar(war); const location = war.locations[0]; if (location) requestFocus(`war-${war.id}`, [location.longitude, location.latitude], 1.8); }
  async function shareMap() { const currentUrl = new URL(window.location.href); const researchIds = currentUrl.searchParams.get('research'); const url = new URL(window.location.href); url.search = ''; url.searchParams.set('scenario', scenario.id); url.searchParams.set('year', String(currentYear)); if (selectedWar) url.searchParams.set('event', selectedWar.id); if (narrativeMoment) url.searchParams.set('story', narrativeMoment.id); writeExplorerFiltersToUrl(url.searchParams, explorerFilters); if (researchIds) url.searchParams.set('research', researchIds); url.searchParams.set('z', mapViewport.scale.toFixed(2)); url.searchParams.set('x', mapViewport.x.toFixed(1)); url.searchParams.set('y', mapViewport.y.toFixed(1)); try { await navigator.clipboard.writeText(url.toString()); return true; } catch { return false; } }

  return <main className="min-h-screen bg-stone-950 text-stone-100">
    <Header scenario={scenario} eraName={`${scenario.name} · ${currentEra.name}`} scenarios={scenarios} onScenario={changeScenario} loading={isScenarioLoading} />
    <div className="mx-auto max-w-[1600px] p-4 md:p-7">
      <section className={`narrative-strip ${timelineContext.status !== 'eventful' ? 'narrative-strip-empty' : ''}`}><div><p className="eyebrow">{formatYear(currentYear)} · {currentEra.name}</p><p className="mt-1 text-sm leading-6 text-stone-200">{timelineContext.status === 'eventful' ? currentEra.description : timelineContext.note}</p></div><div className="narrative-metric"><strong>{visibleWars.length}</strong><span>{timelineContext.status === 'not-curated' ? '待审校窗口' : '当前窗口事件'}</span></div></section>
      <HistoricalBreakpointNotice breakpoint={historicalBreakpoint} />
      <MobileTimeline {...timelineProps} />
      <MapExplorer data={data} scenarios={scenarios} filters={explorerFilters} onFiltersChange={(next) => setExplorerFilters(sanitizeExplorerFilters(next, data))} onScenario={changeScenario} onPlace={focusPlace} onWar={focusWar} onShare={shareMap} />
      <EvidenceDesk data={data} />
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <HistoricalMap wars={visibleWars} places={places} currentYear={currentYear} landmarkImages={data.landmarkImages} viewport={mapViewport} focusTarget={focusTarget} territories={visibleTerritories} polities={polities} selectedWar={selectedWar} hoveredWar={hoveredWar} onSelect={(war) => { exitNarrative(); setSelectedWar(war); }} onHover={setHoveredWar} layers={layers} animations={animations} narrativeMode={Boolean(narrativeMoment)} onLayers={setLayers} onAnimations={setAnimations} onViewportChange={setMapViewport} />
        <div className="side-column"><NarrativeMapPanel moment={narrativeMoment} war={narrativeMoment ? wars.find((war) => war.id === narrativeMoment.eventId) : undefined} scenarioName={scenario.name} total={narrativeMoments.length} playbackStatus={playback.status} onPrevious={() => { const previous = previousNarrativeMoment(narrativeMoments, narrativeMomentId); if (previous) showNarrativeMoment(previous.id, false); }} onNext={() => { const next = nextNarrativeMoment(narrativeMoments, narrativeMomentId); if (next) showNarrativeMoment(next.id, false); }} onExit={exitNarrative} /><StatsPanel wars={visibleWars} territoryCount={visibleTerritories.length} selectedWar={selectedWar} context={timelineContext} onSelect={(war) => { exitNarrative(); setSelectedWar(war); }} onHover={setHoveredWar} /><WarDetailDrawer war={narrativeMoment ? undefined : selectedWar} onClose={closeWarDetails} /></div>
      </div>
      <details className="data-note"><summary>关于地图、史料与不确定性</summary><div><p>自然地理底图来自本地裁切的 Natural Earth 1:10m 公共领域数据，包含现代海岸、陆地、湖泊与河流，仅作地理定位参考，不复原任何时期的行政边界。势力图层区分核心控制、主要影响、争夺和活动范围；透明度、虚线及柔化边缘均表示不确定性，不代表精确固定国界。</p><p>“古地名”图层显示经史料/图集核对的郡国、县治、城邑和关隘参考点，按当前专题、年代与缩放级别筛选；它不绘制、也不暗示精确行政辖区边界。每个点均保留古今对照、来源、可信度和异说说明。“今地名”图层来自 Natural Earth 1:50m Populated Places 公共领域数据，仅帮助现代地理定位，不是历史行政数据。</p><p>历史行政区面授权闸门目前关闭：已核对的 CHGIS 许可禁止再分发，且尚无其他可公开再分发、可审校的两汉三国边界包。因此 2.0 定位为专业自然地理、历史地点、势力范围与战争叙事地图，不声称精确历史行政区地图。</p><p>地图资产来源：{mapFeatureSources.map((source) => `${source.title} v${source.version}（${source.license}；${source.usage}）`).join('；')}。事件年份、古地望、兵力与路线可能存在史学争议；页面使用可信度、文字说明和来源字段表达这些限制。</p></div></details>
    </div>
    <Timeline {...timelineProps} />
  </main>;
}
