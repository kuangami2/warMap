# 《中国历史战争地图》项目所有者操作手册

更新日期：2026-08-10  
本地目录：`D:\warMap`

## 1. 当前可用成果

| 项目 | 当前状态 |
|---|---|
| 公网网站 | https://war-map-sage.vercel.app 已上线 |
| GitHub 仓库 | https://github.com/kuangami2/warMap |
| Vercel 项目 | `shining3/war-map` |
| 技术栈 | Next.js 16.3.0、React 18.3.1、TypeScript、Tailwind CSS |
| 地图和数据 | 本地打包，无地图 API Key、数据库或运行时环境变量 |
| 数据量 | 33 个秦统一至汉初事件，10 个事件含路线或多地点过程 |
| 自动验证 | lint、类型检查、5 项测试、生产构建、安全审计 |
| 手动部署 | 已可用 |
| GitHub 自动部署 | 需要你完成一次网页端授权 |

## 2. Codex 已经完成的工作

1. 修复 Git 仓库历史，移除误提交的 `node_modules`、`.next`、npm 缓存和超大二进制文件。
2. 将 Git 跟踪文件从约 1.2 万个降至正常源码规模，消除超过 GitHub 100 MB 限制的文件。
3. 成功把初始代码推送到 `kuangami2/warMap` 的 `main` 分支。
4. 将项目升级到 Next.js 16.3.0，并补齐 ESLint、类型检查和生产构建配置。
5. 把 Vercel 部署运行时升级为 Node.js 24.x，避免 Node 20 在 2026-10-01 后被 Vercel 停止支持。
6. 升级 Vitest、Vite 相关链路和 PostCSS，安全审计从 5 个漏洞降至 0。
7. 新增 `.vercelignore`，避免把本地依赖、缓存、构建目录和截图上传到 Vercel。
8. 已将网站部署到现有 Vercel 项目并生成稳定 HTTPS 地址。
9. 更新 README、部署说明和本手册。

## 3. 你必须亲自完成的一项操作

### 授权 Vercel 访问 GitHub 仓库

原因：GitHub App 的仓库授权属于你的 GitHub 账户安全权限，命令行不能代替账户所有者确认授权范围。网站已经上线，这一步只影响“推送代码后自动部署”。

操作步骤：

1. 打开 https://vercel.com 并使用当前已登录账号进入团队 `shining3`。
2. 打开项目 `war-map`。
3. 进入 **Settings → Git**。
4. 点击 **Connect Git Repository**。
5. 如果能看到 `kuangami2/warMap`，直接选择并连接。
6. 如果看不到仓库，点击 GitHub 集成旁的 **Configure** 或 **Adjust GitHub App Permissions**。
7. GitHub 会打开 Vercel App 配置页。选择账号 `kuangami2`，将 Repository access 设为 **Only select repositories**，勾选 `warMap`，然后保存。
8. 返回 Vercel，再次选择 `kuangami2/warMap`。
9. 确认 Production Branch 为 `main`，不添加环境变量，完成连接。
10. 连接后，在 Vercel 的 Deployments 页面确认部署来源显示为 GitHub 提交，而不是 CLI。

授权完成后的行为：

- 推送 `main`：自动更新生产网站；
- 推送其他分支：生成独立预览网址；
- Pull Request：自动生成预览部署，合并后再更新生产站。

## 4. 建议你自行决定的事项

这些不是当前上线的阻塞项：

- 仓库是否公开：公开便于展示和协作，私有更适合尚未完成史料审核的阶段。
- 自定义域名：可以继续使用免费的 `vercel.app` 地址，也可以在 Vercel **Settings → Domains** 绑定自己的域名。
- 是否接入访问统计：接入前应先确定隐私说明；当前项目没有追踪代码。
- 历史内容审核人：在扩展三国、唐宋、明清专题前，最好建立史料审核和争议标注流程。

## 5. 日常本地开发

推荐安装 Node.js 24。检查版本：

```powershell
node --version
npm --version
```

启动项目：

