import { useMemo } from 'react';
import type { GeoProjection } from 'd3-geo';
import type { HistoricalPlace } from '@/lib/types';
import { activeHistoricalPlaces } from '@/lib/places';
import { mapDetailForScale, placeIsEligibleForMapDetail } from '@/lib/mapDetail';
import { MAP_CENTER } from '@/lib/mapViewport';

type PlacedLabel = HistoricalPlace & { x: number; y: number; visible: boolean; width: number };

function overlaps(left: PlacedLabel, right: PlacedLabel) {
  const leftBox = { left: left.x - 7, right: left.x + left.width, top: left.y - 10, bottom: left.y + 9 };
  const rightBox = { left: right.x - 7, right: right.x + right.width, top: right.y - 10, bottom: right.y + 9 };
  return leftBox.left < rightBox.right && leftBox.right > rightBox.left && leftBox.top < rightBox.bottom && leftBox.bottom > rightBox.top;
}

function markerPath(kind: HistoricalPlace['kind']) {
  if (kind === 'capital') return 'M-4 -4 H4 V4 H-4 Z';
  if (kind === 'commandery') return 'M0 -5 L4 -2.5 L4 2.5 L0 5 L-4 2.5 L-4 -2.5 Z';
  if (kind === 'pass') return 'M0 -5 L5 0 L0 5 L-5 0 Z';
  if (kind === 'city') return 'M-4 -4 L4 -4 L5 4 L-5 4 Z';
  return 'M0 -3.5 A3.5 3.5 0 1 0 0 3.5 A3.5 3.5 0 1 0 0 -3.5';
}

export function HistoricalPlaceLayer({ places, year, projection, zoom }: { places: HistoricalPlace[]; year: number; projection: GeoProjection; zoom: number }) {
  const labels = useMemo(() => {
    const candidates = activeHistoricalPlaces(places, year)
      .filter((place) => place.minZoom <= zoom)
      .filter((place) => placeIsEligibleForMapDetail(place, mapDetailForScale(zoom)))
      .flatMap((place) => {
        const point = projection([place.longitude, place.latitude]);
        if (!point) return [];
        return [{ ...place, x: MAP_CENTER.x + zoom * (point[0] - MAP_CENTER.x), y: MAP_CENTER.y + zoom * (point[1] - MAP_CENTER.y), width: 10 + place.name.length * 9.5, visible: false }];
      })
      .sort((first, second) => second.priority - first.priority || first.id.localeCompare(second.id));
    const shown: PlacedLabel[] = [];
    return candidates.map((candidate) => {
      const visible = !shown.some((existing) => overlaps(candidate, existing));
      const placed = { ...candidate, visible };
      if (visible) shown.push(placed);
      return placed;
    });
  }, [places, projection, year, zoom]);

  const detail = mapDetailForScale(zoom);
  return <g className={`historical-place-layer historical-place-detail-${detail}`} aria-label="按年代显示的古地名、城邑与关隘参考点">
    {labels.filter((place) => place.visible).map((place) => {
      const point = projection([place.longitude, place.latitude]);
      if (!point) return null;
      return <g key={place.id} className={`historical-place historical-place-${place.kind} historical-place-confidence-${place.confidence}`} data-place-id={place.id} transform={`translate(${point[0]} ${point[1]}) scale(${1 / zoom})`} aria-label={`${place.name}：${place.modernName}。${place.note}（可信度：${place.confidence === 'high' ? '高' : place.confidence === 'medium' ? '中' : '低'}）`}>
        <path d={markerPath(place.kind)} className="historical-place-mark" />
        <text x="7" y="3.5" className="historical-place-label">{place.name}</text>
      </g>;
    })}
  </g>;
}
