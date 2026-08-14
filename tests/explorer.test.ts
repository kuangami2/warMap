import { describe, expect, it } from 'vitest';
import { historicalPlaces } from '../data/places';
import { wars } from '../data/wars';
import { searchExplorer } from '../lib/explorer';

describe('map explorer search', () => {
  it('finds events and auditable place references without generic region shortcuts', () => {
    expect(searchExplorer('巨鹿', wars, historicalPlaces)).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'event', id: 'julu-battle' }),
      expect.objectContaining({ kind: 'place', id: 'julu-county' }),
    ]));
    expect(searchExplorer('关中', wars, historicalPlaces).map((result) => result.id)).not.toContain('guanzhong');
  });

  it('returns no result for an empty or unknown query', () => {
    expect(searchExplorer('', wars, historicalPlaces)).toEqual([]);
    expect(searchExplorer('不存在的地点', wars, historicalPlaces)).toEqual([]);
  });
});
