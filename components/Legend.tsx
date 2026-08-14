import type { Polity, TerritorySnapshot } from '@/lib/types';

export function Legend({ open, territories, polities, onClose }: { open: boolean; territories: TerritorySnapshot[]; polities: Polity[]; onClose: () => void }) {
  const activePolityIds = new Set(territories.map((territory) => territory.polityId));
  const activePolities = polities.filter((polity) => activePolityIds.has(polity.id));
  return <div id="map-legend" className={`legend ${open ? 'legend-open' : ''}`} aria-label="地图图例" onClick={(event) => event.stopPropagation()}>
    <div className="legend-heading"><p className="eyebrow">图例</p><button className="legend-close" type="button" onClick={onClose} aria-label="关闭地图图例">×</button></div>
    <div className="legend-grid">
      <span><i className="legend-modern-land" />1:10m 海陆与海岸线</span><span><i className="legend-mountain" />地形晕染（阅读辅助）</span>
      <span><i className="legend-river" />1:10m 河湖水系</span><span><i className="legend-territory legend-core" />核心控制区</span>
      <span><i className="legend-place" />古地名 / 城邑 / 关隘</span>
      <span><i className="legend-territory legend-influence" />主要影响区</span><span><i className="legend-territory legend-contested" />争夺区 / 柔边</span>
      <span><i className="legend-territory legend-activity" />活动范围</span>
      <span><i className="legend-cloud" />战争活动热区</span><span><i className="legend-dot legend-a" />具体历史事件</span>
      <span><i className="legend-route" />选中事件路线</span>
    </div>
    <p className="legend-scale-note">地图会随比例尺自动增补信息：总览保留主河、都城与关隘；区域增加古地名与河网；局部才显示更多城邑与事件。</p>
    {activePolities.length > 0 && <div className="legend-polities" aria-label="当前势力">{activePolities.map((polity) => <span key={polity.id}><i style={{ backgroundColor: polity.color }} />{polity.name}</span>)}</div>}
    <p className="mt-2 text-[10px] leading-4 text-stone-500">古地名均为参考点，不绘制行政辖区面；“今地名”为 Natural Earth 公共领域现代定位参考。势力范围为阶段性历史地理示意，透明度、虚线和柔化边缘代表影响、争夺或不确定性，不代表精确、固定国界；热区表示事件密度与规模，不等同于伤亡人数。</p>
  </div>;
}
