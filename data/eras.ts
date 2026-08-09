import type { Era } from '@/lib/types';

export const eras: Era[] = [
  { id: 'unification', name: '秦统一战争', startYear: -230, endYear: -221, description: '秦以连续军事行动结束战国割据。' },
  { id: 'empire', name: '帝国扩张', startYear: -220, endYear: -210, description: '统一后的边疆经营与军事扩张。' },
  { id: 'collapse', name: '秦末崩解', startYear: -209, endYear: -207, description: '起义和地方战争迅速冲垮帝国秩序。' },
  { id: 'chu-han', name: '楚汉相争', startYear: -206, endYear: -202, description: '项羽与刘邦争夺新秩序的主导权。' },
  { id: 'rebuild', name: '汉初重建', startYear: -201, endYear: -180, description: '新政权重组诸侯关系，并处理边疆压力。' },
];
