'use client';

import { useEffect, useRef, useState } from 'react';
import { landmarkForYear } from '@/lib/landmarks';
import { formatYear } from '@/lib/timeline';
import type { LandmarkImage } from '@/lib/types';

type NetworkInformation = { saveData?: boolean; addEventListener?: (type: 'change', listener: () => void) => void; removeEventListener?: (type: 'change', listener: () => void) => void };

function imageClassLabel(value: LandmarkImage['classification']) {
  if (value === 'historical-artwork') return '历史图像';
  if (value === 'later-artwork') return '后世创作';
  return '现代视觉重构';
}

export function LandmarkBackdrop({ images, year, selectedEventId, enabled }: { images: LandmarkImage[]; year: number; selectedEventId?: string; enabled: boolean }) {
  const requested = enabled ? landmarkForYear(images, year, selectedEventId) : undefined;
  const [displayed, setDisplayed] = useState<LandmarkImage>();
  const [previous, setPrevious] = useState<LandmarkImage>();
  const displayedRef = useRef<LandmarkImage>();
  const [mediaAllowed, setMediaAllowed] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const update = () => setMediaAllowed(!connection?.saveData);
    update();
    connection?.addEventListener?.('change', update);
    return () => connection?.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const delay = selectedEventId ? 0 : 220;
    const timer = window.setTimeout(() => {
      const current = displayedRef.current;
      if (current?.id === requested?.id) return;
      setPrevious(current);
      displayedRef.current = requested;
      setDisplayed(requested);
      window.setTimeout(() => setPrevious(undefined), 520);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [requested, selectedEventId]);

  if (!enabled || !displayed) return null;
  const detail = <><q>{displayed.quotation}</q><cite>{displayed.quotationCitation}</cite><span>{displayed.applicability}</span><small>{imageClassLabel(displayed.classification)} · {displayed.attribution} · {displayed.license}{displayed.uncertaintyNote ? ` · ${displayed.uncertaintyNote}` : ''}</small></>;
  return <div className="landmark-backdrop" data-landmark-id={displayed.id}>
    <div className="landmark-image-stack" aria-hidden="true">
      {mediaAllowed && previous && <div className="landmark-image landmark-image-leaving" style={{ backgroundImage: `url(${previous.path})`, backgroundPosition: `${previous.focalPoint.x}% ${previous.focalPoint.y}%` }} />}
      {mediaAllowed && <div key={displayed.id} className="landmark-image landmark-image-entering" role="img" aria-label={displayed.alt} style={{ backgroundImage: `url(${displayed.path})`, backgroundPosition: `${displayed.focalPoint.x}% ${displayed.focalPoint.y}%` }} />}
    </div>
    <div className="landmark-quotation landmark-quotation-desktop"><p className="eyebrow">{formatYear(displayed.displayYear)} · 事件影像</p>{detail}</div>
    <details className="landmark-quotation landmark-quotation-mobile"><summary>{formatYear(displayed.displayYear)} · {displayed.quotation}</summary><div>{detail}</div></details>
  </div>;
}
