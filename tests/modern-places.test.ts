import { describe, expect, it } from 'vitest';
import { modernReferencePlaces, naturalEarthPopulatedPlacesAsset } from '../data/modernPlaces';

describe('modern reference places (Natural Earth, public domain)', () => {
  it('keeps every city inside the supported China map extent', () => {
    for (const place of modernReferencePlaces) {
      expect(place.longitude).toBeGreaterThanOrEqual(69);
      expect(place.longitude).toBeLessThanOrEqual(141);
      expect(place.latitude).toBeGreaterThanOrEqual(14);
      expect(place.latitude).toBeLessThanOrEqual(56);
    }
  });

  it('has a Chinese name, English name, valid rank, and unique id for every city', () => {
    const ids = new Set<string>();
    for (const place of modernReferencePlaces) {
      expect(place.nameZh).toBeTruthy();
      expect(place.nameEn).toBeTruthy();
      expect(place.rank).toBeGreaterThanOrEqual(0);
      expect(place.rank).toBeLessThanOrEqual(4);
      expect(place.population).toBeGreaterThan(0);
      expect(ids.has(place.id)).toBe(false);
      ids.add(place.id);
    }
  });

  it('records public-domain attribution metadata for the asset', () => {
    const asset = naturalEarthPopulatedPlacesAsset;
    expect(asset.id).toBeTruthy();
    expect(asset.source).toBeTruthy();
    expect(asset.sourceUrl).toMatch(/^https:/);
    expect(asset.license).toBe('Public Domain');
    expect(asset.version).toBeTruthy();
    expect(asset.coverage).toBeTruthy();
    expect(asset.processingNote).toBeTruthy();
  });
});
