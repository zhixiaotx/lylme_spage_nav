/**
 * Wallpaper Library & Management Engine
 * 
 * Provides:
 * - Bing Daily Wallpaper (1080P / UHD 4K)
 * - Curated Categories (Nature, Minimalist, Anime/Illustration, Cyberpunk, Architecture, Space, Dark)
 * - Random Wallpaper Switcher
 * - Custom URL Wallpaper
 * - Modern Gradients & Solid Palettes
 * - Blur & Mask Darkness Adjusters
 */

import { WallpaperCategory, WallpaperSourceType } from '../types';

export interface WallpaperItem {
  id: string;
  name: string;
  category: WallpaperCategory | 'bing' | 'gradient' | 'solid';
  thumbUrl: string;
  fullUrl: string;
  author?: string;
}

export const WALLPAPER_CATEGORIES: { id: WallpaperCategory | 'all'; name: string; iconName?: string }[] = [
  { id: 'all', name: '全部壁纸' },
  { id: 'nature', name: '自然风光' },
  { id: 'minimal', name: '极简抽象' },
  { id: 'anime', name: '动漫插画' },
  { id: 'cyberpunk', name: '赛博朋克' },
  { id: 'architecture', name: '建筑与都市' },
  { id: 'space', name: '星空宇宙' },
  { id: 'dark', name: '暗黑质感' },
];

export const CURATED_WALLPAPERS: WallpaperItem[] = [
  // 1. 自然风光
  {
    id: 'nature-1',
    name: '热带海滩晨曦',
    category: 'nature',
    thumbUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'nature-2',
    name: '阿尔卑斯雪山倒影',
    category: 'nature',
    thumbUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'nature-3',
    name: '晨雾松林绿野',
    category: 'nature',
    thumbUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'nature-4',
    name: '极光旷野极夜',
    category: 'nature',
    thumbUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2560&q=85',
  },

  // 2. 极简抽象
  {
    id: 'minimal-1',
    name: '流体柔彩光泽',
    category: 'minimal',
    thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'minimal-2',
    name: '极简沙漠沙丘曲面',
    category: 'minimal',
    thumbUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'minimal-3',
    name: '立体曲面微光',
    category: 'minimal',
    thumbUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=2560&q=85',
  },

  // 3. 动漫插画
  {
    id: 'anime-1',
    name: '新海诚风天空云海',
    category: 'anime',
    thumbUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'anime-2',
    name: '和风落樱古街',
    category: 'anime',
    thumbUrl: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'anime-3',
    name: '梦幻紫暮星河',
    category: 'anime',
    thumbUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2560&q=85',
  },

  // 4. 赛博朋克
  {
    id: 'cyber-1',
    name: '雨夜东京霓虹',
    category: 'cyberpunk',
    thumbUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'cyber-2',
    name: '重庆洪崖洞夜色',
    category: 'cyberpunk',
    thumbUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'cyber-3',
    name: '未来矩阵暗紫',
    category: 'cyberpunk',
    thumbUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=2560&q=85',
  },

  // 5. 建筑与都市
  {
    id: 'arch-1',
    name: '曼哈顿天际线晨光',
    category: 'architecture',
    thumbUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'arch-2',
    name: '现代极简螺旋楼梯',
    category: 'architecture',
    thumbUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2560&q=85',
  },

  // 6. 星空宇宙
  {
    id: 'space-1',
    name: '银河深空星云',
    category: 'space',
    thumbUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'space-2',
    name: '月球地平线与地球',
    category: 'space',
    thumbUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2560&q=85',
  },

  // 7. 暗黑质感
  {
    id: 'dark-1',
    name: '黑曜石波浪纹理',
    category: 'dark',
    thumbUrl: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=2560&q=85',
  },
  {
    id: 'dark-2',
    name: '暗夜几何磨砂金',
    category: 'dark',
    thumbUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=75',
    fullUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2560&q=85',
  },
];

export const GRADIENT_PALETTES = [
  { id: 'grad-aurora', name: '极光微光', css: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #064e3b 100%)' },
  { id: 'grad-twilight', name: '日暮紫霞', css: 'linear-gradient(135deg, #18181b 0%, #4c1d95 50%, #831843 100%)' },
  { id: 'grad-cyber', name: '赛博霓虹', css: 'linear-gradient(135deg, #09090b 0%, #0369a1 50%, #9333ea 100%)' },
  { id: 'grad-emerald', name: '翡翠深林', css: 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #047857 100%)' },
  { id: 'grad-sunset', name: '暖阳暮色', css: 'linear-gradient(135deg, #431407 0%, #9a3412 50%, #c2410c 100%)' },
  { id: 'grad-pure-dark', name: '深邃黑曜', css: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)' },
  { id: 'grad-oceanic', name: '星瀚深蓝', css: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e3a8a 100%)' },
  { id: 'grad-pastel', name: '素雅暖白', css: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)' },
];

export const SOLID_PALETTES = [
  { id: 'solid-1', name: '黑曜极暗', color: '#09090b' },
  { id: 'solid-2', name: '深空蓝灰', color: '#0f172a' },
  { id: 'solid-3', name: '暗夜冷灰', color: '#18181b' },
  { id: 'solid-4', name: '幽深墨绿', color: '#022c22' },
  { id: 'solid-5', name: '夜空深靛', color: '#172554' },
  { id: 'solid-6', name: '纯净云白', color: '#f8fafc' },
  { id: 'solid-7', name: '温润米白', color: '#f5f5f4' },
  { id: 'solid-8', name: '浅雅灰蓝', color: '#f1f5f9' },
];

/**
 * Get Bing Daily wallpaper URL
 */
export function getBingWallpaperUrl(resolution: '1920' | 'UHD' = '1920'): string {
  if (resolution === 'UHD') {
    return 'https://bing.biturl.top/?resolution=3840&format=image&index=0&mkt=zh-CN';
  }
  return 'https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN';
}

/**
 * Get a random high quality wallpaper from curated collection
 */
export function getRandomCuratedWallpaper(category?: WallpaperCategory | 'all'): WallpaperItem {
  const filtered = (!category || category === 'all')
    ? CURATED_WALLPAPERS
    : CURATED_WALLPAPERS.filter((w) => w.category === category);
  
  const pool = filtered.length > 0 ? filtered : CURATED_WALLPAPERS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
