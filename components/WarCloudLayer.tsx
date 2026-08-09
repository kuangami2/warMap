import type { GeoProjection } from 'd3-geo';
import type { WarEvent } from '@/lib/types';

const scaleScore = { S: 5, A: 4, B: 3, C: 2, D: 1 };
const typeColor: Record<WarEvent['type'], string> = {
  unification: '#f59e0b', rebellion: '#ef4444', 'civil-war': '#dc2626', border: '#38bdf8', campaign: '#f97316',
};

type Cloud = { x: number; y: number; radius: number; color: string; count: number; id: string };

function aggregateClouds(wars: WarEvent[], projection: GeoProjection): Cloud[] {
  const groups = new Map<string, { wars: WarEvent[]; points: [number, number][] }>();
  for (const war of wars) {
    const location = war.locations[0];
    const point = projection([location.longitude, location.latitude]);
    if (!point) continue;
    const key = `${Math.round(location.longitude / 4)}-${Math.round(location.latitude / 4)}`;
    const group = groups.get(key) ?? { wars: [], points: [] };
    group.wars.push(war); group.points.push(point as [number, number]); groups.set(key, group);
  }
  return Array.from(groups.entries()).map(([id, group]) => {
    const score = group.wars.reduce((sum, war) => sum + scaleScore[war.scale], 0);
    return {
      id, count: group.wars.length, x: group.points.reduce((sum, point) => sum + point[0], 0) / group.points.length,
      y: group.points.reduce((sum, point) => sum + point[1], 0) / group.points.length,
      radius: 18 + Math.sqrt(score) * 12, color: typeColor[group.wars[0].type],
    };
  });
}

export function WarCloudLayer({ wars, projection, animated }: { wars: WarEvent[]; projection: GeoProjection; animated: boolean }) {
  const clouds = aggregateClouds(wars, projection);
  return <g className={animated ? 'cloud-layer cloud-layer-animated' : 'cloud-layer'} aria-hidden="true">{clouds.map((cloud) => <g key={cloud.id} transform={`translate(${cloud.x} ${cloud.y})`}><circle r={cloud.radius * 1.18} fill={cloud.color} opacity=".08" /><circle r={cloud.radius} fill={cloud.color} opacity=".13" /><circle r={cloud.radius * .68} fill={cloud.color} opacity=".18" /><circle r={cloud.radius * .34} fill={cloud.color} opacity=".23" /><text y={4} textAnchor="middle" className="cloud-count">{cloud.count}</text></g>)}</g>;
}
