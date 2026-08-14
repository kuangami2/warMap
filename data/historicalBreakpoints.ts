export type HistoricalBreakpoint = {
  scenarioId: string;
  year: number;
  title: string;
  description: string;
};

export const historicalBreakpoints: HistoricalBreakpoint[] = [
  { scenarioId: 'han-three-kingdoms', year: 220, title: '汉魏易代', description: '曹丕代汉建魏。此后势力层按阶段性军政活动显示，不代表固定国界或行政边界。' },
  { scenarioId: 'han-three-kingdoms', year: 229, title: '孙吴称帝', description: '孙权称帝，魏、蜀、吴的帝国体制均已形成；地图的势力面仍只是可审校的示意。' },
  { scenarioId: 'han-three-kingdoms', year: 263, title: '蜀汉灭亡', description: '魏灭蜀后，三国鼎立结束；西南图层的变化仅表达军政活动与影响范围。' },
  { scenarioId: 'han-three-kingdoms', year: 265, title: '魏晋禅代', description: '司马炎代魏建晋，统一战争的主体转为西晋与孙吴。' },
  { scenarioId: 'han-three-kingdoms', year: 280, title: '西晋统一', description: '建业降晋，长期分裂暂告结束；这不是精确历史行政区面的声明。' },
];

export function historicalBreakpointForYear(scenarioId: string, year: number) {
  return historicalBreakpoints.find((item) => item.scenarioId === scenarioId && Math.abs(item.year - year) <= 1);
}
