# 🌟 六零导航页 - LyLme Spage Nav (Palette 增强版)

> 基于 **LyLme Spage Nav**：https://github.com/LyLme/lylme_spage 与 **Palette**：https://github.com/litxiaoxi/LyLme-Spage-Palette 深度重构与二次开发的现代化高颜值无服务器导航起始页。  
> 纯前端静态 + 云端边缘函数架构，支持海量书签无感秒开、日夜模式无缝切换、多级子目录分类、以及 Cloudflare KV / D1 / GitHub Gist / GitHub 仓库 / WebDAV (坚果云) 全平台云端实时同步。  
> **🔐 全新升级：多云同步权限鉴权、多设备防覆盖双向增量合并、单账号数据沙箱物理隔离，多访客/多设备绝不串号、绝不丢数据！**

---

## 📑 目录

- [🌟 核心特色与亮点](#-核心特色与亮点)
- [🔐 账号权限与多云同步安全隔离（小白必读）](#-账号权限与多云同步安全隔离小白必读)
  - [1. 默认管理员账号与密码](#1-默认管理员账号与密码)
  - [2. 单账号数据隔离机制（一人一库，绝不串号）](#2-单账号数据隔离机制一人一库绝不串号)
  - [3. 多设备双向增量合并（防覆盖·防丢失）](#3-多设备双向增量合并防覆盖防丢失)
- [👥 多账户管理与后台控制中心 (Backend Admin Console)](#-多账户管理与后台控制中心-backend-admin-console)
  - [1. 注册新用户与沙箱分配](#1-注册新用户与沙箱分配)
  - [2. 用户角色权限与临时禁用](#2-用户角色权限与临时禁用)
  - [3. 管理员重置密码与用户自改密码](#3-管理员重置密码与用户自改密码)
  - [4. 全站多账户聚合统计与全量数据备份](#4-全站多账户聚合统计与全量数据备份)
- [🚀 多平台小白极速部署教程（零基础手把手）](#-多平台小白极速部署教程零基础手把手)
  - [【方案 A】Cloudflare Pages 零成本全球极速部署（最推荐）](#方案-acloudflare-pages-零成本全球极速部署最推荐)
  - [【方案 B】GitHub Pages 自动构建部署（免服务器）](#方案-bgithub-pages-自动构建部署免服务器)
  - [【方案 C】Vercel 极速一键部署](#方案-cvercel-极速一键部署)
  - [【方案 D】Netlify 部署](#方案-dnetlify-部署)
  - [【方案 E】自建 VPS / 宝塔面板 / Nginx 部署](#方案-e自建-vps--宝塔面板--nginx-部署)
- [☁️ Cloudflare Pages 边缘存储绑定（KV 与 D1）](#️-cloudflare-pages-边缘存储绑定kv-与-d1)
  - [1. 绑定 ONENAV_KV 键值存储（推荐，最省心）](#1-绑定-onenav_kv-键值存储推荐最省心)
  - [2. 绑定 ONENAV_D1 关系型数据库（结构化 SQL）](#2-绑定-onenav_d1-关系型数据库结构化-sql)
- [🔄 5大云同步后端小白配置实战](#-5大云同步后端小白配置实战)
  - [1. Cloudflare KV / D1 内置接口同步](#1-cloudflare-kv--d1-内置接口同步)
  - [2. 坚果云 / WebDAV 同步（国内网盘推荐）](#2-坚果云--webdav-同步国内网盘推荐)
  - [3. GitHub Gist 自动同步](#3-github-gist-自动同步)
  - [4. GitHub 独立代码仓库同步（版本回溯）](#4-github-独立代码仓库同步版本回溯)
  - [5. 浏览器 HTML 书签迁移与本地 JSON 导出](#5-浏览器-html-书签迁移与本地-json-导出)
- [⚙️ 环境变量配置表（自定义管理员账号与密码）](#️-环境变量配置表自定义管理员账号与密码)
- [📂 项目目录结构与文件功能详解](#-项目目录结构与文件功能详解)
- [🎨 壁纸中心与个性化视觉自定义](#-壁纸中心与个性化视觉自定义)
- [🔍 Logo / Favicon 自动获取与多级容灾机制](#-logo--favicon-自动获取与多级容灾机制)
- [⚡ 5万+ 海量书签虚拟窗口与首屏加载架构](#-5万-海量书签虚拟窗口与首屏加载架构)
- [🛠️ 常见开发与部署避坑指南 (FAQ)](#️-常见开发与部署避坑指南-faq)

---

## 🌟 核心特色与亮点

- **⚡ 零服务器成本与全球边缘加速**：纯静态前端，可免费部署在 Cloudflare Pages、GitHub Pages、Vercel、Netlify 等任意平台。
- **🔐 多云同步权限与多账号沙箱物理隔离**：
  - 同步功能与导出数据拥有统一的权限鉴权机制。
  - **一个账号只能读取和同步自个的数据，不能读取或篡改其他账号的数据**，支持多用户独立注册互不干扰。
- **🛡️ 多设备防覆盖与双向增量合并 (Two-Way Smart Merge)**：
  - 手机、平板、多台电脑同时添加书签，同步时按 URL 自动智能排重并集合并，新旧数据两端均安全保留，绝不发生覆盖丢失。
  - 内置云端版本冲突检测弹窗，多端时间戳不一致时支持用户自主选择【智能合并保留双方】或【强制覆盖云端】。
- **⏳ 优雅的首屏全局加载骨架屏 (GlobalLoading)**：
  - 首屏从 Cloudflare 边缘接口拉取配置期间显示丝滑的呼吸光晕与加载动效，杜绝白屏或布局抖动闪烁。
- **🌓 电影级昼夜模式切换**：集成现代浏览器 View Transitions API，提供柔和丝滑的明暗滤镜与色彩过度，支持移动端沉浸式顶栏 `theme-color` 同步。
- **🚀 10万级海量书签虚拟滚动 (Virtual Scrolling)**：当书签数量达到 500+ 或单个分组超过 60+ 项时，自动激活视口虚拟滚动 windowing 算法，仅渲染视口内可见卡片，突破 DOM 瓶颈，保持 60~120 FPS 极速流畅。
- **☁️ 5大主流云同步后端**：
  - **Cloudflare KV** 边缘键值缓存
  - **Cloudflare D1** 边缘 SQL 关系数据库
  - **坚果云 / WebDAV** 跨平台标准网盘协议
  - **GitHub Gist** 私有/公开代码片段存储
  - **GitHub 独立代码仓库**（自动 Git Commit 版本记录）
- **📂 HTML 浏览器书签全量与增量导入**：支持 Chrome、Edge、Firefox、Safari 导出的书签文件，提供增量合并与覆盖替换两种策略。
- **🔍 智能搜索矩阵**：多款主流搜索引擎（百度、Google、Bing、GitHub、bilibili 等）与本地书签秒级检索，支持快捷键 `Ctrl + K` / `Cmd + K`。
- **🖼️ 4K 高清壁纸中心**：Bing 每日高清壁纸、4K 精选图库、动态渐变、毛玻璃磨砂（Blur）与遮罩调节。

---

## 🔐 账号权限与多云同步安全隔离（小白必读）

### 1. 默认管理员账号与密码

多云同步功能与数据导出功能均受到安全防护，保障您的个人书签与隐私安全：

| 默认账号 | 默认密码 | 权限范围 | 自定义方式 |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`123456`** | 拥有完整的云端读取、推送同步与数据导出权限 | 在环境变量中设置 `VITE_SYNC_ADMIN_PASS` |

> 💡 **如何进入与认证**：
> 1. 打开导航页，点击右上角设置图标（齿轮）-> 点击 **【☁️ 多云同步】**。
> 2. 面板顶部可直观查看【当前同步账号】状态栏与认证徽章（`未验证凭证` 或 `已验证凭证`）。
> 3. 点击【切换 / 认证账号】按钮，输入账号 `admin` 和密码 `123456`，点击【验证并授权】即可解除锁定。
> 4. 点击【从云端拉取最新】或【测试云端连接 & 立即推送】时，系统也会自动引导认证。

---

### 2. 单账号数据隔离机制（一人一库，绝不串号）

为了彻底解决“不同人员在不同设备访问网站时，书签被其他人覆盖”的问题，系统实现了**多层物理隔离沙箱**：

1. **浏览器本地沙箱隔离**：
   - 账号 `admin` 的数据保存在本地 `lylme_spage_config_v2_admin`。
   - 账号 `zhangsan` 的数据保存在 `lylme_spage_config_v2_zhangsan`。
   - 任何访客使用自个的设备或账号访问，仅能读写自个的独立数据空间。
2. **云端与边缘数据库隔离**：
   - **Cloudflare KV / D1 / Edge API**：云端键自动加上账号后缀（例如 `cf_navs_config_admin`、`cf_navs_config_user1`），请求必须携带 `X-Auth-User` 与 `X-Auth-Pass` 鉴权头，**绝不允许读取其他账号的记录**。
   - **WebDAV（坚果云）**：自动保存为独立文件（如 `lylme_spage_admin.json`），同一网盘多人使用也不会互相撞车。
   - **GitHub Gist / 独立仓库**：以用户专属文件命名隔离，彼此独立独立版本。

---

### 3. 多设备双向增量合并（防覆盖·防丢失）

在以前的传统同步方式中，设备 B 从云端拉取配置会直接清空并覆盖本地未同步的内容。  
本项目研发了 **Smart Union 双向增量并集合并算法**：
- **手机添加了书签 A，电脑添加了书签 B**：两端点击同步时，系统会提取两端所有分类分组，以网址（URL）为唯一指纹进行智能去重合并，最终手机与电脑均完整拥有书签 A 与书签 B。
- **版本冲突保护 (ConflictResolutionModal)**：若云端已被其他设备修改过且存在版本差异，系统会弹出可视化冲突对比弹窗，您可以自主选择【智能合并（保留双方）】或【覆盖云端】。

---

## 👥 多账户管理与后台控制中心 (Backend Admin Console)

本项目内置了完整的**多账户注册、权限划分与后台综合管理系统**，无需部署复杂的第三方后台，即可在客户端完成全站人员与数据沙箱的管理：

### 1. 注册新用户与沙箱分配
- 管理员进入 **【设置】 -> 【👥 用户与后台】** 或点击顶栏右侧的账号胶囊按钮，点击 **【添加新用户】**。
- 支持设置独立账号名称、初始密码、角色权限（超级管理员 / 普通用户）以及备注说明。
- 支持选择 **【继承默认推荐书签】** 或 **【创建空白纯净空间】**，为新成员打造专属的起始页。

### 2. 用户角色权限与临时禁用
- **超级管理员 (Admin)**：可查看全站所有注册账户列表、统计汇总、重置任何用户密码、编辑角色及导出全站多账户备份。
- **普通用户 (User)**：拥有个人独立的沙箱环境，仅可修改自身密码与管理自己的书签，无权篡改他人数据。
- **临时禁用机制**：管理员可一键将指定账户标记为“临时禁用”，禁用后该账号将被限制登录与同步。

### 3. 管理员重置密码与用户自改密码
- **管理员重置密码**：当成员遗忘密码时，管理员在控制台找到对应用户，点击钥匙图标即可为其直接重置新密码。
- **个人修改密码**：任何已登录用户均可在控制台点击【修改当前密码】，通过验证原密码自主设定新密码。

### 4. 全站多账户聚合统计与全量数据备份
- **系统指标概览**：实时统计全站注册用户数（管理员/普通成员分布）、全站书签总数、分类总数以及总数据体积。
- **全站多账户一键备份**：管理员可一键导出包含全站所有注册账户注册表与各账户专属沙箱配置的 JSON 备份文件。
- **全站多账户一键恢复**：随时导入全站备份包，实现多账户数据的快速迁移与灾备恢复。

---

## 🚀 多平台小白极速部署教程（零基础手把手）

本项目打包配置已设为 `./` 相对路径，可以在任何根目录或二级子目录开箱即用！

---

### 【方案 A】Cloudflare Pages 零成本全球极速部署（最推荐）

> 优点：完全免费、全球 Anycast CDN 超快访问、自带免费 Functions 边缘函数和 KV/D1 数据库，最适合搭建私人导航页。

#### 第 1 步：准备 GitHub 代码
1. 登录你的 GitHub 账号，访问本项目仓库，点击右上角的 **Fork** 按钮，将代码复制一份到你自己的 GitHub 账号下。

#### 第 2 步：登录 Cloudflare 导入项目
1. 打开并注册/登录 [Cloudflare 控制台](https://dash.cloudflare.com/)。
2. 在左侧菜单点击 **Workers & Pages** -> **Create application**。
3. 选择 **Pages** 选项卡 -> 点击 **Connect to Git**（连接到 Git）。
4. 授权你的 GitHub 账号，并在列表中选择刚刚 Fork 的导航页仓库，点击 **Begin setup**（开始设置）。

#### 第 3 步：配置构建参数（照着填即可）
- **Project name（项目名称）**：保持默认或输入自定英文名（例如 `my-nav`）
- **Production branch（生产分支）**：`main`
- **Framework preset（框架预设）**：选择 `Vite`
- **Build command（构建命令）**：`npm run build`
- **Build output directory（输出目录）**：`dist`
- **Environment variables（环境变量，可选）**：
  - 如果想要修改管理员密码，可添加变量 `VITE_SYNC_ADMIN_PASS`，值为你的新密码。

#### 第 4 步：点击上线
点击页面最下方的 **Save and Deploy**（保存并部署），等待 1~2 分钟，Cloudflare 会分配给你一个免费的 `xxx.pages.dev` 二级域名，直接打开即可访问！

---

### 【方案 B】GitHub Pages 自动构建部署（免服务器）

项目已内置 `.github/workflows/deploy.yml` 自动化脚本，每次推送代码全自动构建上线！

1. 在 GitHub 上 Fork 本仓库。
2. 打开你 Fork 后的仓库页面，点击上方的 **Settings**（设置）标签。
3. 在左侧菜单找到 **Pages**。
4. 在 **Build and deployment** 下方的 **Source** 下拉框中，选择 **Deploy from a branch**。
5. 在 **Branch** 下拉框中选择 `gh-pages` 分支（如果暂时没有此分支，稍等自动 Actions 构建完毕或在 Actions 中手动运行一次 `Deploy to GitHub Pages` 工作流），文件夹保持 `/ (root)`，点击 **Save**。
6. 刷新页面即可看到你的专属网址：`https://你的用户名.github.io/仓库名/`！

---

### 【方案 C】Vercel 极速一键部署

1. 打开 [Vercel 官网](https://vercel.com/) 并使用 GitHub 账号登录。
2. 点击右上角 **Add New** -> **Project**。
3. 在 Import Git Repository 列表中找到你的导航仓库，点击 **Import**。
4. Framework Preset 会自动识别为 **Vite**，Build and Output Settings 均无需修改。
5. 点击 **Deploy** 按钮，等待数十秒即可完成部署！

---

### 【方案 D】Netlify 部署

1. 登录 [Netlify 官网](https://www.netlify.com/)。
2. 点击 **Add new site** -> **Import an existing project** -> 选择 **GitHub**。
3. 授权并选择导航仓库，构建命令填 `npm run build`，发布目录填 `dist`。
4. 点击 **Deploy Site** 即可获得专属站点链接。

---

### 【方案 E】自建 VPS / 宝塔面板 / Nginx 部署

如果你拥有自己的云服务器（如腾讯云、阿里云或国外 VPS）：

1. **本地安装依赖并编译生成静态文件**：
   ```bash
   npm install
   npm run build
   ```
   打包完成后，项目根目录下会生成一个 `dist` 文件夹。
2. **上传文件**：
   将 `dist` 文件夹里面的所有内容（`index.html`、`assets` 文件夹等）复制上传到你服务器的网站根目录（例如 `/www/wwwroot/nav.yourdomain.com`）。
3. **Nginx 配置文件参考**：
   ```nginx
   server {
       listen 80;
       server_name nav.yourdomain.com;
       root /www/wwwroot/nav.yourdomain.com;
       index index.html;

       # 支持单页应用路径路由
       location / {
           try_files $uri $uri/ /index.html;
       }

       # 开启 Gzip 加速网页加载
       gzip on;
       gzip_min_length 1k;
       gzip_types text/plain text/css application/javascript application/json image/svg+xml;
       gzip_vary on;
   }
   ```

---

## ☁️ Cloudflare Pages 边缘存储绑定（KV 与 D1）

部署在 Cloudflare Pages 上的用户，可以直接使用免费的 Functions 接口（代码位于 `/functions/api/`），无需第三方网盘即可自建全私有云同步！

---

### 1. 绑定 ONENAV_KV 键值存储（推荐，最省心）

#### 步骤 1：新建 KV 命名空间
1. 登录 Cloudflare 控制台，左侧菜单点击 **Storage & Databases** -> **KV**。
2. 点击 **Create a namespace**（创建命名空间）。
3. 名称输入 `ONENAV_KV`（或任意名称，如 `my_nav_kv`），点击 **Add**。

#### 步骤 2：在 Pages 中绑定变量
1. 在左侧菜单进入 **Workers & Pages**，点击你部署的 Pages 项目名称。
2. 依次点击 **Settings**（设置）-> **Functions**（函数）。
3. 向下滚动找到 **KV namespace bindings**（KV 命名空间绑定），点击 **Add binding**：
   - **Variable name（变量名称）**：必须输入 `ONENAV_KV`（或 `SPAGE_KV`）
   - **KV namespace（KV 命名空间）**：在下拉框中选择你刚刚创建的 KV 数据库
4. 点击 **Save**（保存）。

#### 步骤 3：重新部署生效
进入 Pages 项目的 **Deployments** 页面，找到最新一条记录，点击右侧三个点 `...` -> **Retry deployment**（重试部署）使变量绑定生效。

#### 步骤 4：在导航页启用
打开你的导航页，进入 **设置 -> 多云同步**：
- 方案选择 **Cloudflare KV**。
- 点击 **测试云端连接 & 立即推送**，即刻完成云端绑定！

---

### 2. 绑定 ONENAV_D1 关系型数据库（结构化 SQL）

如果你偏好真正的 SQL 数据库存储：

#### 步骤 1：创建 D1 数据库
1. 在 Cloudflare 控制台左侧进入 **Storage & Databases** -> **D1 SQL Database**。
2. 点击 **Create database**，名称输入 `ONENAV_D1`，点击 **Create**。

#### 步骤 2：创建数据表
进入该 D1 数据库管理页，点击 **Console**（控制台），粘贴并执行以下建表语句：
```sql
CREATE TABLE IF NOT EXISTS lylme_spage_sync (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at INTEGER
);
```

#### 步骤 3：在 Pages 中绑定 D1
1. 前往 Pages 项目 -> **Settings** -> **Functions**。
2. 找到 **D1 database bindings**，点击 **Add binding**：
   - **Variable name（变量名称）**：填入 `ONENAV_D1`（或 `SPAGE_D1` 或 `DB`）
   - **D1 database**：选择你创建的 D1 数据库
3. 点击 **Save** 并重新部署 Pages。
4. 在导航设置的 **多云同步** 中选择 **Cloudflare D1** 即可！

---

## 🔄 5大云同步后端小白配置实战

进入导航设置的 **【☁️ 多云同步】** 选项卡，支持以下多种方案：

### 1. Cloudflare KV / D1 内置接口同步
- **适用场景**：通过 Cloudflare Pages 部署的用户。
- **优点**：无需自己配置复杂的 Access Token，直接调用边缘函数，速度极快，多端通用。

---

### 2. 坚果云 / WebDAV 同步（国内网盘推荐）
- **适用场景**：国内手机、电脑多端同步，推荐坚果云（国内网络访问极速、免费容量足够存书签几十年）。
- **小白实操步骤**：
  1. 注册/登录 [坚果云官网](https://www.jianguoyun.com/)。
  2. 点击右上角账户名 -> **账户信息** -> 点击 **安全选项**。
  3. 找到 **第三方应用管理**，点击 **添加应用密码**。
  4. 应用名称填 `六零导航`，点击生成密码并**复制保存**（注意：坚果云 WebDAV 必须使用此专属密码，不能用网页登录密码！）。
  5. 回到导航页的【多云同步】，选择 **坚果云 / WebDAV**：
     - **WebDAV 服务器地址**：`https://dav.jianguoyun.com/dav/`
     - **账户邮箱**：你的坚果云注册邮箱
     - **应用密码**：步骤 4 生成的第三方应用密码
     - **同步文件名**：保持默认 `lylme_spage.json` 即可（系统会自动隔离不同账号）
  6. 点击【测试云端连接 & 立即推送】完成同步！

---

### 3. GitHub Gist 自动同步
- **适用场景**：免建仓库，跨平台轻量云存储。
- **小白实操步骤**：
  1. 打开 [GitHub Token 页面](https://github.com/settings/tokens/new?scopes=gist&description=LyLme_Spage_Sync)。
  2. 权限列表中勾选 `gist`，下拉到最下方点击 **Generate token**。
  3. 复制生成的以 `ghp_` 开头的 Token。
  4. 回到导航设置 -> 【多云同步】 -> 选择 **GitHub Gist**。
  5. 粘贴 Token，点击右侧的 **【自动创建并绑定新 Gist】** 按钮，系统全自动为您创建专属私有 Gist 并绑定！

---

### 4. GitHub 独立代码仓库同步（版本回溯）
- **适用场景**：希望用 Git 记录每一次书签变动、查看历史修改详情的极客用户。
- **小白实操步骤**：
  1. 在 GitHub 创建一个新的私人仓库（例如 `my-nav-bookmarks`，设为 Private）。
  2. 创建一个拥有 `repo` 权限的 GitHub Personal Access Token。
  3. 在导航设置中填入你的 GitHub 用户名、仓库名、分支 `main`、文件路径 `data/lylme_spage.json` 以及 Token。
  4. 每次同步时会自动在你的 GitHub 仓库中生成清晰的 Commit 记录。

---

### 5. 浏览器 HTML 书签迁移与本地 JSON 导出
- **从 Chrome / Edge / Firefox 导入**：
  - 浏览器按快捷键 `Ctrl + Shift + O` 打开书签管理器 -> 点击右上角导出书签为 HTML。
  - 在本导航设置的 **【数据管理】** 中点击上传书签文件，系统自动递归解析多级文件夹并生成对应导航分类与卡片。
  - 提供【增量智能去重合并】与【全量覆盖】两种安全策略。
- **导出数据备份（带权限校验）**：
  - 点击导出 JSON 或 HTML 文件时，系统同样会触发管理员安全验证（账号 `admin`，密码 `123456`），严密防止他人未经允许导出你的所有私人书签。

---

## ⚙️ 环境变量配置表（自定义管理员账号与密码）

如果你不想使用默认的账号 `admin` 或默认密码 `123456`，可以在部署平台的环境变量中自由指定：

| 环境变量名 | 默认值 | 作用说明 |
| :--- | :--- | :--- |
| `VITE_SYNC_ADMIN_USER` | `admin` | 多云同步的管理员账号名称 |
| `VITE_SYNC_ADMIN_PASS` | `123456` | 多云同步的管理员安全密码 |
| `VITE_EXPORT_ADMIN_USER` | `admin` | 数据导出备份的管理员账号名称 |
| `VITE_EXPORT_ADMIN_PASS` | `123456` | 数据导出备份的管理员安全密码 |

> 📌 **设置方法**：
> - **Cloudflare Pages**：进入 Pages 项目 -> **Settings** -> **Environment variables** -> **Add variables** 添加并重新部署。
> - **Vercel**：进入项目 -> **Settings** -> **Environment Variables** 添加并 Redeploy。
> - **本地开发**：复制根目录下的 `.env.example` 为 `.env`，修改对应键值即可。

---

## 📂 项目目录结构与文件功能详解

```
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 自动化工作流：推送到 main 自动构建并发布到 gh-pages
├── functions/                    # Cloudflare Pages Functions 边缘无服务器函数目录
│   └── api/
│       ├── kv.ts                 # Cloudflare KV 边缘读写接口（支持账号鉴权与隔离）
│       ├── d1.ts                 # Cloudflare D1 数据库初始化与 SQL 查询接口
│       └── sync.ts               # 通用边缘同步聚合代理（严格检查 X-Auth-User 与 X-Auth-Pass）
├── public/                       # 存放公共静态资源（favicon、内置预设壁纸等）
├── src/                          # 前端核心源码
│   ├── components/               # 核心 UI 组件
│   │   ├── ClockWidget.tsx       # 实时时钟与一言（Hitokoto）励志短句挂件
│   │   ├── Favicon.tsx           # 智能图标组件（内置 4 级容灾解析与首字母彩色徽标）
│   │   ├── FloatingActions.tsx   # 右下角悬浮操作组（日夜切换、壁纸、设置、回到顶部）
│   │   ├── GlobalLoading.tsx     # 全局首屏加载动画组件（防白屏与防布局抖动）
│   │   ├── LinkGrid.tsx          # 核心网格容器（分类、子目录、5万+ 虚拟滚动、拖拽排序）
│   │   ├── SearchBar.tsx         # 多引擎聚合搜索栏、热词推荐与本地秒级搜索
│   │   ├── SettingsPanel.tsx     # 个性化设置面板（主题、壁纸、多云同步账号、备份还原）
│   │   ├── SyncAuthModal.tsx     # 多云同步权限校验与多账号切换弹窗
│   │   ├── ExportAuthModal.tsx   # 数据备份导出密码鉴权弹窗
│   │   ├── ConflictResolutionModal.tsx # 多设备版本冲突解决与合并弹窗
│   │   └── WallpaperModal.tsx    # 4K 高清壁纸库弹窗
│   ├── lib/
│   │   ├── auth.ts               # 账号认证、密码哈希与多账号数据沙箱隔离算法
│   │   ├── exportAuth.ts         # 导出数据安全鉴权辅助函数
│   │   ├── storage.ts            # 本地存储、双向增量合并 (smartMerge) 与多云同步核心驱动
│   │   ├── favicon.ts            # 图标解析多层兜底逻辑
│   │   └── wallpapers.ts         # Bing 每日壁纸与精选高清壁纸配置
│   ├── types.ts                  # 全局 TypeScript 接口定义（AppConfig、NavGroup 等）
│   ├── App.tsx                   # 根组件：全局状态调度、版本号校验与多账号监听
│   └── main.tsx                  # 应用入口文件
├── index.html                    # 浏览器 HTML 入口
├── package.json                  # 项目依赖与构建脚本
└── vite.config.ts                # Vite 打包配置（相对路径 base: './'）
```

---

## 🎨 壁纸中心与个性化视觉自定义

### 1. 壁纸模式
- **Bing 每日 4K 高清壁纸**：每日自动同步微软必应壁纸，支持 UHD / 1080P 超高清。
- **精选分类高清壁纸**：风景自然、极简抽象、动漫游戏、城市建筑、暗夜星空。
- **自定义外链壁纸**：输入任意图片 URL，支持 Cover（铺满）、Contain（完整显示）、Repeat（平铺）。
- **轻量炫彩动态渐变**：无网络请求，超快加载。

### 2. 滤镜与视觉调节
- **毛玻璃模糊度（Blur）**：0px ~ 20px 自由滑动调节。
- **暗色遮罩浓度（Mask Opacity）**：0% ~ 90% 精确控制，确保前景文字在任何浅色壁纸下均清晰易读。
- **卡片圆角**：直角、微圆角、大圆角随心切换。

---

## 🔍 Logo / Favicon 自动获取与多级容灾机制

书签图标采用了多层智能容灾解析系统：

```
[用户自定义图标 / 本地上传 Base64] 
         ↓ (若未设置或加载失败)
[站点自身 /favicon.ico 自动嗅探] 
         ↓ (若跨域限制或返回 404)
[Google 高清 Favicon 官方代理 API] 
         ↓ (若国内网络不通或响应超时)
[Icon Horse / V2EX / MyHkw 高可用图标镜像] 
         ↓ (若全部不可用)
[根据网站标题首字母自动计算哈希并生成多彩渐变高质感徽标]
```

无论离线、内网还是各种极端网络环境，**绝不显示难看的浏览器破图小方块**！

---

## ⚡ 5万+ 海量书签虚拟窗口与首屏加载架构

1. **自动虚拟滚动 (Virtual Windowing)**：
   - 当单个分组书签数量 ≥ 60 项或总书签数 ≥ 500 项时，自动启用虚拟滚动算法，仅对视口内的可见卡片创建 DOM，其余以动态 Spacer 占位。
   - 即使拥有数万个书签，内存占用依然控制在几十兆之内，页面滚动丝滑稳定在 60~120 帧。
2. **首屏全局 Loading 状态**：
   - 初次打开页面拉取 Cloudflare 边缘配置时，展示带有渐变光晕与旋转加载器的 `GlobalLoading` 组件，避免由于网络延迟引起的瞬间空白。

---

## 🛠️ 常见开发与部署避坑指南 (FAQ)

### Q1: 第一次使用，提示“需要验证权限”，默认密码是多少？
- **回答**：默认管理员账号是 **`admin`**，默认密码是 **`123456`**。输入后点击“验证并授权”即可。如需自定义，可在环境变量中配置 `VITE_SYNC_ADMIN_PASS`。

### Q2: 为什么手机上配置了同步，电脑上同步后书签没有被覆盖？
- **回答**：这是本项目的**核心安全特色**！系统内置了双向增量并集合并（Smart Union），多设备新增的书签会自动排重汇合，绝不会互相覆盖导致丢数据。

### Q3: 怎么让别人也能用我的导航站，但又不看到我的私密书签？
- **回答**：在【多云同步】面板中点击【切换 / 认证账号】，输入一个新的账号名称（如 `family` 或 `guest`）并设置新密码，系统会自动为该账号开辟专属独立的本地存储与云端数据空间，真正实现**一人一库，互不干涉**。

### Q4: Cloudflare Pages 部署后提示 `ONENAV_KV binding not configured`？
- **回答**：虽然创建了 KV 数据库，但未在 Pages 项目的 **Settings** -> **Functions** -> **KV namespace bindings** 中添加名称为 `ONENAV_KV` 的绑定。添加绑定后，记得在 Deployments 页面点击 **Retry deployment**（重试部署）即可恢复正常。

### Q5: 坚果云 WebDAV 同步提示 401 认证失败？
- **回答**：坚果云必须使用**专属应用密码**，不能使用网页版登录密码。请前往坚果云官网：账户信息 -> 安全选项 -> 第三方应用管理 -> 添加应用密码。

---

## 📄 开源许可证与仓库

- **GitHub 仓库**：[zhixiaotx/lylme_spage_nav](https://github.com/zhixiaotx/lylme_spage_nav)
- **开源协议**：本项目采用 [MIT License](https://opensource.org/licenses/MIT) 开源。欢迎 Star、Fork 与提交 Issue / PR！

