'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { geoPath, type GeoProjection } from 'd3-geo';
import type { Polity, TerritorySnapshot } from '@/lib/types';
import { layoutTerritoryLabels } from '@/lib/territoryLabels';

type DisplayedTerritory = { snapshot: TerritorySnapshot; phase: 'current' | 'exiting' };

const controlLabel = { core: '核心控制区', influence: '主要影响区', contested: '争夺区', activity: '活动范围' };

export function TerritoryLayer({ territories, polities, projection, activePolityIds, animated, zoom }: { territories: TerritorySnapshot[]; polities: Polity[]; projection: GeoProjection; activePolityIds: string[]; animated: boolean; zoom: number }) {
  const isMobile = useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia('(max-width: 767px)');
      media.addEventListener('change', onStoreChange);
      return () => media.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(max-width: 767px)').matches,
    () => false,
  );
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

  const labelLayouts = useMemo(() => layoutTerritoryLabels(
    displayed
      .filter(({ phase }) => phase === 'current')
      .flatMap(({ snapshot }) => {
        const polity = polityMap.get(snapshot.polityId);
        const point = snapshot.labelPosition ? projection(snapshot.labelPosition) : null;
        if (!polity || !point) return [];
        return [{ id: snapshot.id, polityId: snapshot.polityId, shortName: polity.shortName, x: point[0], y: point[1], control: snapshot.control, active: activePolityIds.includes(snapshot.polityId) }];
      }),
    isMobile,
  ), [activePolityIds, displayed, isMobile, polityMap, projection]);
  const labelMap = useMemo(() => new Map(labelLayouts.map((layout) => [layout.id, layout])), [labelLayouts]);

  if (!mounted) return null;
  return <g className={`territory-layer ${animated ? 'territory-layer-animated' : ''}`} aria-label="历史势力大致控制范围">
    {displayed.map(({ snapshot, phase }) => {
      const polity = polityMap.get(snapshot.polityId);
      if (!polity) return null;
      const active = activePolityIds.includes(snapshot.polityId);
      const muted = activePolityIds.length > 0 && !active;
      const d = path(snapshot.geometry as never);
      const label = phase === 'current' ? labelMap.get(snapshot.id) : undefined;
      return <g key={`${snapshot.id}-${phase}`} className={`territory territory-${phase} territory-${snapshot.control} territory-confidence-${snapshot.confidence} ${active ? 'territory-active' : ''} ${muted ? 'territory-muted' : ''}`} data-polity-id={snapshot.polityId}>
        <title>{polity.name}：{controlLabel[snapshot.control]}。{snapshot.description}（可信度：{snapshot.confidence === 'high' ? '高' : snapshot.confidence === 'medium' ? '中' : '低'}）</title>
        {d && <path d={d} className="territory-shape" style={{ '--territory-color': polity.color } as React.CSSProperties} />}
        {label?.visible && <g className={`territory-label territory-label-${snapshot.control} ${label.mobileVisible ? 'territory-label-mobile-visible' : ''}`} transform={`translate(${label.x} ${label.y}) scale(${1 / zoom})`}><rect x={-(label.width / 2)} y="-11" width={label.width} height="21" rx="3" fill={polity.labelColor} /><text y="4" textAnchor="middle" fill={polity.textColor}>{polity.shortName}</text></g>}
      </g>;
    })}
  </g>;
}
