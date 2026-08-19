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

  it('covers the fixed fifteen-event public imagery set', () => {
    const images = [...getScenarioData('qin-han').landmarkImages, ...getScenarioData('han-three-kingdoms').landmarkImages];
    expect(images).toHaveLength(15);
    expect(images.map((image) => image.eventId)).toEqual(expect.arrayContaining([
      'julu-battle', 'pengcheng-battle', 'jingxing-battle', 'gaixia-battle', 'han-kunyang-battle', 'tk-yellow-turban-uprising', 'tk-guandu-battle', 'tk-red-cliffs', 'tk-hanzhong-campaign', 'tk-yiling-battle', 'tk-first-northern-expedition', 'tk-wuzhang-plains', 'tk-gaoping-tombs', 'tk-wei-conquers-shu', 'tk-western-jin-conquers-wu',
    ]));
    expect(images.every((image) => image.path.endsWith('.webp') && image.path.startsWith('./landmarks/') && !image.path.endsWith('.webp.webp'))).toBe(true);
  });
});
