'use client';

import { useEffect, useRef } from 'react';
import { formatYear } from '@/lib/timeline';
import type { WarEvent } from '@/lib/types';

export function WarDetailDrawer({ war, onClose }: { war?: WarEvent; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!war) return;
    const previousOverflow = document.body.style.overflow;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [war, onClose]);

  if (!war) return null;
  return <>
    <button type="button" className="detail-backdrop" aria-label="关闭事件详情" onClick={onClose} />
    <section className="panel detail-drawer" role="dialog" aria-modal="true" aria-labelledby="war-detail-title">
      <div className="detail-drawer-grip" />
      <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">{formatYear(war.startYear)}{war.endYear !== war.startYear ? `—${formatYear(war.endYear)}` : ''}</p><h2 id="war-detail-title" className="mt-1 text-2xl font-semibold">{war.name}</h2></div><button ref={closeButtonRef} className="close-button" onClick={onClose} aria-label="关闭详情">×</button></div>
      <Detail title="概述" text={war.summary} /><Detail title="背景" text={war.background} /><Detail title="结果" text={war.result} /><Detail title="历史影响" text={war.impact} />
      <div className="mt-5"><p className="eyebrow">参与方</p><p className="mt-2 text-sm text-stone-300">{war.participants.map((participant) => participant.name).join(' · ')}</p></div>
      <div className="mt-5"><p className="eyebrow">地点</p><p className="mt-2 text-sm text-stone-300">{war.locations.map((location) => `${location.name}（${location.modernName ?? '位置待考'}）`).join('；')}</p></div>
      {war.routes?.map((route, index) => <Detail key={`${route.actorId}-${index}`} title="行军路线" text={route.description} />)}
      {war.troopEstimate && <Detail title="规模说明" text={war.troopEstimate.display} />}
      <div className="mt-5"><p className="eyebrow">可信度与来源</p><p className="mt-2 text-sm text-stone-300">可信度：{war.confidence === 'high' ? '高' : war.confidence === 'medium' ? '中' : '低'}</p><ul className="mt-2 space-y-1 text-sm text-stone-400">{war.sources.map((source) => <li key={source.title}>{source.title}{source.note ? `（${source.note}）` : ''}</li>)}</ul></div>
    </section>
  </>;
}

function Detail({ title, text }: { title: string; text: string }) {
  return <div className="mt-5"><p className="eyebrow">{title}</p><p className="mt-2 text-sm leading-6 text-stone-300">{text}</p></div>;
}
