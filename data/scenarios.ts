import type { TimelineScenario } from '@/lib/types';

export const QIN_HAN_SCENARIO_ID = 'qin-han';
export const HAN_THREE_KINGDOMS_SCENARIO_ID = 'han-three-kingdoms';

export const scenarios: TimelineScenario[] = [
  {
    id: QIN_HAN_SCENARIO_ID,
    name: '秦统一至汉初',
    startYear: -230,
    endYear: -200,
    description: '从秦灭六国到白登之围的战争、政权更替与边疆格局。',
  },
  {
    id: HAN_THREE_KINGDOMS_SCENARIO_ID,
    name: '两汉至三国',
    startYear: -202,
    endYear: 280,
    description: '从汉帝国建立、东汉兴衰到三国归晋的战争、政权更替与边疆格局。',
  },
];
