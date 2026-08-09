export function Legend() {
  return <div className="legend" aria-label="地图图例"><p className="eyebrow">图例</p><div className="legend-grid"><span><i className="legend-dot legend-s" />大型事件</span><span><i className="legend-dot legend-a" />区域事件</span><span><i className="legend-cloud" />战争活动云团</span><span><i className="legend-route" />选中事件路线</span></div><p className="mt-2 text-[10px] leading-4 text-stone-500">云团表示当前时间窗口的事件密度与规模等级，不等同于伤亡人数。</p></div>;
}
