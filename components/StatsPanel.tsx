import type { WarEvent } from '@/lib/types';

export function StatsPanel({ wars }: { wars: WarEvent[] }) {
  const regions = new Set(wars.flatMap((war) => war.locations.map((location) => location.modernName?.split('，')[0] ?? location.name)));
  const routed = wars.filter((war) => war.routes?.length).length;
  return <aside className="panel flex min-h-0 flex-col gap-5 p-5"><div><p className="eyebrow">当前窗口</p><h2 className="text-2xl font-semibold">战争态势</h2></div><div className="grid grid-cols-3 gap-2"><Stat label="事件" value={wars.length} /><Stat label="区域" value={regions.size} /><Stat label="路线" value={routed} /></div><div className="event-overview"><p className="eyebrow">事件速览</p>{wars.length ? wars.map((war) => <div className="border-l-2 border-amber-400/80 pl-3" key={war.id}><div className="flex items-center justify-between gap-2"><p className="font-medium text-stone-100">{war.name}</p><span className="scale-badge">{war.scale}</span></div><p className="mt-1 text-xs leading-5 text-stone-400">{war.summary}</p></div>) : <p className="text-sm text-stone-400">这一时间窗口暂未录入事件。继续向后拖动时间轴查看下一阶段。</p>}</div></aside>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-stone-800/70 p-3"><p className="text-2xl font-semibold text-amber-200">{value}</p><p className="mt-1 text-xs text-stone-400">{label}</p></div>; }
