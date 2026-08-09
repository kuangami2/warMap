export function Header({ eraName }: { eraName: string }) {
  return <header className="flex items-center justify-between border-b border-stone-700/70 px-5 py-4 md:px-8"><div><p className="eyebrow">前230年 — 前180年</p><h1>秦统一至汉初 · 历史战争地图</h1></div><div className="hidden rounded-full border border-amber-400/30 bg-amber-300/10 px-3 py-1 text-sm text-amber-200 sm:block">{eraName}</div></header>;
}
