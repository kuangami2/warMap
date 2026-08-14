import type { WarEvent } from './types';
export const START_YEAR = -230;
export const END_YEAR = -200;

export function formatYear(year: number): string {
  return year < 0 ? `前${Math.abs(year)}年` : `${year}年`;
}

export function activeWars(wars: WarEvent[], currentYear: number, window = 1): WarEvent[] {
  return wars.filter((war) => war.startYear <= currentYear + window && war.endYear >= currentYear - window);
}

export function clampYear(year: number, startYear = START_YEAR, endYear = END_YEAR): number {
  return Math.min(endYear, Math.max(startYear, year));
}
