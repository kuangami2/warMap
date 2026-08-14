import { formatYear } from '@/lib/timeline';
import type { NarrativeMoment, WarEvent } from '@/lib/types';

type NarrativeMapPanelProps = {
  moment?: NarrativeMoment;
  war?: WarEvent;
  scenarioName: string;
  total: number;
  isPlaying: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
};

function confidenceLabel(confidence: NarrativeMoment['confidence']) {
  return confidence === 'high' ? '高可信度' : confidence === 'medium' ? '中可信度' : '低可信度';
}

export function NarrativeMapPanel({ moment, war, scenarioName, total, isPlaying, onPrevious, onNext, onExit }: NarrativeMapPanelProps) {
  if (!moment) return null;
  const position = moment.order + 1;
  return <section className={`panel narrative-map-panel ${isPlaying ? 'narrative-map-panel-playing' : ''}`} aria-label="战争叙事地图" aria-live="polite">
    <div className="narrative-map-heading">
      <div><p className="eyebrow">{scenarioName} · 战争叙事 · 第 {position} / {total} 节</p><h2>{moment.title}</h2></div>
      <span className={`narrative-status ${isPlaying ? 'narrative-status-playing' : ''}`}>{isPlaying ? '正在讲述' : '已暂停'}</span>
    </div>
    <p className="narrative-map-years">{formatYear(moment.startYear)}{moment.endYear !== moment.startYear ? `—${formatYear(moment.endYear)}` : ''}{moment.hasRoute ? ' · 路线推演' : ' · 战场聚焦'}</p>
    <p className="narrative-map-text">{moment.text}</p>
    <p className="narrative-map-source"><span>{confidenceLabel(moment.confidence)}</span><span>{moment.sourceTitle}</span></p>
    {war && <div className="narrative-map-references"><p>研究条目</p><ul>{war.sources.map((source) => <li key={source.id ?? source.title}><strong>{source.title}</strong>{source.citation ? `：${source.citation}` : ''}{source.claim ? `（${source.claim}）` : ''}</li>)}</ul>{war.locations.some((location) => location.note) && <p className="narrative-map-place-note">地望说明：{war.locations.map((location) => location.note).filter(Boolean).join('；')}</p>}{war.uncertaintyNote && <p className="narrative-map-uncertainty">争议与边界：{war.uncertaintyNote}</p>}</div>}
    <div className="narrative-map-controls">
      <button type="button" onClick={onPrevious} disabled={position === 1}>上一节</button>
      <button type="button" onClick={onNext} disabled={position === total}>下一节</button>
      <button type="button" className="narrative-exit" onClick={onExit}>退出叙事</button>
    </div>
  </section>;
}
