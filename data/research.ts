import type { CoverageWindow, ResearchRegion } from '@/lib/types';
import { HAN_THREE_KINGDOMS_SCENARIO_ID, QIN_HAN_SCENARIO_ID } from './scenarios';

export const researchRegions: ResearchRegion[] = [
  { id: 'qin-guanzhong', scenarioId: QIN_HAN_SCENARIO_ID, name: '关中与中原', description: '秦汉政权更替与楚汉相持的核心战区。' },
  { id: 'qin-northern-frontier', scenarioId: QIN_HAN_SCENARIO_ID, name: '北方边疆', description: '河套、北地与汉匈军事活动的专题分组。' },
  { id: 'han-jingzhou-yangtze', scenarioId: HAN_THREE_KINGDOMS_SCENARIO_ID, name: '荆州与长江', description: '荆州争夺、赤壁、夷陵与长江水路战局。' },
  { id: 'han-hanzhong-longyou', scenarioId: HAN_THREE_KINGDOMS_SCENARIO_ID, name: '汉中与关陇', description: '汉中门户、祁山、街亭和五丈原方向。' },
  { id: 'han-huainan-river-defense', scenarioId: HAN_THREE_KINGDOMS_SCENARIO_ID, name: '淮南与江防', description: '合肥、寿春、濡须与东兴的魏吴前线。' },
  { id: 'han-shu-jiange-chengdu', scenarioId: HAN_THREE_KINGDOMS_SCENARIO_ID, name: '蜀地与剑阁', description: '益州、剑阁、阴平与成都的山地交通战区。' },
];

export const coverageWindows: CoverageWindow[] = [
  { id: 'qin-han-core', scenarioId: QIN_HAN_SCENARIO_ID, startYear: -230, endYear: -200, status: 'curated', note: '该时间窗口已完成秦统一至汉初主线的审校；无单独事件不代表没有历史活动。' },
  { id: 'han-three-kingdoms-core', scenarioId: HAN_THREE_KINGDOMS_SCENARIO_ID, startYear: -202, endYear: 280, status: 'curated', note: '该时间窗口已完成两汉至三国主线审校；无单独事件表示未单列，而非资料加载失败。' },
];
