import type { WarEvent } from './types';

export const START_YEAR = -230;
export const END_YEAR = -180;

export function formatYear(year: number): string {
  return year < 0 ? `前${Math.abs(year)}年` : `${year}年`;
}

export function activeWars(wars: WarEvent[], currentYear: number, window = 1): WarEvent[] {
  return wars.filter((war) => war.startYear <= currentYear + window && war.endYear >= currentYear - window);
}

export function clampYear(year: number): number {
  return Math.min(END_YEAR, Math.max(START_YEAR, year));
}
