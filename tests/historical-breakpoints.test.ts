import { describe, expect, it } from 'vitest';
import { historicalBreakpointForYear, historicalBreakpoints } from '../data/historicalBreakpoints';

describe('Han–Three Kingdoms historical breakpoints', () => {
  it('defines the audited dynastic transitions and keeps them scoped to the topic', () => {
    expect(historicalBreakpoints.map((item) => item.year)).toEqual([220, 229, 263, 265, 280]);
    expect(historicalBreakpoints.every((item) => item.scenarioId === 'han-three-kingdoms')).toBe(true);
  });

  it('shows a compact notice only at the transition year or its adjacent reading years', () => {
    expect(historicalBreakpointForYear('han-three-kingdoms', 280)?.title).toBe('西晋统一');
    expect(historicalBreakpointForYear('han-three-kingdoms', 279)?.title).toBe('西晋统一');
    expect(historicalBreakpointForYear('han-three-kingdoms', 277)).toBeUndefined();
    expect(historicalBreakpointForYear('qin-han', -220)).toBeUndefined();
  });
});
