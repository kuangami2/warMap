import type { Confidence, LandmarkImage, ScenarioData, SourceCatalogEntry } from './types';

export type EvidenceRecord = { id: string; kind: 'event' | 'place' | 'route' | 'territory' | 'image'; name: string; confidence: Confidence; detail: string };
export type EvidenceSource = SourceCatalogEntry & { records: EvidenceRecord[] };
export type ResearchCollectionItem = { id: string; kind: EvidenceRecord['kind'] | 'quotation'; addedAt: string; note?: string };

export function buildEvidenceSources(data: ScenarioData): EvidenceSource[] {
  const bySource = new Map<string, EvidenceSource>();
  const ensure = (source: SourceCatalogEntry) => {
    const existing = bySource.get(source.id);
    if (existing) return existing;
    const created = { ...source, records: [] };
    bySource.set(source.id, created);
    return created;
  };
  for (const source of data.sourceCatalog) ensure(source);
  for (const war of data.wars) for (const source of war.sources) ensure(source as SourceCatalogEntry).records.push({ id: war.id, kind: 'event', name: war.name, confidence: war.confidence, detail: war.summary });
  for (const place of data.places) for (const source of place.sources) ensure(source as SourceCatalogEntry).records.push({ id: place.id, kind: 'place', name: place.name, confidence: place.confidence, detail: `${place.modernName} · ${place.note}` });
  for (const territory of data.territories) for (const source of territory.sources) ensure(source as SourceCatalogEntry).records.push({ id: territory.id, kind: 'territory', name: territory.id, confidence: territory.confidence, detail: territory.description });
  for (const image of data.landmarkImages) ensure(data.sourceCatalog.find((source) => source.id === image.sourceId) ?? { id: image.sourceId, title: image.sourceId, kind: 'primary' }).records.push({ id: image.id, kind: 'image', name: `事件影像 · ${image.eventId}`, confidence: 'high', detail: `${image.quotation} · ${image.license}` });
  return [...bySource.values()].map((source) => ({ ...source, records: source.records.filter((record, index, all) => all.findIndex((candidate) => candidate.id === record.id && candidate.kind === record.kind) === index) })).sort((left, right) => left.title.localeCompare(right.title, 'zh-Hans-CN'));
}

export function sanitizeResearchCollection(items: ResearchCollectionItem[], data: ScenarioData) {
  const valid = new Set<string>([
    ...data.wars.map((record) => `event:${record.id}`),
    ...data.places.map((record) => `place:${record.id}`),
    ...data.territories.map((record) => `territory:${record.id}`),
    ...data.landmarkImages.map((record) => `image:${record.id}`),
  ]);
  return items.filter((item, index) => valid.has(`${item.kind}:${item.id}`) && items.findIndex((candidate) => candidate.kind === item.kind && candidate.id === item.id) === index).slice(0, 100);
}

export function collectionToMarkdown(items: ResearchCollectionItem[], data: ScenarioData) {
  const lines = ['# WarMap 研究收藏', '', `专题：${data.scenario.name}`, `导出时间：${new Date().toISOString()}`, ''];
  for (const item of items) {
    const record = item.kind === 'event' ? data.wars.find((value) => value.id === item.id) : item.kind === 'place' ? data.places.find((value) => value.id === item.id) : item.kind === 'image' ? data.landmarkImages.find((value) => value.id === item.id) : undefined;
    if (!record) continue;
    const name = 'name' in record ? record.name : 'alt' in record ? record.alt : item.id;
    lines.push(`## ${name}`, `- 稳定 ID：\`${item.id}\``, `- 类型：${item.kind}`, `- 可信度：${'confidence' in record ? record.confidence : 'high'}`, item.note ? `- 私人笔记：${item.note}` : '', '');
    if ('sources' in record) lines.push(...record.sources.map((source) => `- 来源：${source.title}${source.citation ? `；${source.citation}` : ''}`));
    if ('quotation' in record) lines.push(`- 引文：${record.quotation}`, `- 引文出处：${record.quotationCitation}`, `- 许可：${record.license}`);
    lines.push('');
  }
  return lines.filter((line, index, all) => !(line === '' && all[index - 1] === '')).join('\n');
}

export function collectionToJson(items: ResearchCollectionItem[], data: ScenarioData) {
  return JSON.stringify({ schema: 'war-map-research-collection@1', scenarioId: data.scenario.id, exportedAt: new Date().toISOString(), items: sanitizeResearchCollection(items, data) }, null, 2);
}

export function parseResearchIds(value: string | null, data: ScenarioData): ResearchCollectionItem[] {
  if (!value) return [];
  const valid = new Set<string>([...data.wars.map((record) => `event:${record.id}`), ...data.places.map((record) => `place:${record.id}`), ...data.landmarkImages.map((record) => `image:${record.id}`)]);
  return sanitizeResearchCollection(value.split(',').map((token) => { const [kind, ...id] = token.split(':'); return { id: id.join(':'), kind: kind as ResearchCollectionItem['kind'], addedAt: new Date().toISOString() }; }).filter((item) => valid.has(`${item.kind}:${item.id}`)), data);
}
