'use client';

import { useEffect, useRef } from 'react';
import { formatYear } from '@/lib/timeline';
import type { WarEvent } from '@/lib/types';

const kindLabel: Record<WarEvent['kind'], string> = { war: '战争进程', battle: '具体战役', siege: '围城与据点争夺', uprising: '起义', political: '政治转折', diplomatic: '外交与议和', campaign: '军事行动' };

export function WarDetailDrawer({ war, onClose }: { war?: WarEvent; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!war) return;
    const previousOverflow = document.body.style.overflow;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawerElement = drawerRef.current;
    if (isMobile) document.body.style.overflow = 'hidden';
    const focusTimer = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      if (previouslyFocused && document.contains(previouslyFocused) && !drawerElement?.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, [war, onClose]);

  if (!war) return null;
  return <>
    <button type="button" className="detail-backdrop" aria-label="关闭事件详情" onClick={onClose} />
    <section ref={drawerRef} className="panel detail-drawer" role="dialog" aria-modal="true" aria-labelledby="war-detail-title" tabIndex={-1}>
      <div className="detail-drawer-grip" />
      <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">{formatYear(war.startYear)}{war.endYear !== war.startYear ? `—${formatYear(war.endYear)}` : ''}</p><h2 id="war-detail-title" className="mt-1 text-2xl font-semibold">{war.name}</h2></div><button type="button" ref={closeButtonRef} className="close-button" onClick={onClose} aria-label="关闭详情">×</button></div>
      <p className="mt-2 text-xs text-amber-200/80">事件性质：{kindLabel[war.kind]}</p>
      <Detail title="概述" text={war.summary} /><Detail title="背景" text={war.background} /><Detail title="结果" text={war.result} /><Detail title="历史影响" text={war.impact} />
      <div className="mt-5"><p className="eyebrow">参与方</p><p className="mt-2 text-sm text-stone-300">{war.participants.map((participant) => participant.name).join(' · ')}</p></div>
      <div className="mt-5"><p className="eyebrow">地点</p><p className="mt-2 text-sm text-stone-300">{war.locations.map((location) => `${location.name}（${location.modernName ?? '位置待考'}）`).join('；')}</p>{war.locations.some((location) => location.note) && <p className="mt-2 text-sm leading-6 text-stone-400">地望说明：{war.locations.map((location) => location.note).filter(Boolean).join('；')}</p>}</div>
      {war.routes?.map((route, index) => <Detail key={`${route.actorId}-${index}`} title="行军路线" text={route.description} />)}
      {war.troopEstimate && <Detail title="规模说明" text={war.troopEstimate.display} />}
      <div className="mt-5"><p className="eyebrow">可信度与来源</p><p className="mt-2 text-sm text-stone-300">可信度：{war.confidence === 'high' ? '高' : war.confidence === 'medium' ? '中' : '低'}</p>{war.uncertaintyNote && <p className="mt-2 text-sm leading-6 text-amber-100/80">争议与边界：{war.uncertaintyNote}</p>}<ul className="mt-2 space-y-2 text-sm text-stone-400">{war.sources.map((source) => <li key={source.id ?? source.title}><strong className="text-stone-300">{source.title}</strong>{source.citation ? `：${source.citation}` : ''}{source.claim ? `（${source.claim}）` : ''}{source.note ? <span className="block">{source.note}</span> : null}</li>)}</ul></div>
    </section>
  </>;
}

function Detail({ title, text }: { title: string; text: string }) {
  return <div className="mt-5"><p className="eyebrow">{title}</p><p className="mt-2 text-sm leading-6 text-stone-300">{text}</p></div>;
}
