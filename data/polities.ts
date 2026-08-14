import type { Polity } from '@/lib/types';
import { QIN_HAN_SCENARIO_ID } from './scenarios';

const polity = (item: Omit<Polity, 'scenarioId'>): Polity => ({ scenarioId: QIN_HAN_SCENARIO_ID, ...item });

export const polities: Polity[] = [
  polity({ id: 'qin', name: '秦', shortName: '秦', color: '#d69e3f', labelColor: '#f8d98c', textColor: '#241708' }),
  polity({ id: 'han-state', name: '韩国', shortName: '韩', color: '#92a96f', labelColor: '#d9e8b8', textColor: '#111b0b' }),
  polity({ id: 'zhao', name: '赵国', shortName: '赵', color: '#739cb4', labelColor: '#c7e2ef', textColor: '#0d1820' }),
  polity({ id: 'wei', name: '魏国', shortName: '魏', color: '#b88c64', labelColor: '#ead0b3', textColor: '#21150d' }),
  polity({ id: 'chu', name: '楚', shortName: '楚', color: '#a96684', labelColor: '#efc5d7', textColor: '#210d16' }),
  polity({ id: 'yan', name: '燕国', shortName: '燕', color: '#708b91', labelColor: '#c7dcdf', textColor: '#0d1719' }),
  polity({ id: 'qi', name: '齐国', shortName: '齐', color: '#6d9b86', labelColor: '#c1e4d3', textColor: '#0d1a14' }),
  polity({ id: 'zhangchu', name: '张楚及反秦诸军', shortName: '反秦', color: '#c75656', labelColor: '#ffc4bd', textColor: '#240b0b' }),
  polity({ id: 'western-chu', name: '西楚', shortName: '楚', color: '#bd5d72', labelColor: '#ffd0da', textColor: '#260a12' }),
  polity({ id: 'han', name: '汉', shortName: '汉', color: '#557fb5', labelColor: '#c5dcff', textColor: '#091526' }),
  polity({ id: 'xiongnu', name: '匈奴', shortName: '匈奴', color: '#7a8263', labelColor: '#d8ddbc', textColor: '#13170c' }),
  polity({ id: 'nanyue', name: '南越', shortName: '南越', color: '#5d9884', labelColor: '#c3ebdd', textColor: '#0b1b15' }),
];
