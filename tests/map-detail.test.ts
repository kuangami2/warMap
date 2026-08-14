import { describe, expect, it } from 'vitest';
import { eventsForMapDetail, mapDetailForScale, placeIsEligibleForMapDetail } from '../lib/mapDetail';
import type { HistoricalPlace, WarEvent } from '../lib/types';

const place = (kind: HistoricalPlace['kind']) => ({ kind }) as HistoricalPlace;
const war = (id: string, scale: WarEvent['scale']) => ({ id, scale }) as WarEvent;

describe('atlas detail levels', () => {
  it('uses stable overview, regional, and local scale thresholds', () => {
    expect(mapDetailForScale(1)).toBe('overview');
    expect(mapDetailForScale(1.35)).toBe('regional');
    expect(mapDetailForScale(2.49)).toBe('regional');
    expect(mapDetailForScale(2.5)).toBe('local');
  });

  it('keeps only strategic-scale events in the whole-map view', () => {
    const wars = [war('s', 'S'), war('a', 'A'), war('b', 'B')];
    expect(eventsForMapDetail(wars, 'overview').map((item) => item.id)).toEqual(['s', 'a']);
    expect(eventsForMapDetail(wars, 'regional')).toEqual(wars);
    expect(eventsForMapDetail(wars, 'local')).toEqual(wars);
  });

  it('adds county-level reference points only in the local view', () => {
    expect(placeIsEligibleForMapDetail(place('capital'), 'overview')).toBe(true);
    expect(placeIsEligibleForMapDetail(place('commandery'), 'overview')).toBe(false);
    expect(placeIsEligibleForMapDetail(place('county'), 'regional')).toBe(false);
    expect(placeIsEligibleForMapDetail(place('county'), 'local')).toBe(true);
  });
});
