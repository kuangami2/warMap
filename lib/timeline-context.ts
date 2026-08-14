import type { CoverageWindow, WarEvent } from './types';

export type TimelineContext = { status: 'eventful' | 'curated-empty' | 'not-curated'; note: string };

export function timelineContextForYear(wars: WarEvent[], coverage: CoverageWindow[], year: number): TimelineContext {
  if (wars.some((war) => war.startYear <= year && war.endYear >= year)) return { status: 'eventful', note: '当前时间窗口有已收录事件。' };
  const window = coverage.find((item) => item.startYear <= year && item.endYear >= year);
  if (!window || window.status === 'not-curated') return { status: 'not-curated', note: window?.note ?? '该时间窗口尚未进入当前专题的审校覆盖范围。' };
  return { status: 'curated-empty', note: window.note };
}
