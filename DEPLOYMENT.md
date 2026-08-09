# 部署手册

项目已按 Next.js 标准生产构建配置，可部署到 Vercel，也可运行在任何支持 Node.js 20 的服务器。

## Vercel（推荐）

1. 将 `D:\warMap` 提交到 GitHub、GitLab 或 Bitbucket 仓库；
2. 登录 Vercel，选择 **Add New → Project**；
3. 导入仓库；Vercel 会自动识别 Next.js；
4. 确认构建命令为 `npm run build`，安装命令为 `npm install`；
5. 发布后检查首页、时间轴、地图模式、事件详情和移动端；
6. 如有域名，在项目的 Domains 页面绑定并等待 HTTPS 生效。

当前项目不需要环境变量、地图密钥或数据库。

## 自有服务器

```powershell
npm install
npm run build
npm run start
```

默认监听 `http://localhost:3000`。公网部署时应使用 HTTPS 反向代理，并让进程管理器保持 Next.js 服务运行。

## 发布检查

- Node.js 版本为 20；
- `npm test` 全部通过；
- `npm run build` 成功；
- 桌面端与手机端可切换年份和地图图层；
- 云团图例和现代地理底图限制说明可见；
- 无来源、越界坐标或重复 ID 的事件不能发布。
