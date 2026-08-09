import { END_YEAR, START_YEAR, formatYear } from '@/lib/timeline';
import type { Era } from '@/lib/types';

export type TimelineProps = { currentYear: number; isPlaying: boolean; speed: 0.5 | 1 | 2 | 4; eras: Era[]; onYearChange: (year: number) => void; onToggle: () => void; onSpeed: (speed: 0.5 | 1 | 2 | 4) => void; onEra: (era: Era) => void };

function SpeedControls({ speed, onSpeed }: Pick<TimelineProps, 'speed' | 'onSpeed'>) {
  return <div className="flex items-center gap-2" aria-label="播放速度">{([0.5, 1, 2, 4] as const).map((value) => <button type="button" key={value} className={`speed-button ${speed === value ? 'speed-active' : ''}`} onClick={() => onSpeed(value)}>{value}×</button>)}</div>;
}

function EraControls({ currentYear, eras, onEra }: Pick<TimelineProps, 'currentYear' | 'eras' | 'onEra'>) {
  return <div className="flex flex-wrap gap-2">{eras.map((era) => <button type="button" key={era.id} onClick={() => onEra(era)} className={`era-button ${currentYear >= era.startYear && currentYear <= era.endYear ? 'era-active' : ''}`}>{era.name}</button>)}</div>;
}

function YearRange({ currentYear, onYearChange }: Pick<TimelineProps, 'currentYear' | 'onYearChange'>) {
  return <><input className="timeline-range" type="range" min={START_YEAR} max={END_YEAR} value={currentYear} onChange={(event) => onYearChange(Number(event.target.value))} aria-label={`历史年份，当前${formatYear(currentYear)}`} /><div className="flex justify-between text-xs text-stone-500"><span>{formatYear(START_YEAR)}</span><span>{formatYear(END_YEAR)}</span></div></>;
}

export function MobileTimeline(props: TimelineProps) {
  return <section className="mobile-timeline-shell" aria-label="移动端时间控制"><div className="mobile-timeline-primary"><div><p className="eyebrow">当前年份</p><p className="mobile-current-year" aria-live="polite">{formatYear(props.currentYear)}</p></div><button type="button" className="control-button mobile-play-button" onClick={props.onToggle}>{props.isPlaying ? '暂停' : '播放'}</button></div><YearRange currentYear={props.currentYear} onYearChange={props.onYearChange} /><details className="mobile-timeline-more"><summary>更多控制</summary><div className="mobile-timeline-more-content"><SpeedControls speed={props.speed} onSpeed={props.onSpeed} /><EraControls currentYear={props.currentYear} eras={props.eras} onEra={props.onEra} /></div></details></section>;
}

export function Timeline(props: TimelineProps) {
  return <section className="timeline-shell desktop-timeline border-t border-stone-700/70 bg-stone-950/95 px-5 py-4 md:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">当前年份</p><p className="text-2xl font-semibold text-amber-200" aria-live="polite">{formatYear(props.currentYear)}</p></div><div className="flex items-center gap-2"><button type="button" className="control-button" onClick={props.onToggle}>{props.isPlaying ? '暂停' : '播放'}</button><SpeedControls speed={props.speed} onSpeed={props.onSpeed} /></div></div><YearRange currentYear={props.currentYear} onYearChange={props.onYearChange} /><EraControls currentYear={props.currentYear} eras={props.eras} onEra={props.onEra} /></div></section>;
}
