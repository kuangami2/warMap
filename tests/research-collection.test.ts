import { describe, expect, it } from 'vitest';
import { buildEvidenceSources, collectionToJson, collectionToMarkdown, parseResearchIds, sanitizeResearchCollection } from '../lib/research-collection';
import { getScenarioData } from '../lib/repository';

describe('research evidence desk', () => {
  const data = getScenarioData('han-three-kingdoms');
  it('builds a reverse source index including landmark imagery', () => {
    const source = buildEvidenceSources(data).find((entry) => entry.id === data.landmarkImages[0].sourceId);
    expect(source?.records.some((record) => record.kind === 'image')).toBe(true);
    expect(source?.records.some((record) => record.kind === 'event')).toBe(true);
  });
  it('sanitizes invalid IDs and exports stable public references without private notes in URLs', () => {
    const items = sanitizeResearchCollection([{ id: data.wars[0].id, kind: 'event', addedAt: '2026-01-01', note: 'private' }, { id: 'missing', kind: 'event', addedAt: '2026-01-01' }], data);
    expect(items).toHaveLength(1);
    expect(parseResearchIds(`event:${data.wars[0].id},event:missing`, data)).toHaveLength(1);
    expect(collectionToMarkdown(items, data)).toContain('私人笔记：private');
    expect(collectionToJson(items, data)).toContain(data.wars[0].id);
    expect(collectionToJson(items, data)).not.toContain('missing');
  });
});
