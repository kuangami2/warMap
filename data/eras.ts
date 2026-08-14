import type { Era } from '@/lib/types';
import { QIN_HAN_SCENARIO_ID } from './scenarios';

export const eras: Era[] = [
  { id: 'unification', scenarioId: QIN_HAN_SCENARIO_ID, name: '秦统一战争', startYear: -230, endYear: -221, description: '秦以连续军事行动结束战国割据。' },
  { id: 'empire', scenarioId: QIN_HAN_SCENARIO_ID, name: '帝国扩张', startYear: -220, endYear: -210, description: '统一后的边疆经营与军事扩张。' },
  { id: 'collapse', scenarioId: QIN_HAN_SCENARIO_ID, name: '秦末崩解', startYear: -209, endYear: -207, description: '起义和地方战争迅速冲垮帝国秩序。' },
  { id: 'chu-han', scenarioId: QIN_HAN_SCENARIO_ID, name: '楚汉相争', startYear: -206, endYear: -202, description: '项羽与刘邦争夺新秩序的主导权。' },
  { id: 'rebuild', scenarioId: QIN_HAN_SCENARIO_ID, name: '汉初定局', startYear: -201, endYear: -200, description: '新政权完成初步重组，并在北方边疆压力下确立谨慎的军事格局。' },
];
