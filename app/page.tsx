'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { HistoricalMap, type LayerMode } from '@/components/HistoricalMap';
import { StatsPanel } from '@/components/StatsPanel';
import { Timeline } from '@/components/Timeline';
import { WarDetailDrawer } from '@/components/WarDetailDrawer';
import { eras } from '@/data/eras';
import { wars } from '@/data/wars';
import { END_YEAR, START_YEAR, activeWars, clampYear, formatYear } from '@/lib/timeline';
import type { WarEvent } from '@/lib/types';

export default function Home() {
  const [currentYear, setCurrentYear] = useState(START_YEAR);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1 | 2 | 4>(1);
  const [selectedWar, setSelectedWar] = useState<WarEvent>();
  const [layerMode, setLayerMode] = useState<LayerMode>('both');
  const [animations, setAnimations] = useState(true);
  const currentEra = eras.find((era) => currentYear >= era.startYear && currentYear <= era.endYear) ?? eras[0];
  const visibleWars = useMemo(() => activeWars(wars, currentYear), [currentYear]);

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
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <HistoricalMap wars={visibleWars} selectedWar={selectedWar} onSelect={setSelectedWar} layerMode={layerMode} animations={animations} onLayerMode={setLayerMode} onAnimations={setAnimations} />
        <div className="side-column"><StatsPanel wars={visibleWars} /><WarDetailDrawer war={selectedWar} onClose={() => setSelectedWar(undefined)} /></div>
      </div>
      <details className="data-note"><summary>关于地图、史料与不确定性</summary><div><p>底图来自 Natural Earth 1:110m 公共领域数据，仅作现代地理定位参考，不复原秦汉政区边界。事件年份、古地望、兵力与路线可能存在史学争议；页面用可信度、文字说明和来源字段表达这些限制。</p><p>云团综合当前时间窗口的事件数量与规模等级，只表示战争活动强度，不代表伤亡人数。路线用于说明大致进军方向，不应理解为精确到道路的行军轨迹。</p></div></details>
    </div>
    <Timeline currentYear={currentYear} isPlaying={isPlaying} speed={speed} eras={eras} onYearChange={changeYear} onToggle={() => setIsPlaying((value) => !value)} onSpeed={setSpeed} onEra={(era) => changeYear(era.startYear)} />
  </main>;
}
