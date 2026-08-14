import type { HistoricalBreakpoint } from '@/data/historicalBreakpoints';

export function HistoricalBreakpointNotice({ breakpoint }: { breakpoint?: HistoricalBreakpoint }) {
  if (!breakpoint) return null;
  return <aside className="historical-breakpoint" aria-live="polite" aria-label={`历史断点：${breakpoint.title}`}>
    <span className="historical-breakpoint-year">{breakpoint.year} 年</span>
    <div><strong>{breakpoint.title}</strong><p>{breakpoint.description}</p></div>
  </aside>;
}
