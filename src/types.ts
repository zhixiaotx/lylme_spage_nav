/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';

export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  placeholder?: string;
  icon?: ReactNode | string;
  value?: string;
  group?: 'local' | 'general' | 'ai' | 'dev' | string;
  shortcut?: string;
}

export interface NavItem {
  id: string;
  name: string;
  url: string;
  icon?: string;
  description?: string;
  isPinned?: boolean;
}

export type IconSource =
  | 'favicon_im'
  | 'favicon_myhkw'
  | 'favicon_iowen'
  | 'favicon_baidu'
  | 'favicon_afmax'
  | 'favicon_la4'
  | 'favicon_vvhan'
  | 'favicon_xinac'
  | 'favicon_vip'
  | 'favicon_cravatar'
  | 'direct'
  | 'favicon_duckduckgo'
  | 'favicon_extractor'
  | 'favicon_pub'
  | 'google'
  | 'clearbit'
  | 'icons_duckduckgo'
  | 'iconhorse'
  | 'logo_surf'
  | 'iconify'
  | 'custom';

export interface BookmarkItem extends NavItem {
  title?: string;
  iconifyIcon?: string;
  customIcon?: string;
  isFolder?: boolean;
  children?: BookmarkItem[];
  deleted?: boolean;
}

export interface NavGroup {
  id: string;
  name: string;
  icon?: string;
  items: NavItem[];
  parentId?: string; // 父级分类ID (留空或未定义表示顶级分类，有值表示该分类的子分类)
  order?: number;
}

// Theme Presets: LyLme Original Themes + LyLme-Spage-Palette Themes
export type ThemePreset =
  // 1. 原项目 LyLme Spage Nav 官方原生主题 (Original Templates)
  | 'lylme-default'      // 六零官方原生默认主题 (default)
  | 'lylme-baisu'        // 白粟极简主题 (baisu)
  | 'lylme-baisuTwo'     // 白粟二代精简主题 (baisuTwo)
  | 'lylme-page'         // 个人主页/单页发布页主题 (page)
  // 2. LyLme-Spage-Palette 完整调色盘主题 (Palette Templates)
  | 'palette-glass'       // 极光磨砂 (Glass Aurora)
  | 'palette-cyber'       // 暗夜黑曜 (Cyber OLED)
  | 'palette-morandi'     // 莫兰迪调色盘 (Morandi)
  | 'palette-sunset'      // 日暮霞光 (Sunset Glow)
  | 'palette-emerald'     // 竹影微翠 (Emerald Forest)
  | 'palette-sakura'      // 浅樱和风 (Sakura Breeze)
  | 'palette-ocean'       // 星瀚深海 (Deep Ocean)
  | 'palette-retro'       // 复古暖杏 (Vintage Warmth)
  | 'palette-neon'        // 赛博霓虹 (Neon Synthwave)
  | 'palette-pure'        // 素雅纯白 (Pure White)
  | 'palette-classic';    // 经典微风 (兼容别名)

export type LayoutMode = 'grid' | 'tabs' | 'sidebar';

export type WallpaperSourceType =
  | 'preset'        // 主题预设背景
  | 'bing'          // 必应每日高清壁纸 (1080P)
  | 'bing_uhd'      // 必应 4K 超清壁纸 (UHD)
  | 'curated'       // 精选摄影壁纸库 (分类与画廊)
  | 'picsum'        // Picsum 艺术壁纸
  | 'custom'        // 自定义外链图片 URL
  | 'solid'         // 纯色背景
  | 'gradient';     // 现代渐变背景

export type WallpaperCategory =
  | 'nature'        // 自然风光
  | 'minimal'       // 极简抽象
  | 'anime'         // 动漫插画
  | 'cyberpunk'     // 赛博朋克
  | 'architecture'  // 建筑与都市
  | 'space'         // 星空宇宙
  | 'dark'          // 暗黑质感
  | 'all';

export interface ThemeConfig {
  preset: ThemePreset;
  background: string;
  customBackgroundUrl?: string;
  useBingWallpaper: boolean;
  bingResolution?: '1920' | 'UHD';
  
  // Enhanced wallpaper settings
  wallpaperType?: WallpaperSourceType;
  wallpaperCategory?: WallpaperCategory;
  wallpaperBlur?: number;          // 壁纸毛玻璃模糊度 (0 - 40px)
  wallpaperMaskOpacity?: number;   // 遮罩暗度浓度 (0 - 0.9)
  wallpaperFit?: 'cover' | 'contain' | 'repeat' | 'auto'; // 壁纸铺满模式
  wallpaperCustomUrl?: string;     // 自定义壁纸外链 URL
  wallpaperSolidColor?: string;    // 自定义纯色值
  wallpaperGradient?: string;      // 自定义渐变色 CSS
  wallpaperRandomKey?: number;     // 随机壁纸触发器

  opacity: number; // 0.1 to 1.0 (Card opacity)
  blur: number;    // 0 to 30px
  accentColor: string; // Hex or tailwind hue
  cardBorderRadius: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
  layoutMode: LayoutMode;
  showClock: boolean;
  showHitokoto: boolean;
  customHitokoto?: string;
  openInNewTab: boolean;
  iconSource?: IconSource;
  customCss?: string;
  isDarkMode?: boolean; // 白天 (false) 与 黑夜 (true) 模式快速切换
}

export type SyncProvider = 'none' | 'gist' | 'github_repo' | 'webdav' | 'cf_kv' | 'cf_d1' | 'custom_api';

export interface GistSyncConfig {
  token: string;
  gistId: string;
  filename?: string;
}

export interface GithubRepoSyncConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
  sha?: string;
}

export interface WebdavSyncConfig {
  url: string;
  username: string;
  password: string;
  filename?: string;
}

export interface CfKvSyncConfig {
  accountId: string;
  namespaceId: string;
  apiToken: string;
  keyName: string;
  workerProxyUrl?: string; // Optional custom worker proxy
}

export interface CfD1SyncConfig {
  accountId: string;
  databaseId: string;
  apiToken: string;
  tableName?: string;
  workerProxyUrl?: string; // Optional custom worker proxy
}

export interface CustomApiSyncConfig {
  url: string;
  method?: 'PUT' | 'POST';
  headerKey?: string;
  headerValue?: string;
}

export interface SyncConfig {
  provider: SyncProvider;
  autoSync: boolean;
  syncIntervalMinutes: number; // 0 = manual only, 1, 5, 15, 30
  gist: GistSyncConfig;
  githubRepo: GithubRepoSyncConfig;
  webdav: WebdavSyncConfig;
  cfKv: CfKvSyncConfig;
  cfD1: CfD1SyncConfig;
  customApi: CustomApiSyncConfig;
  lastSyncedAt?: number;
  lastStatus?: 'idle' | 'syncing' | 'success' | 'error';
  lastMessage?: string;
}

export interface AppConfig {
  version: string;
  title: string;
  subtitle: string;
  description: string;
  icp?: string; // 可选 ICP 备案号 (如: 京ICP备12345678号-1)
  searchEngines: SearchEngine[];
  groups: NavGroup[];
  theme: ThemeConfig;
  sync: SyncConfig;
  pinnedLinks?: NavItem[];
}
