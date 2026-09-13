import { formatYear } from '@/lib/timeline';
import type { WarEvent } from '@/lib/types';

export function EventComparePanel({ first, second, onClose }: { first: WarEvent; second: WarEvent; onClose: () => void }) {
  const column = (war: WarEvent) => <article className="compare-column"><div className="compare-column-heading"><div><p className="eyebrow">{formatYear(war.startYear)}{war.endYear !== war.startYear ? `—${formatYear(war.endYear)}` : ''}</p><h3>{war.name}</h3></div></div><dl><div><dt>事件性质</dt><dd>{war.kind}</dd></div><div><dt>地点</dt><dd>{war.locations.map((location) => location.name).join('、')}</dd></div><div><dt>参与方</dt><dd>{war.participants.map((participant) => participant.name).join('、')}</dd></div><div><dt>结果</dt><dd>{war.result}</dd></div><div><dt>可信度</dt><dd>{war.confidence === 'high' ? '高' : war.confidence === 'medium' ? '中' : '低'}</dd></div></dl></article>;
  return <section className="compare-panel" aria-label="事件对比"><div className="compare-header"><div><p className="eyebrow">研究视图</p><h2>事件对比</h2></div><button type="button" className="close-button" onClick={onClose} aria-label="关闭事件对比">×</button></div><div className="compare-grid">{column(first)}{column(second)}</div></section>;
}
