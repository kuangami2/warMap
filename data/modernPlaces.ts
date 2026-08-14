/*
 * 现代地名参考点（Modern reference cities）
 *
 * 来自 Natural Earth 1:50m Populated Places（公共领域，Public Domain）。这些
 * 是「现代」城市定位，仅用于帮助读者把历史地点对应到今天的位置（“今…一带”），
 * 不作为任何时期的行政边界渲染，也不进入行政 GIS 授权闸门。
 *
 * 覆盖说明：1:50m 子集只收录省会与主要地级市，缺少数个地级市（如洛阳、开封、
 * 咸阳）。这些缺漏由历史地点自身的 modernName 字段覆盖，不在此处补齐。
 */

export type ModernPlace = {
  id: string;
  nameZh: string;
  nameEn: string;
  longitude: number;
  latitude: number;
  /** Natural Earth scalerank；数值越小越重要（0=特大城市）。 */
  rank: number;
  /** Natural Earth pop_max。 */
  population: number;
};

export const naturalEarthPopulatedPlacesAsset = {
  id: 'natural-earth-50m-populated-places',
  source: 'Natural Earth 1:50m Populated Places',
  sourceUrl: 'https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-populated-places/',
  license: 'Public Domain',
  version: '5.1.2',
  coverage: '中国专题地图范围内（69°E–141°E / 14°N–56°N）的 1:50m 居民点，筛选省会与主要地级市',
  processingNote: '本地静态子集；无运行时网络请求。现代地名仅作地理定位参考，不代表任何时期行政边界。',
  geometry: 'point' as const,
};

