import { useMemo } from 'react';
import type { GeoProjection } from 'd3-geo';
import { modernReferencePlaces, type ModernPlace } from '@/data/modernPlaces';
import { mapDetailForScale, type MapDetail } from '@/lib/mapDetail';
import { MAP_CENTER } from '@/lib/mapViewport';

type PlacedModern = ModernPlace & { x: number; y: number; visible: boolean; width: number };

function rankEligibleForDetail(rank: number, detail: MapDetail) {
  if (detail === 'overview') return rank <= 2;
  if (detail === 'regional') return rank <= 3;
  return true;
}

function overlaps(left: PlacedModern, right: PlacedModern) {
  const leftBox = { left: left.x - 4, right: left.x + left.width, top: left.y - 8, bottom: left.y + 7 };
  const rightBox = { left: right.x - 4, right: right.x + right.width, top: right.y - 8, bottom: right.y + 7 };
  return leftBox.left < rightBox.right && leftBox.right > rightBox.left && leftBox.top < rightBox.bottom && leftBox.bottom > rightBox.top;
}

export function ModernPlaceLayer({ projection, zoom }: { projection: GeoProjection; zoom: number }) {
  const detail = mapDetailForScale(zoom);
  const labels = useMemo(() => {
    const candidates = modernReferencePlaces
      .filter((place) => rankEligibleForDetail(place.rank, detail))
      .map((place) => {
        const point = projection([place.longitude, place.latitude]);
        if (!point) return null;
        return { ...place, x: MAP_CENTER.x + zoom * (point[0] - MAP_CENTER.x), y: MAP_CENTER.y + zoom * (point[1] - MAP_CENTER.y), width: 8 + place.nameZh.length * 9, visible: false };
      })
      .filter((place): place is PlacedModern => place !== null)
      .sort((first, second) => first.rank - second.rank || second.population - first.population);
    const shown: PlacedModern[] = [];
    return candidates.map((candidate) => {
      const visible = !shown.some((existing) => overlaps(candidate, existing));
      const placed = { ...candidate, visible };
      if (visible) shown.push(placed);
      return placed;
    });
  }, [projection, zoom, detail]);

  return <g className={`modern-place-layer modern-place-detail-${detail}`} aria-label="现代地名参考点（Natural Earth，公共领域）">
    {labels.filter((place) => place.visible).map((place) => {
      const point = projection([place.longitude, place.latitude]);
      if (!point) return null;
      const major = place.rank <= 2;
      return <g key={place.id} className={`modern-place modern-place-${major ? 'major' : 'minor'}`} transform={`translate(${point[0]} ${point[1]}) scale(${1 / zoom})`} aria-label={`${place.nameZh}（${place.nameEn}）`}>
        <circle r={major ? 2.6 : 2} className="modern-place-mark" />
        <text x="7" y="3" className="modern-place-label">{place.nameZh}</text>
      </g>;
    })}
  </g>;
}
