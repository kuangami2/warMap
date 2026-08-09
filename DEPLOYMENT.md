# 部署说明

## 当前生产环境

- 平台：Vercel
- 团队：`shining3`
- 项目：`war-map`
- 生产地址：https://war-map-sage.vercel.app
- GitHub Pages 镜像：https://kuangami2.github.io/warMap/
- GitHub 仓库：https://github.com/kuangami2/warMap
- 框架：Next.js 16.3.0
- Node.js：24.x

项目不需要数据库、地图 API Key 或运行时环境变量。Natural Earth 地图数据和历史事件数据均随项目构建。

## Vercel：GitHub 自动部署

Vercel GitHub App 已连接仓库。后续推送到 `main` 会自动触发生产部署，其他分支或 Pull Request 会生成预览部署。

1. 登录 Vercel，打开 `shining3/war-map`。
2. 进入 **Settings → Git**。
3. 点击 **Connect Git Repository**，选择 `kuangami2/warMap`。
4. 如果列表中没有仓库，点击 GitHub 集成的 **Configure**，在 GitHub 中把仓库访问范围设为 **Only select repositories**，并勾选 `warMap`；也可以授权所有仓库，但不建议为本项目扩大权限。
5. 回到 Vercel 再次连接仓库。
6. Production Branch 选择 `main`，Framework Preset 保持 Next.js。
7. 不需要配置环境变量。保存后推送一个提交，确认自动部署成功。

## GitHub Pages 试验镜像

GitHub Pages 使用 `gh-pages` 分支发布静态导出。由于本机 GitHub 凭据不包含 `workflow` scope，项目采用半自动发布，避免要求账户所有者重新授权高权限 Token。

```powershell
cd D:\warMap
npm run deploy:pages
```

该命令会：

1. 使用 `/warMap` 基础路径生成静态站点到 `out/`；
2. 在系统临时目录创建独立 Git 仓库；
3. 强制更新专用的 `gh-pages` 生成分支；
4. 清理临时目录，不修改本地 `main` 工作区。

不要手工编辑 `gh-pages`，它是可重复生成的发布分支。GitHub Pages 镜像用于国内可达性试验，不承诺替代已备案的国内云和 CDN。

## 手动生产部署

GitHub 集成未完成时，可在项目目录执行：

```powershell
cd D:\warMap
npx --yes --registry=https://registry.npmmirror.com vercel@latest --prod --yes
```

`.vercel/project.json` 已把本地目录链接到现有的 `shining3/war-map` 项目；该文件包含项目标识但不含登录 Token，并已被 `.gitignore` 排除。

## 发布前检查

```powershell
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run build:static
npm run test:browser:local
npm audit
```

只有上述命令通过后再部署。发布后至少检查：

- 首页返回 HTTP 200；
- 地图轮廓、事件节点和时间轴正常显示；
- 播放、年份拖动、地图模式切换和事件详情可操作；
- 手机宽度下无关键控件被遮挡；
- 浏览器控制台没有资源 404 或运行时错误。

## Vercel 上传范围

`.vercelignore` 排除了 `.git`、`.next`、`node_modules`、npm 缓存、测试报告和本地截图，避免 CLI 把数百 MB 的本地生成文件上传。不要把 `app/`、`components/`、`data/`、`lib/`、`public/`、`package.json` 或 `package-lock.json` 加入忽略列表。

## 回滚

如果新版本有问题：

1. 在 Vercel 项目的 **Deployments** 页面找到上一个正常部署；
2. 打开该部署菜单，选择 **Promote to Production**；
3. 在本地修复问题并通过完整检查后，再重新部署；
4. 如果代码提交本身需要撤销，优先使用 `git revert <commit>` 生成可追踪的反向提交，不要强制重写远端 `main` 历史。

更完整的维护和故障排查见 `USER_DEPLOYMENT_GUIDE.md`。
