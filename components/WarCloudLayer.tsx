import type { GeoProjection } from 'd3-geo';
import type { WarEvent } from '@/lib/types';

const scaleScore = { S: 5, A: 4, B: 3, C: 2, D: 1 };
const typeColor: Record<WarEvent['type'], string> = { unification: '#f59e0b', rebellion: '#ef4444', 'civil-war': '#dc2626', border: '#38bdf8', campaign: '#f97316' };
type Cloud = { x: number; y: number; radius: number; color: string; count: number; id: string; warIds: string[] };

function aggregateClouds(wars: WarEvent[], projection: GeoProjection): Cloud[] {
  const groups = new Map<string, { wars: WarEvent[]; points: [number, number][] }>();
  for (const war of wars) {
    for (const location of war.locations) {
      const point = projection([location.longitude, location.latitude]);
      if (!point) continue;
      const key = `${Math.round(location.longitude / 4)}-${Math.round(location.latitude / 4)}`;
      const group = groups.get(key) ?? { wars: [], points: [] };
      if (!group.wars.some((item) => item.id === war.id)) group.wars.push(war);
      group.points.push(point as [number, number]);
      groups.set(key, group);
    }
  }
  return Array.from(groups.entries()).map(([id, group]) => {
    const score = group.wars.reduce((sum, war) => sum + scaleScore[war.scale], 0);
    return { id, count: group.wars.length, x: group.points.reduce((sum, point) => sum + point[0], 0) / group.points.length, y: group.points.reduce((sum, point) => sum + point[1], 0) / group.points.length, radius: 18 + Math.sqrt(score) * 12, color: typeColor[group.wars[0].type], warIds: group.wars.map((war) => war.id) };
  });
}

export function WarCloudLayer({ wars, projection, animated, activeWarId, detail }: { wars: WarEvent[]; projection: GeoProjection; animated: boolean; activeWarId?: string; detail: 'overview' | 'regional' | 'local' }) {
  const clouds = aggregateClouds(wars, projection);
  return <g className={`${animated ? 'cloud-layer cloud-layer-animated' : 'cloud-layer'} cloud-detail-${detail}`} aria-hidden="true">
    <defs>{clouds.map((cloud) => <radialGradient id={`cloud-${cloud.id}`} key={cloud.id}><stop offset="0" stopColor={cloud.color} stopOpacity=".38" /><stop offset=".35" stopColor={cloud.color} stopOpacity=".2" /><stop offset=".72" stopColor={cloud.color} stopOpacity=".08" /><stop offset="1" stopColor={cloud.color} stopOpacity="0" /></radialGradient>)}</defs>
    {clouds.map((cloud) => {
      const active = activeWarId ? cloud.warIds.includes(activeWarId) : false;
      const muted = Boolean(activeWarId && !active);
      return <g key={cloud.id} transform={`translate(${cloud.x} ${cloud.y})`} className={`${active ? 'cloud-active' : ''} ${muted ? 'cloud-muted' : ''}`}><circle r={cloud.radius * 1.35} fill={`url(#cloud-${cloud.id})`} className="cloud-field" /><circle r={cloud.radius * .58} fill="none" stroke={cloud.color} className="cloud-front" />{cloud.count > 1 && <text y={4} textAnchor="middle" className="cloud-count">{cloud.count}</text>}</g>;
    })}
  </g>;
}
