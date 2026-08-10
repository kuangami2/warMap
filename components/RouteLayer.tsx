import type { GeoProjection } from 'd3-geo';
import type { WarEvent } from '@/lib/types';

function smoothPath(points: [number, number][]) {
  if (points.length < 2) return '';
  if (points.length === 2) {
    const [start, end] = points;
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2 - Math.min(26, Math.abs(end[0] - start[0]) * .12);
    return `M${start[0]},${start[1]} Q${midX},${midY} ${end[0]},${end[1]}`;
  }
  let line = `M${points[0][0]},${points[0][1]}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    line += ` Q${current[0]},${current[1]} ${(current[0] + next[0]) / 2},${(current[1] + next[1]) / 2}`;
  }
  const previous = points[points.length - 2];
  const last = points[points.length - 1];
  return `${line} Q${previous[0]},${previous[1]} ${last[0]},${last[1]}`;
}

export function RouteLayer({ war, projection, animated }: { war?: WarEvent; projection: GeoProjection; animated: boolean }) {
  if (!war?.routes?.length) return null;
  return <g className={animated ? 'route-layer route-layer-animated' : 'route-layer'}>{war.routes.map((route, routeIndex) => {
    const points = route.points.map((point) => projection([point.longitude, point.latitude])).filter(Boolean) as [number, number][];
    const line = smoothPath(points);
    return <g key={`${route.actorId}-${routeIndex}`} style={{ '--route-delay': `${routeIndex * 140}ms` } as React.CSSProperties}><path d={line} className="route-shadow" /><path d={line} className="route-line" markerEnd="url(#routeArrow)" />{points.map((point, index) => <g key={`${point[0]}-${point[1]}`} className="route-waypoint" style={{ '--point-delay': `${480 + index * 130}ms` } as React.CSSProperties}><circle cx={point[0]} cy={point[1]} r={index === points.length - 1 ? 5 : 3.5} className={index === points.length - 1 ? 'route-stop route-stop-end' : 'route-stop'} /><text x={point[0] + 7} y={point[1] - 7} className="route-label">{route.points[index].name}</text></g>)}</g>;
  })}</g>;
}
