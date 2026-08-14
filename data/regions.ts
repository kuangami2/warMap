export type MapRegion = {
  id: string;
  name: string;
  description: string;
  center: [number, number];
  scale: number;
};

export const mapRegions: MapRegion[] = [
  { id: 'guanzhong', name: '关中', description: '咸阳、长安与函谷关一线', center: [109.2, 34.5], scale: 2.1 },
  { id: 'zhongyuan', name: '中原', description: '荥阳、成皋与陈地一线', center: [113.5, 34.5], scale: 2.25 },
  { id: 'hebei', name: '河北', description: '邯郸、巨鹿与北方战场', center: [114.5, 37.2], scale: 2.1 },
  { id: 'qilu', name: '齐鲁', description: '临淄、定陶与山东战场', center: [117.3, 36.0], scale: 2.05 },
  { id: 'jianghuai', name: '江淮', description: '彭城、九江与楚地', center: [116.7, 33.0], scale: 2.05 },
  { id: 'bashu', name: '巴蜀', description: '成都、江州与汉中方向', center: [105.7, 31.4], scale: 1.9 },
  { id: 'lingnan', name: '岭南', description: '南征百越与岭南经营', center: [110.4, 24.0], scale: 1.8 },
  { id: 'hetao', name: '河套', description: '北方边防与河套方向', center: [108.2, 40.3], scale: 1.9 },
];
