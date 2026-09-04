# 🌟 六零导航页 - LyLme Spage (Palette 增强版)

> 基于 **LyLme Spage** 与 **LyLme-Spage-Palette** 深度重构与二次开发的现代化高颜值无服务器导航起始页。  
> 纯前端静态 + 云端边缘函数架构，支持海量书签无感秒开、日夜模式无缝切换、多级子目录分类、以及 Cloudflare KV / D1 / GitHub Gist / GitHub 仓库 / WebDAV (坚果云) 全平台云端实时同步。

---

## 📑 目录

- [🌟 核心特色与亮点](#-核心特色与亮点)
- [📂 项目目录结构与文件功能详解](#-项目目录结构与文件功能详解)
- [🚀 多平台极速部署教程（小白零基础）](#-多平台极速部署教程小白零基础)
  - [1. GitHub Actions 自动构建部署到 GitHub Pages](#1-github-actions-自动构建部署到-github-pages)
  - [2. Cloudflare Pages 部署（推荐，支持 Functions 边缘存储）](#2-cloudflare-pages-部署推荐支持-functions-边缘存储)
  - [3. Vercel 极速部署](#3-vercel-极速部署)
  - [4. Netlify 部署](#4-netlify-部署)
  - [5. Nginx / Docker / 宝塔面板本地服务器部署](#5-nginx--docker--宝塔面板本地服务器部署)
- [☁️ Cloudflare Pages Functions 绑定配置（ONENAV_KV 与 ONENAV_D1）](#️-cloudflare-pages-functions-绑定配置onenav_kv-与-onenav_d1)
- [🔄 全平台多端数据同步小白配置指南](#-全平台多端数据同步小白配置指南)
  - [1. Cloudflare KV / D1 免费云端同步](#1-cloudflare-kv--d1-免费云端同步)
  - [2. GitHub Gist 云端自动同步](#2-github-gist-云端自动同步)
  - [3. GitHub 独立代码仓库同步](#3-github-独立代码仓库同步)
  - [4. 坚果云 / 自建 WebDAV 协议同步](#4-坚果云--自建-webdav-协议同步)
  - [5. 浏览器书签导入与 JSON 本地备份](#5-浏览器书签导入与-json-本地备份)
- [🎨 壁纸中心与个性化视觉自定义](#-壁纸中心与个性化视觉自定义)
- [🔍 Logo / Favicon 自动获取与多级容灾机制](#-logo--favicon-自动获取与多级容灾机制)
- [🌓 昼夜模式与移动端自适应设计](#-昼夜模式与移动端自适应设计)
- [⚡ 5万+ 海量书签虚拟分批懒加载架构](#-5万-海量书签虚拟分批懒加载架构)
- [🛠️ 常见开发与部署避坑指南 (FAQ)](#️-常见开发与部署避坑指南-faq)

---

## 🌟 核心特色与亮点

- **⚡ 零服务器成本**：纯静态前端，可部署在 GitHub Pages、Cloudflare Pages、Vercel、Netlify 等任意平台。
- **🌓 电影级昼夜模式切换**：集成现代浏览器 View Transitions API，提供柔和丝滑的明暗滤镜与色彩过度，支持移动端沉浸式顶栏 `theme-color` 同步。
- **🚀 10万级书签流畅渲染**：基于 `IntersectionObserver` 视口分批懒加载与 `React.memo` 浅记忆化，海量书签也能保持 60~120 FPS 丝滑滚动。
- **☁️ 5大云同步后端**：
  - **Cloudflare KV** 边缘键值缓存
  - **Cloudflare D1** 边缘 SQL 关系数据库
  - **GitHub Gist** 私有/公开代码片段存储
  - **GitHub 独立代码仓库**（自动 Git Commit 记录）
  - **WebDAV / 坚果云** 跨平台网盘协议
- **🔍 智能搜索矩阵**：集成多款主流搜索引擎（百度、Google、Bing、GitHub、bilibili 等）与本地书签秒级检索，支持快捷键 `Ctrl + K` / `Cmd + K`。
- **🖼️ 4K 高清壁纸中心**：Bing 每日高清壁纸、4K 精选图库、动态渐变、毛玻璃磨砂（Blur）与遮罩调节。
- **🏷️ 多级分类与子目录树**：无限层级父子分类结构，支持折叠展开、分类标签筛选与批量拖拽管理。

---

## 📂 项目目录结构与文件功能详解

为了让初学者更直观地理解整个工程的设计逻辑，下表详细列出了项目中每个核心文件与目录的作用：

```
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 自动化工作流：每次 push 自动构建并推送到 gh-pages 分支
├── functions/                    # Cloudflare Pages Functions 边缘无服务器函数目录
│   └── api/
│       ├── kv.ts                 # 负责接收前端请求并读写 Cloudflare KV 命名空间中的书签配置
│       ├── d1.ts                 # 负责执行 Cloudflare D1 边缘 SQLite 数据库的初始化、查询与写入
│       └── sync.ts               # 通用边缘同步聚合代理接口
├── public/                       # 存放公共静态资源（favicon、内置预设壁纸、静态图标等）
├── src/                          # 前端核心源码
│   ├── components/               # React 独立 UI 组件库
│   │   ├── ClockWidget.tsx       # 实时时钟与一言（Hitokoto）励志文案展示挂件
│   │   ├── Favicon.tsx           # 智能图标获取组件（内置多级容灾与首字母徽标生成）
│   │   ├── FloatingActions.tsx   # 右下角悬浮快捷按钮组（日夜切换、壁纸中心、系统设置、回到顶部）
│   │   ├── LinkGrid.tsx          # 书签核心网格容器（包含分类展示、多级目录树、分批懒加载与增删改查）
│   │   ├── SearchBar.tsx         # 多引擎聚合搜索栏、联想词下拉提示与本地书签快速跳转
│   │   ├── SettingsPanel.tsx     # 系统个性化设置面板（主题选择、壁纸配置、多云同步管理、备份还原等）
│   │   └── WallpaperModal.tsx    # 4K 壁纸中心弹窗（Bing 今日壁纸、分类精选大图、渐变预设预览）
│   ├── data/
│   │   ├── defaultBookmarks.ts   # 开箱即用的默认导航分类与精选书签数据
│   │   └── presets.ts            # 主题配色预设、4K 壁纸库与搜索引擎配置数据
│   ├── utils/
│   │   ├── favicon.ts            # 图标解析多级兜底逻辑工具函数
│   │   ├── htmlBookmarkParser.ts # 浏览器导出的 HTML 书签文件解析引擎（支持 Chrome/Edge/Firefox/Safari）
│   │   └── sync.ts               # 云端同步核心驱动（包含 KV、D1、Gist、GitHub Repo、WebDAV 同步协议实现）
│   ├── types.ts                  # 全局 TypeScript 数据结构与接口定义（AppConfig、NavGroup、NavItem 等）
│   ├── App.tsx                   # 应用根组件：统筹全局配置、数据加载、快捷键监听与日夜主题调度
│   ├── main.tsx                  # React 18 应用挂载入口
│   └── index.css                 # 全局样式文件（Tailwind CSS 导入、View Transition 动画与自定义滚动条）
├── .env.example                  # 环境变量示例文件
├── index.html                    # 浏览器 HTML 入口文件（含 SEO Meta 标签与视口设置）
├── metadata.json                 # 应用元数据与平台声明文件
├── package.json                  # Node.js 依赖清单与构建脚本命令
├── tsconfig.json                 # TypeScript 编译规则配置
└── vite.config.ts                # Vite 打包构建配置文件（配置相对路径 `./` 与开发环境模拟 API）
```

---

## 🚀 多平台极速部署教程（小白零基础）

本项目已在 `vite.config.ts` 中配置了 `base: './'` 相对路径，打包生成的 `dist/` 文件夹可以在任意路径或子目录中完美运行！

### 1. GitHub Actions 自动构建部署到 GitHub Pages

项目已内置 `.github/workflows/deploy.yml` 自动化脚本。

1. **Fork 或推送代码到你的 GitHub 仓库**。
2. 打开仓库页面的 **Settings** -> **Pages**。
3. 在 **Build and deployment** 下方的 **Source** 选择 **Deploy from a branch**。
4. Branch 选择 `gh-pages` 分支，文件夹选择 `/ (root)`，点击 **Save**。
5. 之后你每次向 `main` 分支提交代码，GitHub 会自动运行构建，并将最新静态文件推送至 `gh-pages` 分支完成上线！

---

### 2. Cloudflare Pages 部署（推荐，支持 Functions 边缘存储）

Cloudflare Pages 提供全球顶级 Anycast CDN 加速，并且免费支持 Functions 边缘函数，可直接使用内置的 KV / D1 云同步。

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Workers & Pages** -> **Create application** -> 选择 **Pages** -> **Connect to Git**。
3. 选择你的导航项目仓库，设置构建参数：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 点击 **Save and Deploy**，几秒钟即可完成全球上线！

---

### 3. Vercel 极速部署

1. 登录 [Vercel](https://vercel.com/)，点击 **Add New** -> **Project**。
2. 导入你的 GitHub 仓库。
3. Framework Preset 会自动识别为 **Vite**，直接点击 **Deploy** 即可一键部署。

---

### 4. Netlify 部署

1. 登录 [Netlify](https://www.netlify.com/)，点击 **Add new site** -> **Import an existing project**。
2. 连接 GitHub 仓库，设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. 点击 **Deploy Site** 即可生成专属域名。

---

### 5. Nginx / Docker / 宝塔面板本地服务器部署

如果你有自己的 VPS 云服务器：

1. 本地执行打包命令：
   ```bash
   npm install
   npm run build
   ```
2. 将生成的 `dist` 文件夹内的所有文件上传至 Web 服务器的根目录（例如 `/var/www/nav`）。
3. Nginx 示例配置：
   ```nginx
   server {
       listen 80;
       server_name nav.yourdomain.com;
       root /var/www/nav;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # 开启 gzip 压缩加速静态资源传输
       gzip on;
       gzip_types text/plain text/css application/javascript application/json image/svg+xml;
   }
   ```

---

## ☁️ Cloudflare Pages Functions 绑定配置（ONENAV_KV 与 ONENAV_D1）

如果你使用 Cloudflare Pages，可以通过内置的 Functions API 实现真正的**无服务器自建云端同步**！

### 绑定 ONENAV_KV 键值存储（推荐，配置最简便）

1. 在 Cloudflare 控制台左侧进入 **Storage & Databases** -> **KV**。
2. 点击 **Create a namespace**，名称输入 `ONENAV_KV`（或任意名称，例如 `my_nav_kv`），点击 **Add**。
3. 进入你刚刚部署的 **Cloudflare Pages 项目** -> **Settings** -> **Functions**。
4. 向下滚动到 **KV namespace bindings**（KV 命名空间绑定），点击 **Add binding**：
   - **Variable name（变量名称）**：填入 `ONENAV_KV`（也可以填 `SPAGE_KV`，二者系统均支持识别）。
   - **KV namespace（KV 命名空间）**：选择你在步骤 2 中创建的 KV 数据库。
5. 点击 **Save** 保存。
6. 回到 Pages 的 **Deployments** 页面，重新触发一次部署（Retry deployment）使绑定生效。
7. 在你的导航页打开 **系统设置 -> 多云同步**：
   - 同步类型选择 **Cloudflare Pages (KV / D1 内置接口)**。
   - 存储协议选择 **Cloudflare KV**。
   - 自定义存储 Key 保持默认 `lylme_spage_config` 即可。
   - 点击 **测试并立即上传**，即可实现毫秒级云同步！

---

### 绑定 ONENAV_D1 关系型数据库（进阶，SQL 结构化存储）

1. 在 Cloudflare 控制台左侧进入 **Storage & Databases** -> **D1 SQL Database**。
2. 点击 **Create database**，数据库名称输入 `ONENAV_D1`，点击 **Create**。
3. 进入创建好的 D1 数据库，点击 **Console**（控制台），执行以下初始化 SQL 语句建表：
   ```sql
   CREATE TABLE IF NOT EXISTS lylme_spage_sync (
       key TEXT PRIMARY KEY,
       value TEXT,
       updated_at INTEGER
   );
   ```
4. 进入你的 **Cloudflare Pages 项目** -> **Settings** -> **Functions**。
5. 向下滚动到 **D1 database bindings**（D1 数据库绑定），点击 **Add binding**：
   - **Variable name（变量名称）**：填入 `ONENAV_D1`（也可以填 `SPAGE_D1` 或 `DB`）。
   - **D1 database（D1 数据库）**：选择你在步骤 2 中创建的 D1 数据库。
6. 点击 **Save** 并重新部署 Pages。
7. 在导航页设置的 **多云同步** 中选择 **Cloudflare D1 数据库**，即可体验 SQL 云端存储！

---

## 🔄 全平台多端数据同步小白配置指南

在导航首页点击右上角设置图标（或右下角齿轮悬浮按钮），在左侧菜单切换到 **☁️ 多云同步**，支持以下 5 大主流存储模式：

### 1. Cloudflare KV / D1 免费云端同步
- 适用对象：部署在 Cloudflare Pages 的用户。
- 优点：无需暴露个人 Token，全私有鉴权，速度快，免费额度充裕。

### 2. GitHub Gist 云端自动同步
- 适用对象：任何平台部署的用户。
- 操作步骤：
  1. 打开 [GitHub Personal Access Tokens](https://github.com/settings/tokens)（Classic 或 Fine-grained）。
  2. 生成一个包含 `gist` 权限的 Token。
  3. 在导航设置中填入生成的 **GitHub Token**。
  4. 如果已有 Gist，可以填入对应的 **Gist ID**；如果是首次配置，点击“自动创建新 Gist”即可一键生成！
  5. 可以在其他电脑、手机或平板上填入相同的 Token 与 Gist ID，点击“从云端下载拉取”，跨设备秒级同步。

### 3. GitHub 独立代码仓库同步
- 适用对象：希望用 Git 管理所有版本历史的用户。
- 操作步骤：
  1. 在 GitHub 创建一个专用私有仓库（例如 `my-nav-data`）。
  2. 生成一个拥有 `repo`（或 `Contents: Read and write`）权限的 GitHub Personal Access Token。
  3. 在导航设置中填入：
     - **仓库所有者**（GitHub 用户名）
     - **仓库名称**（如 `my-nav-data`）
     - **目标分支**（默认 `main`）
     - **存储文件路径**（默认 `data/nav-config.json`）
     - **GitHub Token**
  4. 每次上传会自动生成规范的 Git Commit 记录，历史版本一清二楚。

### 4. 坚果云 / 自建 WebDAV 协议同步
- 适用对象：国内坚果云用户、群晖 NAS、Nextcloud 或自建 WebDAV 用户。
- 坚果云小白步骤：
  1. 登录坚果云网页版 -> **账户信息** -> **安全选项** -> **第三方应用管理**。
  2. 点击 **添加应用密码**，名称输入 `六零导航页`，生成一个专属授权密码。
  3. 导航设置中填入：
     - **WebDAV 服务器地址**：`https://dav.jianguoyun.com/dav/`
     - **账户邮箱**：你的坚果云注册邮箱
     - **应用密码**：步骤 2 中生成的第三方应用密码
     - **文件路径**：`六零导航/config.json`
  4. 点击“测试并立即上传”即可将配置安全托管在坚果云网盘中！

### 5. 浏览器书签导入与 JSON 本地备份
- **浏览器书签一键迁移**：支持解析从 Chrome、Edge、Firefox、Safari 等浏览器导出的 `bookmarks.html` 文件，自动递归提取文件夹层级并转换为导航分组与书签。
- **全量配置导出 / 导入**：支持一键导出包含全部主题设置、壁纸偏好、自定义分类与网址的 `.json` 配置文件。

---

## 🎨 壁纸中心与个性化视觉自定义

### 1. 壁纸库模式
- **Bing 每日高清壁纸**：自动对接微软必应每日 4K 壁纸接口，每天自动更换不重样。
- **4K 精选高清图库**：内置多款精心挑选的高分辨率风景、赛博朋克、极简抽象、动漫与星空大图。
- **自定义外链壁纸**：支持输入任意第三方图片 URL，支持平铺（Cover）、拉伸、居中与平铺重复（Repeat）。
- **动态炫彩渐变**：无需加载大图，轻量纯 CSS 渐变色调。

### 2. 滤镜与视觉调节
- **背景模糊度（Blur）**：0px ~ 20px 自由滑动调节毛玻璃模糊强度。
- **暗色遮罩浓度（Mask Opacity）**：0% ~ 90% 自由控制，确保壁纸再鲜艳也不影响前景文字与图标的清晰阅读。
- **卡片圆角与间距**：支持圆润（Rounded）、小圆角（MD）与极简直角。
- **自定义 CSS 注入**：支持在高级设置中直接书写专属 CSS 样式表，实时生效并随云端同步。

---

## 🔍 Logo / Favicon 自动获取与多级容灾机制

书签图标采用了多层智能容灾解析系统（位于 `src/components/Favicon.tsx` 与 `src/utils/favicon.ts`）：

```
[用户自定义外链图标 / Base64] 
         ↓ (若未设置或加载失败)
[站点自身 /favicon.ico 探测] 
         ↓ (若跨域或 404)
[Google 高清 Favicon 代理 API] 
         ↓ (若网络超时或不可达)
[Icon Horse / V2EX 优质图标镜像] 
         ↓ (若全部不可用)
[根据网站标题首字母生成多彩渐变高质感徽标]
```

这确保了无论处于何种网络环境，卡片图标永远美观完整，绝对不会出现恼人的破图小图标。

---

## 🌓 昼夜模式与移动端自适应设计

- **昼夜切换**：
  - 支持点击右下角悬浮太阳/月亮按钮，或在设置面板中切换。
  - 集成了现代浏览器的 `document.startViewTransition` 接口，切换过程伴随平滑的淡入淡出与色彩过度，彻底告别突兀闪烁。
  - 自动更新移动端浏览器标签栏 `<meta name="theme-color">`（白天模式 `#f8fafc`，夜间模式 `#0b0f19`）。
- **移动端全场景适配**：
  - 右下角悬浮操作按钮组自带 `env(safe-area-inset-bottom)` 安全区沉浸避让。
  - 按钮热区尺寸严格遵循无障碍与触控标准（≥44px）。
  - 搜索引擎标签栏支持弹性横向滚动，避免屏幕窄时文字挤压折行。

---

## ⚡ 5万+ 海量书签虚拟分批懒加载架构

为了支持拥有数万级庞大书签库的高级用户，`LinkGrid.tsx` 采用了优化的渲染流水线：

1. **按需分批进入 DOM**：默认仅渲染当前视口所需的前 60 项卡片，当下滑接近底部时由 `IntersectionObserver` 自动无缝载入后续分批。
2. **组内实时快速检索**：针对包含大量网址的分类，自动提供组内即时筛选框，无需全局重搜即可过滤。
3. **React.memo 浅记忆化**：对 `NavCard` 与 `QuickPinnedCard` 进行了组件级记忆化隔离，数据更新时只重绘变更卡片。
4. **图标异步非阻塞解码**：所有图标图片均开启 `decoding="async"` 与 `loading="lazy"`，确保页面滚动帧率稳定在 60~120 FPS。

---

## 🛠️ 常见开发与部署避坑指南 (FAQ)

### Q1: 部署到 GitHub Pages 后页面打开一片空白或资源 404？
- **原因**：Vite 默认的 `base` 是绝对根路径 `/`，当你的 GitHub 仓库地址为 `https://username.github.io/repo-name/` 时，资源请求会找不到对应文件。
- **解决方案**：本项目已在 `vite.config.ts` 中将 `base` 设为 `'./'`（相对路径），开箱即用支持所有二级子目录。

### Q2: 坚果云 WebDAV 同步提示“401 Unauthorized”或“认证失败”？
- **原因**：坚果云出于安全策略，WebDAV 不允许使用网页登录密码，必须使用专属的**应用密码**。
- **解决方案**：登录坚果云网页版 -> 账户信息 -> 安全选项 -> 第三方应用管理 -> 添加应用密码，将生成的密码填入即可。

### Q3: GitHub Gist 同步时提示 404 或无权限？
- **原因**：生成的 GitHub Token 未勾选 `gist` 权限，或者填错了 Gist ID。
- **解决方案**：重新生成一个带有 `gist` 勾选的 Personal Access Token。首次使用时可以不填 Gist ID，点击面板中的“自动创建 Gist”按钮。

### Q4: Cloudflare Pages 提示 `ONENAV_KV / SPAGE_KV binding not configured`？
- **原因**：虽然创建了 KV，但尚未在 Pages 项目设置的 **Functions** 页面中将变量名称与创建的 KV 数据库进行绑定。
- **解决方案**：前往 Pages 项目 -> **Settings** -> **Functions** -> **KV namespace bindings**，添加变量名 `ONENAV_KV` 并绑定你的 KV 数据库，然后点击 **Retry deployment**。

---

## 📄 开源许可证

本项目采用 [MIT License](https://opensource.org/licenses/MIT) 开源。欢迎 Star、Fork 与提交 Pull Request！