```powershell
cd D:\warMap
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。停止开发服务器时，在终端按 `Ctrl+C`。

每次准备发布前运行：

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

只有五项都通过才应发布。当前电脑如果暂时仍是 Node 20，可用临时 Node 24 验证，但长期建议把系统 Node 更新到 24：

```powershell
npx --yes --package node@24 node --version
```

## 6. Git 日常工作流

查看改动：

```powershell
cd D:\warMap
git status
git diff
```

提交并推送：

```powershell
git add <本次修改的文件>
git commit -m "简短说明本次修改"
git push origin main
```

不要再次提交以下目录：

- `node_modules/`
- `.next/`
- `.npm-cache/`
- `.vercel/`
- `coverage/`
- `artifacts/`

它们已被忽略。不要使用 `git add -f` 强制加入这些目录。

多人协作时，建议从 `main` 创建功能分支并通过 Pull Request 合并，不要让多人直接修改 `main`。

## 7. 发布方式

### 自动发布（完成 GitHub 授权后推荐）

```powershell
git push origin main
```

然后打开 Vercel Deployments 页面观察构建。状态为 Ready 后访问 https://war-map-sage.vercel.app。

### 手动发布（自动集成未连接时）

```powershell
cd D:\warMap
npx --yes --registry=https://registry.npmmirror.com vercel@latest --prod --yes
```

命令结束时应显示 Production URL。不要创建新的 Vercel 项目，本地 `.vercel/project.json` 已指向 `shining3/war-map`。

## 8. 发布后验收清单

- 首页能正常打开，没有 404 或 500；
- 标题和主地图出现；
- 拖动时间轴时年份、节点、云团和统计同步变化；
- 播放/暂停和倍速按钮有效；
- 点击事件可以看到参与方、结果、影响、来源和可信度；
- 路线事件能显示行军线；
- 云团、节点和综合模式切换有效；
- 手机竖屏能滚动查看，详情面板不会永久遮住地图；
- 浏览器开发者工具 Console 没有红色运行时错误；
- Network 中没有关键脚本或地图资源 404。

## 9. 常见故障

### `git push` 提示无法连接 GitHub 443

这是网络到 GitHub 的临时连接问题，不代表仓库配置损坏。先确认网页能打开 GitHub，再重试：

```powershell
git push origin main
```

如果长期失败，检查代理、VPN、防火墙和 DNS。不要通过重建 Git 历史来解决网络超时。

### Vercel 看不到 GitHub 仓库

进入 GitHub 的 **Settings → Applications → Installed GitHub Apps → Vercel → Configure**，把 `warMap` 加入授权仓库，再回到 Vercel 连接。

### Vercel 提示 Node 版本不支持

确认 `package.json` 中为：

```json
"engines": { "node": "24.x" }
```

并确认 `.nvmrc` 内容为 `24`。随后重新部署。

### 本机 npm 安装很慢

可临时使用镜像安装：

```powershell
npm install --registry=https://registry.npmmirror.com
```

安全审计仍建议使用官方源：

```powershell
npm audit --registry=https://registry.npmjs.org
```

### 新部署出现问题

在 Vercel Deployments 页面把上一个正常部署 Promote to Production。代码层面使用 `git revert <commit>` 撤销问题提交，验证后再推送。不要对共享的 `main` 使用强制推送。

## 10. 数据和安全规则

- 不把 GitHub、Vercel Token、API Key 或密码写入源码、JSON、Markdown 或截图；
- 本项目当前不需要 `.env`；以后新增密钥时使用 Vercel Environment Variables 和本地 `.env.local`；
- 每条历史事件必须有来源和可信度；
- 不确定的兵力、伤亡、坐标或路线必须使用范围或说明，不能伪造精确数字；
- 现代国界和海岸线只用于定位，不得宣称为历史行政边界；
- 新增大体积 GeoJSON 前先压缩、简化并检查许可证；
- 单个文件接近 50 MB 时应先评估，绝不能把依赖目录或构建产物提交到 Git。

## 11. 下一阶段建议：三国战争地图

建议复用现有 `WarEvent` 数据模型，先建立独立专题或时间范围，再录入：黄巾起义、官渡之战、赤壁之战、夷陵之战、蜀汉灭亡。每个事件至少包含年份、地点、参与方、结果、影响、来源、可信度；路线型事件补充关键节点顺序。

扩展前优先解决：

1. 将专题和时间范围从当前秦汉数据中解耦；
2. 建立统一史料引用格式和审核状态；
3. 为大型事件数据做按专题加载，避免首屏数据持续增长；
4. 设计历史政权范围图层的数据格式，明确“推定范围”和时间粒度；
5. 增加端到端交互测试和基本性能预算；
6. 决定是否需要搜索、人物路线和跨专题比较功能。

## 12. 最简维护口诀

开发前拉取，修改后检查，发布前五项验证，推送后看 Vercel，线上异常先回滚，历史数据必须有来源。
