import { describe, expect, it } from 'vitest';
import { mapFeatureSources } from '../data/mapFeatures';
import { historicalPlaces } from '../data/places';
import { polities } from '../data/polities';
import { territories } from '../data/territories';
import { wars } from '../data/wars';
import { validateHistoricalPlaces, validateTerritories, validateWars } from '../lib/validation';
import { getScenarioData } from '../lib/repository';

describe('2.0 data contract baseline', () => {
  it('requires source titles, confidence levels, narrative fields, and bounded locations for every published record', () => {
    expect(validateWars(wars, polities)).toEqual([]);
    expect(validateTerritories(territories, polities)).toEqual([]);
    expect(validateHistoricalPlaces(historicalPlaces)).toEqual([]);
  });

  it('uses each scenario rather than a global date range for validation', () => {
    const data = getScenarioData('han-three-kingdoms');
    expect(validateWars(data.wars, data.polities, data.scenario)).toEqual([]);
    expect(validateTerritories(data.territories, data.polities, data.scenario)).toEqual([]);
    expect(validateHistoricalPlaces(data.places, data.scenario)).toEqual([]);
  });

  it('keeps the map-asset provenance visible and license-bearing', () => {
    expect(mapFeatureSources.every((source) => source.id && source.title && source.license && source.usage && source.version && source.sourceUrl && source.geometry)).toBe(true);
  });
});
