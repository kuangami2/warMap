import { describe, expect, it } from 'vitest';
import { defaultScenarioId, getScenarioData, resolveScenarioId } from '../lib/repository';
import { createNarrativeMoments } from '../lib/narrative';
import { validateHistoricalPlaces, validateTerritories, validateWars } from '../lib/validation';

describe('scenario repository', () => {
  it('loads the Qin-Han topic through the repository boundary', () => {
    const data = getScenarioData(defaultScenarioId);
    expect(data.scenario.id).toBe('qin-han');
    expect(data.scenario.startYear).toBe(-230);
    expect(data.scenario.endYear).toBe(-200);
    expect(data.eras).toHaveLength(5);
    expect(data.wars).toHaveLength(39);
    expect(data.territories.length).toBeGreaterThanOrEqual(25);
    expect(data.places.length).toBeGreaterThanOrEqual(20);
    expect(data.wars.every((war) => war.endYear <= data.scenario.endYear)).toBe(true);
    expect(data.territories.every((territory) => territory.endYear <= data.scenario.endYear)).toBe(true);
    expect(data.places.every((place) => place.endYear <= data.scenario.endYear)).toBe(true);
  });

  it('loads the independently audited expanded Han–Three Kingdoms topic', () => {
    const data = getScenarioData('han-three-kingdoms');
    expect(data.scenario.startYear).toBe(-202);
    expect(data.scenario.endYear).toBe(280);
    expect(data.eras).toHaveLength(7);
    expect(data.wars.filter((war) => war.id.startsWith('han-')).length).toBeGreaterThanOrEqual(50);
    expect(data.wars.filter((war) => war.id.startsWith('tk-')).length).toBeGreaterThanOrEqual(60);
    expect(data.places.length).toBeGreaterThanOrEqual(40);
    expect(data.territories.length).toBeGreaterThanOrEqual(25);
    expect(data.wars.filter((war) => war.routes?.length).length).toBeGreaterThanOrEqual(16);
    expect(validateWars(data.wars, data.polities, data.scenario)).toEqual([]);
    expect(validateTerritories(data.territories, data.polities, data.scenario)).toEqual([]);
    expect(validateHistoricalPlaces(data.places, data.scenario)).toEqual([]);
    expect(createNarrativeMoments(data.wars, data.narrativeEventIds)).toHaveLength(44);
    expect(data.narrativeEventIds.filter((id) => id.startsWith('han-'))).toHaveLength(21);
    expect(data.narrativeEventIds.filter((id) => id.startsWith('tk-'))).toHaveLength(23);
    for (const year of [184, 220, 229, 263, 265, 280]) expect(data.wars.some((war) => war.startYear <= year && war.endYear >= year)).toBe(true);
  });

  it('keeps scenario ids isolated and falls back safely for legacy or invalid links', () => {
    const qinHan = getScenarioData('qin-han');
    const hanThreeKingdoms = getScenarioData('han-three-kingdoms');
    expect(qinHan.wars.every((war) => war.scenarioId === qinHan.scenario.id)).toBe(true);
    expect(hanThreeKingdoms.wars.every((war) => war.scenarioId === hanThreeKingdoms.scenario.id)).toBe(true);
    expect(resolveScenarioId()).toBe(defaultScenarioId);
    expect(resolveScenarioId('unknown-topic')).toBe(defaultScenarioId);
  });
});
