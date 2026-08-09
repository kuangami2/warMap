import type { WarEvent } from './types';
import { END_YEAR, START_YEAR } from './timeline';

export function validateWars(wars: WarEvent[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const war of wars) {
    if (ids.has(war.id)) errors.push(`${war.id}: duplicated id`);
    ids.add(war.id);
    if (war.startYear < START_YEAR || war.endYear > END_YEAR || war.startYear > war.endYear) errors.push(`${war.id}: invalid year range`);
    if (!war.sources.length) errors.push(`${war.id}: missing source`);
    if (!war.locations.length) errors.push(`${war.id}: missing location`);
    for (const location of war.locations) {
      if (location.latitude < 15 || location.latitude > 55 || location.longitude < 70 || location.longitude > 140) errors.push(`${war.id}: location out of map bounds`);
    }
    for (const route of war.routes ?? []) {
      if (route.points.length < 2) errors.push(`${war.id}: route needs at least two points`);
    }
  }
  return errors;
}
