import { describe, expect, it } from 'vitest';
import { polities } from '../data/polities';
import { territories } from '../data/territories';
import { activeTerritories } from '../lib/territories';
import type { TerritorySnapshot } from '../lib/types';
import { validateTerritories } from '../lib/validation';

describe('historical territory snapshots', () => {
  it('selects snapshots inclusively at stage boundaries', () => {
    expect(activeTerritories(territories, -230).map((item) => item.polityId)).toEqual(expect.arrayContaining(['qin', 'han-state', 'zhao', 'wei', 'chu', 'yan', 'qi']));
    expect(activeTerritories(territories, -220).map((item) => item.polityId)).toEqual(['qin']);
    expect(activeTerritories(territories, -209).map((item) => item.polityId)).toEqual(expect.arrayContaining(['qin', 'zhangchu']));
    expect(activeTerritories(territories, -206).map((item) => item.polityId)).toEqual(expect.arrayContaining(['han', 'western-chu']));
    expect(activeTerritories(territories, -200).map((item) => item.polityId)).toEqual(expect.arrayContaining(['han', 'xiongnu', 'nanyue']));
  });

  it('allows explicit gaps without inferring territory', () => {
    const gap = territories.filter((snapshot) => snapshot.polityId === 'zhangchu');
    expect(activeTerritories(gap, -205)).toEqual([]);
  });

  it('passes territory validation', () => {
    expect(validateTerritories(territories, polities)).toEqual([]);
  });

  it('reports duplicate ids, unknown polities, invalid years, sources and geometry', () => {
    const base = territories[0];
    const invalid: TerritorySnapshot[] = [
      base,
      { ...base, scenarioId: '', polityId: 'missing', startYear: -250, sources: [], control: 'invalid' as TerritorySnapshot['control'], geometry: { type: 'Polygon', coordinates: [[[70, 20], [80, 20], [80, 30]]] } },
    ];
    const errors = validateTerritories(invalid, polities);
    expect(errors).toEqual(expect.arrayContaining([
      `${base.id}: duplicated id`,
      `${base.id}: missing scenario`,
      `${base.id}: unknown polity`,
      `${base.id}: invalid year range`,
      `${base.id}: missing source`,
      `${base.id}: invalid control level`,
      `${base.id}: polygon ring needs at least four points`,
      `${base.id}: polygon ring is not closed`,
    ]));
  });
});
