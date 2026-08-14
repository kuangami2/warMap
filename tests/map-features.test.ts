import { describe, expect, it } from 'vitest';
import { naturalEarthLakeRings, naturalEarthLandRings, naturalEarthRiverLines, physicalMapAssets, physicalLabelAnchors } from '../data/naturalEarth10m';

function pointsAreInMapBounds(points: [number, number][]) {
  return points.every(([longitude, latitude]) => longitude >= 69 && longitude <= 141 && latitude >= 14 && latitude <= 56);
}

describe('thematic physical-reference map features', () => {
  it('contains a locally bundled 1:10m land, lake, and river derivative', () => {
    expect(naturalEarthLandRings.length).toBeGreaterThan(300);
    expect(naturalEarthLakeRings.length).toBeGreaterThan(100);
    expect(naturalEarthRiverLines.length).toBeGreaterThan(200);
    expect(physicalMapAssets.map((asset) => asset.kind)).toEqual(expect.arrayContaining(['land', 'lake', 'river', 'relief']));
  });

  it('keeps every published geometry and label in the supported China map extent', () => {
    for (const ring of [...naturalEarthLandRings, ...naturalEarthLakeRings]) {
      expect(pointsAreInMapBounds(ring)).toBe(true);
    }
    for (const river of naturalEarthRiverLines) {
      expect(pointsAreInMapBounds(river)).toBe(true);
    }
    for (const label of physicalLabelAnchors) {
      expect(pointsAreInMapBounds([label.coordinate])).toBe(true);
    }
  });

  it('records a license, source URL, version, coverage, and processing note for every map asset', () => {
    expect(physicalMapAssets.every((asset) => asset.id && asset.source && asset.sourceUrl && asset.license && asset.version && asset.coverage && asset.processingNote)).toBe(true);
    expect(physicalMapAssets.filter((asset) => asset.kind !== 'relief').every((asset) => asset.license === 'Public Domain')).toBe(true);
  });
});
