import { describe, expect, it } from 'vitest';
import { emptyExplorerFilters, explorerFiltersFromUrl, exploreScenario, writeExplorerFiltersToUrl } from '../lib/explorer';
import { getScenarioData } from '../lib/repository';

describe('research explorer filters', () => {
  const han = getScenarioData('han-three-kingdoms');

  it('uses OR inside a facet and AND across selected facets', () => {
    const results = exploreScenario(han, {
      ...emptyExplorerFilters(),
      regionIds: ['han-jingzhou-yangtze', 'han-hanzhong-longyou'],
      types: ['civil-war'],
      confidences: ['high'],
    });
    expect(results.some((result) => result.id === 'tk-red-cliffs')).toBe(true);
    expect(results.every((result) => result.kind === 'event' && result.confidence === 'high')).toBe(true);
    expect(results.every((result) => result.matches.includes('事件类型'))).toBe(true);
  });

  it('matches structured reference titles and keeps polity filters event-only', () => {
    const referenceResults = exploreScenario(han, { ...emptyExplorerFilters(), query: '中国历史地图集' });
    expect(referenceResults.some((result) => result.kind === 'event')).toBe(true);
    expect(referenceResults.some((result) => result.kind === 'place')).toBe(true);
    const polityResults = exploreScenario(han, { ...emptyExplorerFilters(), polityIds: ['shu-han'] });
    expect(polityResults.length).toBeGreaterThan(0);
    expect(polityResults.every((result) => result.kind === 'event')).toBe(true);
  });

  it('serializes stable filter ids and drops unknown or cross-topic values during restoration', () => {
    const parameters = new URLSearchParams('q=赤壁&era=three-kingdoms,unknown&polity=shu-han,qin&region=han-jingzhou-yangtze,qin-guanzhong&type=civil-war,wrong&confidence=high,invalid');
    const filters = explorerFiltersFromUrl(parameters, han);
    expect(filters).toEqual({ query: '赤壁', eraIds: ['three-kingdoms'], polityIds: ['shu-han'], regionIds: ['han-jingzhou-yangtze'], types: ['civil-war'], confidences: ['high'] });
    const serialized = new URLSearchParams();
    writeExplorerFiltersToUrl(serialized, filters);
    expect(serialized.toString()).toBe('q=%E8%B5%A4%E5%A3%81&era=three-kingdoms&polity=shu-han&region=han-jingzhou-yangtze&type=civil-war&confidence=high');
  });
});
