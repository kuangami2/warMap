import type { HistoricalPlace } from './types';

export function activeHistoricalPlaces(places: HistoricalPlace[], year: number) {
  return places.filter((place) => year >= place.startYear && year <= place.endYear);
}
