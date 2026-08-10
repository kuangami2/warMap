import type { TerritorySnapshot } from './types';

export function activeTerritories(snapshots: TerritorySnapshot[], currentYear: number): TerritorySnapshot[] {
  return snapshots.filter((snapshot) => snapshot.startYear <= currentYear && snapshot.endYear >= currentYear);
}
