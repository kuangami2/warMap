import type { Polity, TerritorySnapshot, WarEvent } from './types';
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

export function validateTerritories(snapshots: TerritorySnapshot[], polities: Polity[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const polityIds = new Set(polities.map((polity) => polity.id));
  for (const snapshot of snapshots) {
    if (ids.has(snapshot.id)) errors.push(`${snapshot.id}: duplicated id`);
    ids.add(snapshot.id);
    if (!polityIds.has(snapshot.polityId)) errors.push(`${snapshot.id}: unknown polity`);
    if (snapshot.startYear < START_YEAR || snapshot.endYear > END_YEAR || snapshot.startYear > snapshot.endYear) errors.push(`${snapshot.id}: invalid year range`);
    if (!snapshot.sources.length) errors.push(`${snapshot.id}: missing source`);
    if (!snapshot.description.trim()) errors.push(`${snapshot.id}: missing description`);
    if (snapshot.geometry.type !== 'Polygon' && snapshot.geometry.type !== 'MultiPolygon') errors.push(`${snapshot.id}: unsupported geometry`);
    const polygons = snapshot.geometry.type === 'Polygon' ? [snapshot.geometry.coordinates] : snapshot.geometry.coordinates;
    for (const polygon of polygons) {
      if (!polygon.length || polygon.some((ring) => ring.length < 4)) errors.push(`${snapshot.id}: polygon ring needs at least four points`);
      for (const ring of polygon) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first && last && (first[0] !== last[0] || first[1] !== last[1])) errors.push(`${snapshot.id}: polygon ring is not closed`);
        for (const point of ring) {
          if (point.length < 2 || point[1] < 15 || point[1] > 55 || point[0] < 70 || point[0] > 140) errors.push(`${snapshot.id}: geometry point out of map bounds`);
        }
      }
    }
  }
  return errors;
}
