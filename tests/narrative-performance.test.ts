import { describe, expect, it } from 'vitest';
import { createNarrativeMoments } from '../lib/narrative';
import { getScenarioData } from '../lib/repository';

describe('narrative performance coverage', () => {
  it('keeps every curated narrative moment bound to an already audited event', () => {
    for (const scenarioId of ['qin-han', 'han-three-kingdoms']) {
      const data = getScenarioData(scenarioId);
      const moments = createNarrativeMoments(data.wars, data.narrativeEventIds);
      expect(moments.length).toBeGreaterThan(0);
      expect(moments.every((moment) => data.wars.some((war) => war.id === moment.eventId))).toBe(true);
    }
  });
});
