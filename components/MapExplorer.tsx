'use client';

import { useMemo, useRef, useState } from 'react';
import { emptyExplorerFilters, exploreScenario, type ExplorerFilters } from '@/lib/explorer';
import type { Era, HistoricalPlace, Polity, ResearchRegion, ScenarioData, TimelineScenario, WarEvent, WarType } from '@/lib/types';

type MapExplorerProps = {
  data: ScenarioData;
  scenarios: TimelineScenario[];
  filters: ExplorerFilters;
  onFiltersChange: (filters: ExplorerFilters) => void;
  onScenario: (scenarioId: string) => void;
  onPlace: (place: HistoricalPlace) => void;
  onWar: (war: WarEvent) => void;
  onShare: () => Promise<boolean>;
};

const eventTypes: Array<{ id: WarType; label: string }> = [
  { id: 'unification', label: '统一' }, { id: 'rebellion', label: '起义' }, { id: 'civil-war', label: '内战' }, { id: 'border', label: '边疆' }, { id: 'campaign', label: '战役' },
];
const confidences = [{ id: 'high', label: '高可信度' }, { id: 'medium', label: '中可信度' }, { id: 'low', label: '低可信度' }] as const;

function toggle<T extends string>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function FilterGroup<T extends { id: string; name?: string; shortName?: string; label?: string }>({ title, values, selected, onToggle }: { title: string; values: T[]; selected: string[]; onToggle: (id: string) => void }) {
  return <fieldset className="explorer-filter-group"><legend>{title}</legend><div>{values.map((value) => <button key={value.id} type="button" aria-pressed={selected.includes(value.id)} onClick={() => onToggle(value.id)}>{value.label ?? value.name ?? value.shortName ?? value.id}</button>)}</div></fieldset>;
}

export function MapExplorer({ data, scenarios, filters, onFiltersChange, onScenario, onPlace, onWar, onShare }: MapExplorerProps) {
  const { wars, places, scenario, eras, polities, regions } = data;
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const filtersRef = useRef<HTMLDetailsElement>(null);
  const filterSummaryRef = useRef<HTMLElement>(null);
  const results = useMemo(() => exploreScenario(data, filters), [data, filters]);
  const update = (patch: Partial<ExplorerFilters>) => onFiltersChange({ ...filters, ...patch });
  const clear = () => onFiltersChange(emptyExplorerFilters());

  async function share() { setShareState((await onShare()) ? 'copied' : 'manual'); }
  function closeFilters() {
    if (!filtersRef.current?.open) return;
    filtersRef.current.removeAttribute('open');
    window.requestAnimationFrame(() => filterSummaryRef.current?.focus());
  }

  return <section className="map-explorer" aria-label="地图定位、筛选与分享" onKeyDown={(event) => { if (event.key === 'Escape') closeFilters(); }}>
    <div className="map-explorer-search">
      <label htmlFor="map-search">定位、检索或筛选{scenario.name}的事件与地点</label>
      <div><input id="map-search" value={filters.query} onChange={(event) => update({ query: event.target.value })} placeholder={scenario.id === 'qin-han' ? '如：荥阳、函谷关、巨鹿之战' : '如：长安、河西、昆阳之战'} autoComplete="off" /><button type="button" onClick={share}>复制当前地图链接</button></div>
      {shareState !== 'idle' && <p className="map-share-status" role="status">{shareState === 'copied' ? '已复制当前专题、筛选、年份、事件与地图视角链接。' : '当前浏览器不允许自动复制；可从地址栏复制当前链接。'}</p>}
    </div>
    <details className="explorer-filters" ref={filtersRef}>
      <summary ref={filterSummaryRef} tabIndex={0}>研究筛选{[filters.eraIds, filters.polityIds, filters.regionIds, filters.types, filters.confidences].flat().length || filters.query ? '（已启用）' : ''}</summary>
      <div className="explorer-filter-content">
        <label className="explorer-scenario-label">专题<select aria-label="探索专题" value={scenario.id} onChange={(event) => onScenario(event.target.value)}>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <FilterGroup title="时期" values={eras} selected={filters.eraIds} onToggle={(id) => update({ eraIds: toggle(filters.eraIds, id) })} />
        <FilterGroup title="势力" values={polities} selected={filters.polityIds} onToggle={(id) => update({ polityIds: toggle(filters.polityIds, id) })} />
        <FilterGroup title="研究区域" values={regions} selected={filters.regionIds} onToggle={(id) => update({ regionIds: toggle(filters.regionIds, id) })} />
        <FilterGroup title="事件类型" values={eventTypes} selected={filters.types} onToggle={(id) => update({ types: toggle(filters.types, id as WarType) })} />
        <FilterGroup title="可信度" values={confidences.map((item) => ({ ...item }))} selected={filters.confidences} onToggle={(id) => update({ confidences: toggle(filters.confidences, id as ExplorerFilters['confidences'][number]) })} />
        <div className="explorer-filter-actions"><button type="button" onClick={clear}>清除筛选</button><button type="button" onClick={closeFilters}>关闭筛选</button></div>
      </div>
    </details>
    {(filters.query.trim() || [filters.eraIds, filters.polityIds, filters.regionIds, filters.types, filters.confidences].some((values) => values.length)) && <div className="map-search-results" role="listbox" aria-label="地图搜索和筛选结果">
      {results.length ? results.map((result) => <button key={`${result.kind}-${result.id}`} type="button" role="option" aria-selected="false" onClick={() => {
        if (result.kind === 'event') { const war = wars.find((item) => item.id === result.id); if (war) onWar(war); }
        else { const place = places.find((item) => item.id === result.id); if (place) onPlace(place); }
        closeFilters();
      }}><strong>{result.name}</strong><span>{result.detail}</span><small>{result.kind === 'event' ? '事件' : '地点'} · {result.confidence === 'high' ? '高可信度' : result.confidence === 'medium' ? '中可信度' : '低可信度'}{result.matches.length ? ` · 命中：${result.matches.join('、')}` : ''}</small></button>) : <p role="status">没有匹配结果。可调整筛选条件，或搜索古地名、现代地名、事件、来源和区域。</p>}
    </div>}
  </section>;
}
