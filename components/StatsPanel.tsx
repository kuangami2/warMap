import { formatYear } from '@/lib/timeline';
import type { WarEvent } from '@/lib/types';
import type { TimelineContext } from '@/lib/timeline-context';

const typeLabel: Record<WarEvent['type'], string> = {
  unification: '统一战争',
  rebellion: '起义',
  'civil-war': '内战',
  border: '边疆战事',
  campaign: '军事行动',
};

type StatsPanelProps = {
  wars: WarEvent[];
  territoryCount: number;
  selectedWar?: WarEvent;
  context: TimelineContext;
  onSelect: (war: WarEvent) => void;
  onHover: (war?: WarEvent) => void;
};

export function StatsPanel({ wars, territoryCount, selectedWar, context, onSelect, onHover }: StatsPanelProps) {
  const regions = new Set(wars.flatMap((war) => war.locations.map((location) => location.modernName?.split('，')[0] ?? location.name)));
  const routed = wars.filter((war) => war.routes?.length).length;

  return <aside className="panel event-browser">
    <div className="event-browser-header">
      <div><p className="eyebrow">当前窗口</p><h2 className="text-xl font-semibold">事件速览</h2></div>
      <span className="event-count">{wars.length} 个事件</span>
    </div>
    <div className="grid grid-cols-3 gap-2 px-4 pb-3"><Stat label="事件" value={wars.length} /><Stat label="区域" value={regions.size} /><Stat label="路线" value={routed} /></div>
    <div className="event-overview" role="list" aria-label="当前年份事件列表">
      {wars.length ? wars.map((war) => {
        const selected = selectedWar?.id === war.id;
        const place = war.locations[0];
        return <button type="button" role="listitem" className={`event-card ${selected ? 'event-card-selected' : ''}`} key={war.id} onClick={() => onSelect(war)} onMouseEnter={() => onHover(war)} onMouseLeave={() => onHover(undefined)} onFocus={() => onHover(war)} onBlur={() => onHover(undefined)}>
          <span className={`event-type-mark event-type-${war.type}`} />
          <span className="event-card-content">
            <span className="event-card-title-row"><strong>{war.name}</strong><span className="scale-badge">{war.scale}</span></span>
            <span className="event-card-meta">{formatYear(war.startYear)}{war.endYear !== war.startYear ? `—${formatYear(war.endYear)}` : ''} · {typeLabel[war.type]}{place ? ` · ${place.name}` : ''}</span>
            <span className="event-card-summary">{war.summary}</span>
          </span>
        </button>;
      }) : <p className="event-empty">{context.note}{territoryCount > 0 ? `仍有 ${territoryCount} 个势力范围快照可供参考。` : ''}继续拖动时间轴查看其他阶段。</p>}
    </div>
    <div className="event-browser-footer">悬停联动地图 · 点击查看完整详情</div>
  </aside>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="event-stat"><p>{value}</p><span>{label}</span></div>;
}
