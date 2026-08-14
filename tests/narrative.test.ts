import { describe, expect, it } from 'vitest';
import { createNarrativeMoments, narrativeMomentById, narrativeMomentForYear, nextNarrativeMoment, previousNarrativeMoment } from '../lib/narrative';
import { wars } from '../data/wars';

describe('war narrative sequence', () => {
  const moments = createNarrativeMoments(wars);

  it('resolves every curated story step to an audited map event in its editorial order', () => {
    expect(moments.length).toBeGreaterThanOrEqual(12);
    expect(moments.every((moment, index) => moment.order === index)).toBe(true);
    expect(moments.every((moment) => moment.title && moment.text && moment.sourceTitle && moment.focus.scale >= 1.8)).toBe(true);
  });

  it('moves through steps safely at both boundaries', () => {
    const first = moments[0];
    const last = moments[moments.length - 1];
    expect(previousNarrativeMoment(moments, first.id)).toBeUndefined();
    expect(nextNarrativeMoment(moments, last.id)).toBeUndefined();
    expect(nextNarrativeMoment(moments, first.id)?.order).toBe(first.order + 1);
  });

  it('restores a shared moment without initiating playback and resolves a useful step for a year', () => {
    const restored = narrativeMomentById(moments, 'jingxing-battle');
    expect(restored?.title).toBe('井陉之战');
    expect(narrativeMomentForYear(moments, -205)?.id).toBe('pengcheng-battle');
    expect(narrativeMomentById(moments, 'not-a-story')).toBeUndefined();
  });
});