export const modernReferencePlaces: ModernPlace[] = [
  { id: 'beijing', nameZh: '北京', nameEn: 'Beijing', longitude: 116.386, latitude: 39.931, rank: 0, population: 11106000 },
  { id: 'shanghai', nameZh: '上海', nameEn: 'Shanghai', longitude: 121.435, latitude: 31.218, rank: 0, population: 14987000 },
  { id: 'tianjin', nameZh: '天津', nameEn: 'Tianjin', longitude: 117.198, latitude: 39.132, rank: 2, population: 7180000 },
  { id: 'chongqing', nameZh: '重庆', nameEn: 'Chongqing', longitude: 106.593, latitude: 29.567, rank: 2, population: 6461000 },
  { id: 'chengdu', nameZh: '成都', nameEn: 'Chengdu', longitude: 104.068, latitude: 30.672, rank: 1, population: 4123000 },
  { id: 'xian', nameZh: '西安', nameEn: "Xi'an", longitude: 108.893, latitude: 34.277, rank: 2, population: 4009000 },
  { id: 'zhengzhou', nameZh: '郑州', nameEn: 'Zhengzhou', longitude: 113.663, latitude: 34.757, rank: 2, population: 2636000 },
  { id: 'jinan', nameZh: '济南', nameEn: 'Jinan', longitude: 116.993, latitude: 36.677, rank: 2, population: 2798000 },
  { id: 'taiyuan', nameZh: '太原', nameEn: 'Taiyuan', longitude: 112.543, latitude: 37.877, rank: 2, population: 2913000 },
  { id: 'shijiazhuang', nameZh: '石家庄', nameEn: 'Shijiazhuang', longitude: 114.478, latitude: 38.052, rank: 4, population: 2417000 },
  { id: 'handan', nameZh: '邯郸', nameEn: 'Handan', longitude: 114.478, latitude: 36.582, rank: 4, population: 1631000 },
  { id: 'xuzhou', nameZh: '徐州', nameEn: 'Xuzhou', longitude: 117.178, latitude: 34.282, rank: 4, population: 2091000 },
  { id: 'zibo', nameZh: '淄博', nameEn: 'Zibo', longitude: 118.048, latitude: 36.802, rank: 2, population: 3061000 },
  { id: 'linyi', nameZh: '临沂', nameEn: 'Linyi', longitude: 118.328, latitude: 35.082, rank: 4, population: 2082000 },
  { id: 'nanyang', nameZh: '南阳', nameEn: 'Nanyang', longitude: 112.528, latitude: 33.002, rank: 4, population: 1944000 },
  { id: 'hefei', nameZh: '合肥', nameEn: 'Hefei', longitude: 117.278, latitude: 31.852, rank: 4, population: 2035000 },
  { id: 'nanjing', nameZh: '南京', nameEn: 'Nanjing', longitude: 118.778, latitude: 32.052, rank: 2, population: 3679000 },
  { id: 'hangzhou', nameZh: '杭州', nameEn: 'Hangzhou', longitude: 120.168, latitude: 30.252, rank: 2, population: 3007000 },
  { id: 'suzhou', nameZh: '苏州', nameEn: 'Suzhou', longitude: 120.618, latitude: 31.302, rank: 4, population: 1650000 },
  { id: 'wuxi', nameZh: '无锡', nameEn: 'Wuxi', longitude: 120.298, latitude: 31.582, rank: 4, population: 1749000 },
  { id: 'ningbo', nameZh: '宁波', nameEn: 'Ningbo', longitude: 121.548, latitude: 29.882, rank: 4, population: 1923000 },
  { id: 'wenzhou', nameZh: '温州', nameEn: 'Wenzhou', longitude: 120.648, latitude: 28.022, rank: 4, population: 2350000 },
  { id: 'nanchang', nameZh: '南昌', nameEn: 'Nanchang', longitude: 115.878, latitude: 28.682, rank: 2, population: 2350000 },
  { id: 'changsha', nameZh: '长沙', nameEn: 'Changsha', longitude: 112.968, latitude: 28.202, rank: 2, population: 2604000 },
  { id: 'hengyang', nameZh: '衡阳', nameEn: 'Hengyang', longitude: 112.588, latitude: 26.882, rank: 4, population: 1016000 },
  { id: 'yueyang', nameZh: '岳阳', nameEn: 'Yueyang', longitude: 113.098, latitude: 29.382, rank: 4, population: 826000 },
  { id: 'wuhan', nameZh: '武汉', nameEn: 'Wuhan', longitude: 114.268, latitude: 30.582, rank: 2, population: 7243000 },
  { id: 'guangzhou', nameZh: '广州', nameEn: 'Guangzhou', longitude: 113.323, latitude: 23.147, rank: 2, population: 8829000 },
  { id: 'shenzhen', nameZh: '深圳', nameEn: 'Shenzhen', longitude: 114.120, latitude: 22.554, rank: 2, population: 7581000 },
  { id: 'fuzhou', nameZh: '福州', nameEn: 'Fuzhou', longitude: 119.298, latitude: 26.082, rank: 2, population: 2606000 },
  { id: 'xiamen', nameZh: '厦门', nameEn: 'Xiamen', longitude: 118.078, latitude: 24.452, rank: 4, population: 2519000 },
  { id: 'quanzhou', nameZh: '泉州', nameEn: 'Quanzhou', longitude: 118.578, latitude: 24.902, rank: 4, population: 1463000 },
  { id: 'nanning', nameZh: '南宁', nameEn: 'Nanning', longitude: 108.318, latitude: 22.822, rank: 2, population: 2167000 },
  { id: 'guilin', nameZh: '桂林', nameEn: 'Guilin', longitude: 110.278, latitude: 25.282, rank: 3, population: 987000 },
  { id: 'kunming', nameZh: '昆明', nameEn: 'Kunming', longitude: 102.678, latitude: 25.072, rank: 2, population: 2931000 },
  { id: 'guiyang', nameZh: '贵阳', nameEn: 'Guiyang', longitude: 106.718, latitude: 26.582, rank: 2, population: 3662000 },
  { id: 'lanzhou', nameZh: '兰州', nameEn: 'Lanzhou', longitude: 103.790, latitude: 36.058, rank: 2, population: 2561000 },
  { id: 'xining', nameZh: '西宁', nameEn: 'Xining', longitude: 101.768, latitude: 36.622, rank: 3, population: 1048000 },
  { id: 'yinchuan', nameZh: '银川', nameEn: 'Yinchuan', longitude: 106.271, latitude: 38.470, rank: 3, population: 991000 },
  { id: 'hohhot', nameZh: '呼和浩特', nameEn: 'Hohhot', longitude: 111.658, latitude: 40.822, rank: 4, population: 1726000 },
  { id: 'baotou', nameZh: '包头', nameEn: 'Baotou', longitude: 109.820, latitude: 40.654, rank: 2, population: 2036000 },
  { id: 'urumqi', nameZh: '乌鲁木齐', nameEn: 'Urumqi', longitude: 87.573, latitude: 43.807, rank: 1, population: 3575000 },
  { id: 'lhasa', nameZh: '拉萨', nameEn: 'Lhasa', longitude: 91.100, latitude: 29.645, rank: 3, population: 219599 },
  { id: 'shenyang', nameZh: '沈阳', nameEn: 'Shenyang', longitude: 123.448, latitude: 41.807, rank: 2, population: 4787000 },
  { id: 'harbin', nameZh: '哈尔滨', nameEn: 'Harbin', longitude: 126.648, latitude: 45.752, rank: 2, population: 3621000 },
  { id: 'changchun', nameZh: '长春', nameEn: 'Changchun', longitude: 125.338, latitude: 43.867, rank: 2, population: 3183000 },
  { id: 'qingdao', nameZh: '青岛', nameEn: 'Qingdao', longitude: 120.328, latitude: 36.092, rank: 4, population: 2866000 },
  { id: 'tianshui', nameZh: '天水', nameEn: 'Tianshui', longitude: 105.918, latitude: 34.602, rank: 4, population: 1225000 },
  { id: 'ankang', nameZh: '安康', nameEn: 'Ankang', longitude: 109.020, latitude: 32.680, rank: 4, population: 1100000 },
  { id: 'wuwei', nameZh: '武威', nameEn: 'Wuwei', longitude: 102.641, latitude: 37.928, rank: 4, population: 493092 },
  { id: 'zhangye', nameZh: '张掖', nameEn: 'Zhangye', longitude: 100.450, latitude: 38.930, rank: 4, population: 230728 },
  { id: 'dunhuang', nameZh: '敦煌', nameEn: 'Dunhuang', longitude: 94.662, latitude: 40.143, rank: 4, population: 140094 },
  { id: 'jiayuguan', nameZh: '嘉峪关', nameEn: 'Jiayuguan', longitude: 98.300, latitude: 39.820, rank: 3, population: 148279 },
  { id: 'houma', nameZh: '侯马', nameEn: 'Houma', longitude: 111.210, latitude: 35.620, rank: 4, population: 102400 },
];
