import { useEffect, useRef } from 'react';
import { formatYear } from '@/lib/timeline';
import type { Era } from '@/lib/types';

export type PlaybackStatus = 'idle' | 'paused' | 'playing' | 'ended';
export type TimelineProps = { currentYear: number; startYear: number; endYear: number; playbackStatus: PlaybackStatus; speed: 0.5 | 1 | 2 | 4; eras: Era[]; onYearChange: (year: number) => void; onToggle: () => void; onSpeed: (speed: 0.5 | 1 | 2 | 4) => void; onEra: (era: Era) => void };

function PlaybackGlyph({ playing }: { playing: boolean }) {
  return playing
    ? <svg aria-hidden="true" viewBox="0 0 16 16" className="timeline-primary-icon"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
    : <svg aria-hidden="true" viewBox="0 0 16 16" className="timeline-primary-icon"><path d="M4 2.6 13 8 4 13.4z" /></svg>;
}

function TimelinePrimaryAction({ playbackStatus, onToggle }: Pick<TimelineProps, 'playbackStatus' | 'onToggle'>) {
  const isPlaying = playbackStatus === 'playing';
  const label = isPlaying ? '暂停播放' : playbackStatus === 'ended' ? '重新播放' : '播放历史';
  return <button type="button" className={`timeline-primary-action ${isPlaying ? 'timeline-primary-action-playing' : ''}`} onClick={onToggle} aria-label={label} aria-pressed={isPlaying}>
    <PlaybackGlyph playing={isPlaying} />
    <span>{label}</span>
  </button>;
}

function SpeedControls({ speed, onSpeed }: Pick<TimelineProps, 'speed' | 'onSpeed'>) {
  return <div className="flex items-center gap-2" aria-label="播放速度">{([0.5, 1, 2, 4] as const).map((value) => <button type="button" key={value} className={`speed-button ${speed === value ? 'speed-active' : ''}`} onClick={() => onSpeed(value)}>{value}×</button>)}</div>;
}

function EraControls({ currentYear, eras, onEra }: Pick<TimelineProps, 'currentYear' | 'eras' | 'onEra'>) {
  return <div className="flex flex-wrap gap-2">{eras.map((era) => <button type="button" key={era.id} onClick={() => onEra(era)} className={`era-button ${currentYear >= era.startYear && currentYear <= era.endYear ? 'era-active' : ''}`}>{era.name}</button>)}</div>;
}

function YearRange({ currentYear, startYear, endYear, onYearChange }: Pick<TimelineProps, 'currentYear' | 'startYear' | 'endYear' | 'onYearChange'>) {
  const frameRef = useRef<number>();
  const latestYearRef = useRef(currentYear);
  useEffect(() => () => { if (frameRef.current !== undefined) window.cancelAnimationFrame(frameRef.current); }, []);

  function queueYear(year: number) {
    latestYearRef.current = year;
    // Browsers can emit far more range input events than the display can draw.
    // One state update per animation frame keeps the thumb direct while the
    // historical layers only refresh at the screen's useful cadence.
    if (frameRef.current !== undefined) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = undefined;
      onYearChange(latestYearRef.current);
    });
  }

  return <><input className="timeline-range" type="range" min={startYear} max={endYear} value={currentYear} onChange={(event) => queueYear(Number(event.target.value))} aria-label={`历史年份，当前${formatYear(currentYear)}`} /><div className="flex justify-between text-xs text-stone-500"><span>{formatYear(startYear)}</span><span>{formatYear(endYear)}</span></div></>;
}

export function MobileTimeline(props: TimelineProps) {
  return <section className="mobile-timeline-shell" aria-label="移动端时间控制"><div className="mobile-timeline-primary"><div><p className="eyebrow">当前年份</p><p className="mobile-current-year" aria-live="polite">{formatYear(props.currentYear)}</p></div><TimelinePrimaryAction playbackStatus={props.playbackStatus} onToggle={props.onToggle} /></div><YearRange currentYear={props.currentYear} startYear={props.startYear} endYear={props.endYear} onYearChange={props.onYearChange} /><details className="mobile-timeline-more"><summary>更多控制</summary><div className="mobile-timeline-more-content"><SpeedControls speed={props.speed} onSpeed={props.onSpeed} /><EraControls currentYear={props.currentYear} eras={props.eras} onEra={props.onEra} /></div></details></section>;
}

export function Timeline(props: TimelineProps) {
  return <section className="timeline-shell desktop-timeline border-t border-stone-700/70 bg-stone-950/95 px-5 py-4 md:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-3"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div><p className="eyebrow">当前年份</p><p className="text-2xl font-semibold text-amber-200" aria-live="polite">{formatYear(props.currentYear)}</p></div><TimelinePrimaryAction playbackStatus={props.playbackStatus} onToggle={props.onToggle} /></div><SpeedControls speed={props.speed} onSpeed={props.onSpeed} /></div><YearRange currentYear={props.currentYear} startYear={props.startYear} endYear={props.endYear} onYearChange={props.onYearChange} /><EraControls currentYear={props.currentYear} eras={props.eras} onEra={props.onEra} /></div></section>;
}
