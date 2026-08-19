'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildEvidenceSources, collectionToJson, collectionToMarkdown, parseResearchIds, sanitizeResearchCollection, type EvidenceSource, type ResearchCollectionItem } from '@/lib/research-collection';
import type { ScenarioData } from '@/lib/types';

const STORAGE_KEY = 'war-map-research-collection-v1';
const kindLabel: Record<ResearchCollectionItem['kind'], string> = { event: '事件', place: '地点', route: '路线', territory: '势力快照', image: '事件影像', quotation: '引文' };

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
}

export function EvidenceDesk({ data }: { data: ScenarioData }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'primary' | 'atlas' | 'modern-study'>('all');
  const [confidence, setConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [collection, setCollection] = useState<ResearchCollectionItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ResearchCollectionItem[]; } catch { return []; }
  });
  const sources = useMemo(() => buildEvidenceSources(data), [data]);
  const visibleSources = useMemo(() => sources.filter((source) => (kind === 'all' || source.kind === kind) && (!query.trim() || `${source.title} ${source.citation ?? ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) && (confidence === 'all' || source.records.some((record) => record.confidence === confidence))), [confidence, kind, query, sources]);
  const selectedSource = visibleSources.find((source) => source.id === selectedSourceId) ?? visibleSources[0];

  useEffect(() => {
    const timer = window.setTimeout(() => setCollection((current) => sanitizeResearchCollection(current, data)), 0);
    return () => window.clearTimeout(timer);
  }, [data]);
  useEffect(() => {
    const fromUrl = parseResearchIds(new URLSearchParams(window.location.search).get('research'), data);
    if (!fromUrl.length) return;
    const timer = window.setTimeout(() => setCollection((current) => sanitizeResearchCollection([...current, ...fromUrl], data)), 0);
    return () => window.clearTimeout(timer);
  }, [data]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    const url = new URL(window.location.href);
    const value = collection.map((item) => `${item.kind}:${item.id}`).join(',');
    if (value) url.searchParams.set('research', value); else url.searchParams.delete('research');
    window.history.replaceState(null, '', url.toString());
  }, [collection]);

  function toggle(record: { id: string; kind: ResearchCollectionItem['kind'] }) {
    setCollection((current) => current.some((item) => item.id === record.id && item.kind === record.kind) ? current.filter((item) => !(item.id === record.id && item.kind === record.kind)) : sanitizeResearchCollection([...current, { ...record, addedAt: new Date().toISOString() }], data));
  }
  function isSaved(id: string, itemKind: ResearchCollectionItem['kind']) { return collection.some((item) => item.id === id && item.kind === itemKind); }
  function updateNote(id: string, itemKind: ResearchCollectionItem['kind'], note: string) { setCollection((current) => current.map((item) => item.id === id && item.kind === itemKind ? { ...item, note: note.slice(0, 240) } : item)); }
  function moveItem(index: number, delta: -1 | 1) { setCollection((current) => { const next = [...current]; const target = index + delta; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; }); }

  return <section className="evidence-desk" aria-label="来源证据台">
    <button type="button" className="evidence-desk-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>来源证据台{collection.length ? ` · ${collection.length}` : ''}</button>
    {open && <div className="evidence-desk-panel">
      <div className="evidence-desk-heading"><div><p className="eyebrow">研究工具</p><h2>来源证据台</h2></div><button type="button" className="close-button" onClick={() => setOpen(false)} aria-label="关闭来源证据台">×</button></div>
      <div className="evidence-desk-controls"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索来源标题或引文" aria-label="搜索来源" /><select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)} aria-label="来源类型"><option value="all">全部来源</option><option value="primary">一手史料</option><option value="atlas">历史地图集</option><option value="modern-study">现代研究</option></select><select value={confidence} onChange={(event) => setConfidence(event.target.value as typeof confidence)} aria-label="关联可信度"><option value="all">全部可信度</option><option value="high">高可信度</option><option value="medium">中可信度</option><option value="low">低可信度</option></select></div>
      <div className="evidence-desk-grid"><div className="evidence-source-list" role="listbox" aria-label="来源目录">{visibleSources.map((source) => <button key={source.id} type="button" role="option" aria-selected={selectedSource?.id === source.id} onClick={() => setSelectedSourceId(source.id)}><strong>{source.title}</strong><span>{source.kind} · {source.records.length} 条关联</span></button>)}</div><EvidenceSourceDetail source={selectedSource} saved={isSaved} onToggle={toggle} /></div>
      <div className="evidence-desk-footer"><strong>本地研究收藏 · {collection.length}</strong><button type="button" onClick={() => download('war-map-research.md', collectionToMarkdown(collection, data), 'text/markdown')}>导出 Markdown</button><button type="button" onClick={() => download('war-map-research.json', collectionToJson(collection, data), 'application/json')}>导出 JSON</button></div>
      {collection.length > 0 && <ol className="evidence-collection-list">{collection.map((item, index) => <li key={`${item.kind}-${item.id}`}><div><strong>{item.kind}:{item.id}</strong><textarea aria-label={`为 ${item.id} 添加私人笔记`} value={item.note ?? ''} onChange={(event) => updateNote(item.id, item.kind, event.target.value)} placeholder="私人笔记（不会写入分享链接）" /></div><div className="evidence-collection-actions"><button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label="收藏项上移">↑</button><button type="button" onClick={() => moveItem(index, 1)} disabled={index === collection.length - 1} aria-label="收藏项下移">↓</button><button type="button" onClick={() => setCollection((current) => current.filter((candidate) => !(candidate.id === item.id && candidate.kind === item.kind)))}>移除</button></div></li>)}</ol>}
    </div>}
  </section>;
}

function EvidenceSourceDetail({ source, saved, onToggle }: { source?: EvidenceSource; saved: (id: string, kind: ResearchCollectionItem['kind']) => boolean; onToggle: (record: { id: string; kind: ResearchCollectionItem['kind'] }) => void }) {
  if (!source) return <div className="evidence-source-detail" role="status">没有匹配来源。</div>;
  return <div className="evidence-source-detail"><p className="eyebrow">{source.kind} · {source.id}</p><h3>{source.title}</h3>{source.citation && <p>{source.citation}</p>}{source.claim && <p>{source.claim}</p>}<ul>{source.records.map((record) => <li key={`${record.kind}-${record.id}`}><div><strong>{record.name}</strong><span>{kindLabel[record.kind]} · {record.confidence}</span><p>{record.detail}</p></div><button type="button" aria-pressed={saved(record.id, record.kind)} onClick={() => onToggle(record)}>{saved(record.id, record.kind) ? '已收藏' : '收藏'}</button></li>)}</ul></div>;
}
