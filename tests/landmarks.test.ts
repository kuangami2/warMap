import { describe, expect, it } from 'vitest';
import { landmarkForYear } from '../lib/landmarks';
import { getScenarioData } from '../lib/repository';

describe('landmark event imagery', () => {
  it('prefers a selected event and otherwise resolves editorial priority for a year', () => {
    const data = getScenarioData('han-three-kingdoms');
    expect(landmarkForYear(data.landmarkImages, 208)?.eventId).toBe('tk-red-cliffs');
    expect(landmarkForYear(data.landmarkImages, 207)).toBeUndefined();
    expect(landmarkForYear(data.landmarkImages, 0, 'tk-red-cliffs')?.id).toBe('landmark-red-cliffs');
  });
});
