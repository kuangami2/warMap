# 中国历史战争地图 · 秦统一至汉初

一个以时间轴和动态地图呈现中国历史战争的数字人文可视化项目。当前专题覆盖公元前 230 年至公元前 180 年，包含秦灭六国、秦帝国扩张、秦末起义、楚汉战争和汉初政权重组。

- 国际主站：https://war-map-sage.vercel.app
- 试验镜像：https://kuangami2.github.io/warMap/
- GitHub：https://github.com/kuangami2/warMap
- 当前技术栈：Next.js 16、React 18、TypeScript、Tailwind CSS、D3 Geo、TopoJSON、Vitest

## 当前功能

- 33 个结构化战争、战役、起义、边疆与政权重组事件；
- 公元前 230 年至公元前 180 年时间轴、播放/暂停、0.5/1/2/4 倍速与阶段跳转；
- 基于 Natural Earth 1:110m 数据的本地中国地理底图，不依赖地图 API Key；
- 战争云团、事件节点、行军路线和事件详情联动；
- 10 个关键事件的行军路线或多地点过程；
- 地图缩放、密集节点错位、按需标签、键盘操作和低动态模式；
- 桌面端和移动端响应式布局；
- 手机端首屏时间控制、粘性播放栏和可折叠地图图例；
- 微信、Android Chrome、iPhone WebKit 与桌面浏览器自动化矩阵；
- 事件年份、坐标、来源、重复 ID 和路线完整性自动测试。

> 地图底图用于现代地理定位参考，不代表秦汉时期的行政疆界。历史地点、路线和兵力存在争议时，项目应明确标注不确定性，不把推断包装为精确事实。

## 本地运行

推荐使用 Node.js 24。

```powershell
cd D:\warMap
npm install
npm run dev
```

浏览器访问 `http://localhost:3000`。

## 发布前验证

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser:local
npm audit
```

当前验证基线：lint 通过、类型检查通过、5/5 单元测试通过、6/6 浏览器环境通过、生产与静态导出构建通过、依赖安全审计为 0 个已知漏洞。

## 目录

- `app/`：页面入口和全局样式；
- `components/`：地图、时间轴、统计和详情组件；
- `data/`：历史阶段与战争事件数据；
- `lib/`：类型、筛选和时间轴工具；
- `tests/`：数据与业务逻辑测试；
- `artifacts/`：本地视觉回归截图，不参与 Vercel 上传；
- `DEPLOYMENT.md`：部署配置和发布说明；
- `USER_DEPLOYMENT_GUIDE.md`：面向项目所有者的完整操作手册；
- `PROJECT_MANUAL.md`：项目范围、开发轮次和长期问题清单。

## 部署状态

项目同时发布到 Vercel 和 GitHub Pages。Vercel 项目名为 `shining3/war-map`，并已连接 GitHub；推送 `main` 会更新国际主站。GitHub Pages 使用 `gh-pages` 静态分支作为无新增账号的试验镜像，可用 `npm run deploy:pages` 半自动更新。

GitHub Pages 已通过本机中国网络、香港与东京探测节点以及 Chromium/WebKit 浏览器矩阵，但不能保证所有中国大陆运营商均稳定可达，仍需用户所在网络最终验证。

详细步骤见 [USER_DEPLOYMENT_GUIDE.md](./USER_DEPLOYMENT_GUIDE.md)。
