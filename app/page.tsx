'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { HistoricalMap, type MapLayers } from '@/components/HistoricalMap';
import { StatsPanel } from '@/components/StatsPanel';
import { MobileTimeline, Timeline } from '@/components/Timeline';
import { WarDetailDrawer } from '@/components/WarDetailDrawer';
import { eras } from '@/data/eras';
import { polities } from '@/data/polities';
import { territories } from '@/data/territories';
import { wars } from '@/data/wars';
import { activeTerritories } from '@/lib/territories';
import { END_YEAR, START_YEAR, activeWars, clampYear, formatYear } from '@/lib/timeline';
import type { WarEvent } from '@/lib/types';

export default function Home() {
  const [currentYear, setCurrentYear] = useState(START_YEAR);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1 | 2 | 4>(1);
  const [selectedWar, setSelectedWar] = useState<WarEvent>();
  const [hoveredWar, setHoveredWar] = useState<WarEvent>();
  const [layers, setLayers] = useState<MapLayers>({ territories: true, clouds: true, nodes: true, routes: true });
  const [animations, setAnimations] = useState(true);
  const currentEra = eras.find((era) => currentYear >= era.startYear && currentYear <= era.endYear) ?? eras[0];
  const visibleWars = useMemo(() => activeWars(wars, currentYear), [currentYear]);
  const visibleTerritories = useMemo(() => activeTerritories(territories, currentYear), [currentYear]);
  const closeWarDetails = useCallback(() => setSelectedWar(undefined), []);
  const timelineProps = { currentYear, isPlaying, speed, eras, onYearChange: changeYear, onToggle: () => setIsPlaying((value) => !value), onSpeed: setSpeed, onEra: (era: (typeof eras)[number]) => changeYear(era.startYear) };

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => setCurrentYear((year) => {
      if (year >= END_YEAR) { setIsPlaying(false); return END_YEAR; }
      return year + 1;
    }), 1200 / speed);
    return () => window.clearInterval(timer);
  }, [isPlaying, speed]);

  function changeYear(year: number) { setIsPlaying(false); setCurrentYear(clampYear(year)); setSelectedWar(undefined); }
  return <main className="min-h-screen bg-stone-950 text-stone-100">
    <Header eraName={currentEra.name} />
    <div className="mx-auto max-w-[1600px] p-4 md:p-7">
      <section className="narrative-strip"><div><p className="eyebrow">{formatYear(currentYear)} · {currentEra.name}</p><p className="mt-1 text-sm leading-6 text-stone-200">{currentEra.description}</p></div><div className="narrative-metric"><strong>{visibleWars.length}</strong><span>当前窗口事件</span></div></section>
      <MobileTimeline {...timelineProps} />
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <HistoricalMap wars={visibleWars} territories={visibleTerritories} polities={polities} selectedWar={selectedWar} hoveredWar={hoveredWar} onSelect={setSelectedWar} onHover={setHoveredWar} layers={layers} animations={animations} onLayers={setLayers} onAnimations={setAnimations} />
        <div className="side-column"><StatsPanel wars={visibleWars} selectedWar={selectedWar} onSelect={setSelectedWar} onHover={setHoveredWar} /><WarDetailDrawer war={selectedWar} onClose={closeWarDetails} /></div>
      </div>
      <details className="data-note"><summary>关于地图、史料与不确定性</summary><div><p>底图来自 Natural Earth 1:110m 公共领域数据，仅作现代地理定位参考，不复原秦汉政区边界。事件年份、古地望、兵力与路线可能存在史学争议；页面用可信度、文字说明和来源字段表达这些限制。</p><p>云团综合当前时间窗口的事件数量与规模等级，只表示战争活动强度，不代表伤亡人数。路线用于说明大致进军方向，不应理解为精确到道路的行军轨迹。</p></div></details>
    </div>
    <Timeline {...timelineProps} />
  </main>;
}
