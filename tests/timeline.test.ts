import { describe, expect, it } from 'vitest';
import { END_YEAR, START_YEAR, activeWars, clampYear, formatYear } from '../lib/timeline';
import { wars } from '../data/wars';
import { polities } from '../data/polities';
import { validateWars } from '../lib/validation';

describe('timeline utilities', () => {
  it('formats BCE years for display', () => { expect(formatYear(-230)).toBe('前230年'); });
  it('clamps range boundaries', () => { expect(clampYear(-500)).toBe(START_YEAR); expect(clampYear(0)).toBe(END_YEAR); });
  it('finds events in the active time window', () => { expect(activeWars(wars, -221).map((war) => war.id)).toContain('qin-conquest-qi'); expect(activeWars(wars, -200).map((war) => war.id)).toContain('baideng-siege'); });
  it('contains the 1.2 curated minimum number of sourced events', () => {
    expect(wars.length).toBeGreaterThanOrEqual(39);
    expect(Math.max(...wars.map((war) => war.endYear))).toBe(-200);
    expect(wars.every((war) => war.sources.length > 0 && war.locations.length > 0)).toBe(true);
  });
  it('passes historical data validation and includes enough mapped routes', () => {
    expect(validateWars(wars, polities)).toEqual([]);
    expect(wars.filter((war) => war.routes?.length).length).toBeGreaterThanOrEqual(8);
    expect(Array.from(new Set(wars.map((war) => war.kind)))).toEqual(expect.arrayContaining(['battle', 'uprising', 'political', 'diplomatic']));
  });

  it('keeps explicit polity mappings for the key linked events', () => {
    const linked = new Map(wars.map((war) => [war.id, war]));
    expect(linked.get('qin-conquest-han')?.participants.map((participant) => participant.polityId)).toEqual(['qin', 'han-state']);
    expect(linked.get('gaixia-battle')?.participants.map((participant) => participant.polityId)).toEqual(['han', 'western-chu']);
    expect(linked.get('baideng-siege')?.participants.map((participant) => participant.polityId)).toEqual(['han', 'xiongnu']);
  });
});
