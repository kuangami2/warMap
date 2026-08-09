import { describe, expect, it } from 'vitest';
import { END_YEAR, START_YEAR, activeWars, clampYear, formatYear } from '../lib/timeline';
import { wars } from '../data/wars';
import { validateWars } from '../lib/validation';

describe('timeline utilities', () => {
  it('formats BCE years for display', () => { expect(formatYear(-230)).toBe('前230年'); });
  it('clamps range boundaries', () => { expect(clampYear(-500)).toBe(START_YEAR); expect(clampYear(0)).toBe(END_YEAR); });
  it('finds events in the active time window', () => { expect(activeWars(wars, -221).map((war) => war.id)).toContain('qin-conquest-qi'); expect(activeWars(wars, -180)).toHaveLength(0); });
  it('contains the second-round minimum number of sourced events', () => {
    expect(wars.length).toBeGreaterThanOrEqual(30);
    expect(wars.every((war) => war.sources.length > 0 && war.locations.length > 0)).toBe(true);
  });
  it('passes historical data validation and includes enough mapped routes', () => {
    expect(validateWars(wars)).toEqual([]);
    expect(wars.filter((war) => war.routes?.length).length).toBeGreaterThanOrEqual(8);
  });
});
