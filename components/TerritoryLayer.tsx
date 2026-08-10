'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { geoPath, type GeoProjection } from 'd3-geo';
import type { Polity, TerritorySnapshot } from '@/lib/types';

type DisplayedTerritory = { snapshot: TerritorySnapshot; phase: 'current' | 'exiting' };

export function TerritoryLayer({ territories, polities, projection, activePolityIds, animated }: { territories: TerritorySnapshot[]; polities: Polity[]; projection: GeoProjection; activePolityIds: string[]; animated: boolean }) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [displayed, setDisplayed] = useState<DisplayedTerritory[]>(() => territories.map((snapshot) => ({ snapshot, phase: 'current' })));
  const polityMap = useMemo(() => new Map(polities.map((polity) => [polity.id, polity])), [polities]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const territoryKey = territories.map((territory) => territory.id).join('|');

  useEffect(() => {
    const currentIds = new Set(territories.map((territory) => territory.id));
    const enterTimer = window.setTimeout(() => setDisplayed((previous) => animated ? [
        ...previous.filter(({ snapshot }) => !currentIds.has(snapshot.id)).map(({ snapshot }) => ({ snapshot, phase: 'exiting' as const })),
        ...territories.map((snapshot) => ({ snapshot, phase: 'current' as const })),
      ] : territories.map((snapshot) => ({ snapshot, phase: 'current' as const }))), 0);
    const exitTimer = animated ? window.setTimeout(() => setDisplayed(territories.map((snapshot) => ({ snapshot, phase: 'current' }))), 420) : undefined;
    return () => {
      window.clearTimeout(enterTimer);
      if (exitTimer) window.clearTimeout(exitTimer);
    };
  }, [animated, territories, territoryKey]);

  if (!mounted) return null;
  return <g className={`territory-layer ${animated ? 'territory-layer-animated' : ''}`} aria-label="历史势力大致控制范围">
    {displayed.map(({ snapshot, phase }) => {
      const polity = polityMap.get(snapshot.polityId);
      if (!polity) return null;
      const active = activePolityIds.includes(snapshot.polityId);
      const muted = activePolityIds.length > 0 && !active;
      const labelPoint = snapshot.labelPosition ? projection(snapshot.labelPosition) : null;
      const d = path(snapshot.geometry as never);
      return <g key={`${snapshot.id}-${phase}`} className={`territory territory-${phase} ${active ? 'territory-active' : ''} ${muted ? 'territory-muted' : ''}`} data-polity-id={snapshot.polityId}>
        <title>{polity.name}：{snapshot.description}（可信度：{snapshot.confidence === 'high' ? '高' : snapshot.confidence === 'medium' ? '中' : '低'}）</title>
        {d && <path d={d} className="territory-shape" style={{ '--territory-color': polity.color } as React.CSSProperties} />}
        {phase === 'current' && labelPoint && <g className="territory-label" transform={`translate(${labelPoint[0]} ${labelPoint[1]})`}><rect x="-15" y="-10" width="30" height="19" rx="9.5" fill={polity.labelColor} /><text y="3.5" textAnchor="middle" fill={polity.textColor}>{polity.shortName}</text></g>}
      </g>;
    })}
  </g>;
}
