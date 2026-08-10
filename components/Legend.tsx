import type { Polity, TerritorySnapshot } from '@/lib/types';

export function Legend({ open, territories, polities, onClose }: { open: boolean; territories: TerritorySnapshot[]; polities: Polity[]; onClose: () => void }) {
  const activePolityIds = new Set(territories.map((territory) => territory.polityId));
  const activePolities = polities.filter((polity) => activePolityIds.has(polity.id));
  return <div id="map-legend" className={`legend ${open ? 'legend-open' : ''}`} aria-label="地图图例" onClick={(event) => event.stopPropagation()}>
    <div className="legend-heading"><p className="eyebrow">图例</p><button className="legend-close" type="button" onClick={onClose} aria-label="关闭地图图例">×</button></div>
    <div className="legend-grid">
      <span><i className="legend-modern-land" />现代地理轮廓</span><span><i className="legend-territory" />历史大致范围</span>
      <span><i className="legend-cloud" />战争活动热区</span><span><i className="legend-dot legend-a" />具体历史事件</span>
      <span><i className="legend-route" />选中事件路线</span>
    </div>
    {activePolities.length > 0 && <div className="legend-polities" aria-label="当前势力">{activePolities.map((polity) => <span key={polity.id}><i style={{ backgroundColor: polity.color }} />{polity.name}</span>)}</div>}
    <p className="mt-2 text-[10px] leading-4 text-stone-500">势力范围为阶段性历史地理示意，不代表精确、固定的现代国界或行政边界；热区表示事件密度与规模，不等同于伤亡人数。</p>
  </div>;
}
