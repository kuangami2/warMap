import type { HistoricalPlace, WarEvent } from './types';

/**
 * The atlas intentionally has three information densities. Keeping the
 * thresholds here makes physical geography, historical places, and events
 * change together instead of competing for the same small-scale view.
 */
export type MapDetail = 'overview' | 'regional' | 'local';

export function mapDetailForScale(scale: number): MapDetail {
  if (scale < 1.35) return 'overview';
  if (scale < 2.5) return 'regional';
  return 'local';
}

export function eventsForMapDetail(wars: WarEvent[], detail: MapDetail) {
  return detail === 'overview'
    ? wars.filter((war) => war.scale === 'S' || war.scale === 'A')
    : wars;
}

export function placeIsEligibleForMapDetail(place: HistoricalPlace, detail: MapDetail) {
  if (detail === 'overview') return place.kind === 'capital' || place.kind === 'pass';
  if (detail === 'regional') return place.kind !== 'county';
  return true;
}
