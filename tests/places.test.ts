import { describe, expect, it } from 'vitest';
import { historicalPlaces } from '../data/places';
import { activeHistoricalPlaces } from '../lib/places';
import { validateHistoricalPlaces } from '../lib/validation';

describe('historical place references', () => {
  it('shows the relevant capital by historical phase', () => {
    expect(activeHistoricalPlaces(historicalPlaces, -221).map((place) => place.id)).toContain('xianyang');
    expect(activeHistoricalPlaces(historicalPlaces, -221).map((place) => place.id)).not.toContain('chang-an');
    expect(activeHistoricalPlaces(historicalPlaces, -201).map((place) => place.id)).toContain('chang-an');
    expect(activeHistoricalPlaces(historicalPlaces, -201).map((place) => place.id)).not.toContain('xianyang');
  });

  it('keeps each reference point sourced, bounded, and explicit about historical uncertainty', () => {
    expect(historicalPlaces.length).toBeGreaterThanOrEqual(20);
    expect(validateHistoricalPlaces(historicalPlaces)).toEqual([]);
    expect(historicalPlaces.every((place) => place.sources.length > 0 && place.note.length > 0)).toBe(true);
  });
});
