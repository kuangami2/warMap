import type { GeoProjection } from 'd3-geo';
import type { WarEvent } from '@/lib/types';

export function RouteLayer({ war, projection, animated }: { war?: WarEvent; projection: GeoProjection; animated: boolean }) {
  if (!war?.routes?.length) return null;
  return <g className={animated ? 'route-layer route-layer-animated' : 'route-layer'}>{war.routes.map((route, routeIndex) => {
    const points = route.points.map((point) => projection([point.longitude, point.latitude])).filter(Boolean) as [number, number][];
    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0]},${point[1]}`).join(' ');
    return <g key={`${route.actorId}-${routeIndex}`}><path d={line} className="route-shadow" /><path d={line} className="route-line" markerEnd="url(#routeArrow)" />{points.map((point, index) => <g key={`${point[0]}-${point[1]}`}><circle cx={point[0]} cy={point[1]} r="4" className="route-stop" /><text x={point[0] + 7} y={point[1] - 7} className="route-label">{route.points[index].name}</text></g>)}</g>;
  })}</g>;
}
