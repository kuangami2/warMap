import { describe, expect, it } from 'vitest';
import { getScenarioData } from '../lib/repository';
import { timelineContextForYear } from '../lib/timeline-context';
import { validateScenarioPackage } from '../lib/validation';

describe('static scenario packages', () => {
  it('exposes independent manifests, normalized source references, coverage, and research regions', () => {
    for (const id of ['qin-han', 'han-three-kingdoms']) {
      const data = getScenarioData(id);
      expect(data.manifest.id).toBe(id);
      expect(data.manifest.contentVersion).toBe('2.6.1');
      expect(data.regions.length).toBeGreaterThan(0);
      expect(data.coverage.length).toBeGreaterThan(0);
      expect(data.sourceCatalog.length).toBeGreaterThan(0);
      expect(data.landmarkImages.every((image) => image.sourceId && image.license && image.quotationCitation)).toBe(true);
      expect(data.landmarkImages.every((image) => image.sourcePageUrl.startsWith('https://') && image.originalFileUrl.startsWith('https://'))).toBe(true);
      expect(data.landmarkImages.length).toBeGreaterThanOrEqual(id === 'han-three-kingdoms' ? 10 : 4);
      expect(data.wars.flatMap((war) => war.sources).every((source) => source.id && source.kind)).toBe(true);
      expect(validateScenarioPackage(data)).toEqual([]);
    }
  });

  it('keeps route-only study nodes available as searchable historical reference points', () => {
    const han = getScenarioData('han-three-kingdoms');
    expect(han.places.map((place) => place.id)).toEqual(expect.arrayContaining(['tk-maicheng', 'tk-ruxu', 'tk-yinping']));
  });

  it('distinguishes eventful, curated-empty, and not-curated time contexts', () => {
    const han = getScenarioData('han-three-kingdoms');
    expect(timelineContextForYear(han.wars, han.coverage, 208).status).toBe('eventful');
    expect(timelineContextForYear(han.wars, han.coverage, 278).status).toBe('curated-empty');
    expect(timelineContextForYear(han.wars, [], 300).status).toBe('not-curated');
  });

  it('blocks unresolved references and missing coverage declarations', () => {
    const han = getScenarioData('han-three-kingdoms');
    const broken = { ...han, coverage: [], wars: [{ ...han.wars[0], sources: [{ ...han.wars[0].sources[0], id: 'source-missing' }] }, ...han.wars.slice(1)] };
    expect(validateScenarioPackage(broken)).toEqual(expect.arrayContaining([
      'han-three-kingdoms: missing coverage declaration',
      `${han.wars[0].id}: unresolved source id`,
    ]));
  });

  it('blocks cross-scenario and undocumented landmark imagery', () => {
    const han = getScenarioData('han-three-kingdoms');
    const broken = { ...han, landmarkImages: [{ ...han.landmarkImages[0], scenarioId: 'qin-han', sourceId: 'missing', uncertaintyNote: undefined }] };
    expect(validateScenarioPackage(broken)).toEqual(expect.arrayContaining([
      `${han.landmarkImages[0].id}: cross-scenario landmark image`,
      `${han.landmarkImages[0].id}: unresolved landmark source id`,
    ]));
  });

  it('blocks remote or unsupported landmark assets', () => {
    const han = getScenarioData('han-three-kingdoms');
    const broken = { ...han, landmarkImages: [{ ...han.landmarkImages[0], path: 'https://example.com/image.webp', license: 'All rights reserved', licenseUrl: undefined }] };
    expect(validateScenarioPackage(broken)).toEqual(expect.arrayContaining([
      `${han.landmarkImages[0].id}: landmark path must be local`,
      `${han.landmarkImages[0].id}: unsupported image license`,
      `${han.landmarkImages[0].id}: missing image license URL`,
    ]));
  });
});
