import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Wallpaper,
  Sparkles,
  Dices,
  Globe,
  ImageIcon,
  Layers,
  SlidersHorizontal,
  Check,
  ExternalLink,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Eye,
  CloudCheck,
} from 'lucide-react';
import { AppConfig, ThemeConfig, WallpaperCategory, WallpaperSourceType } from '../types';
import {
  WALLPAPER_CATEGORIES,
  CURATED_WALLPAPERS,
  GRADIENT_PALETTES,
  SOLID_PALETTES,
  getBingWallpaperUrl,
  getRandomCuratedWallpaper,
  WallpaperItem,
} from '../lib/wallpapers';
import { PALETTE_THEMES } from '../constants';

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onUpdateTheme: (newTheme: Partial<ThemeConfig>) => void;
  isDarkMode: boolean;
}

export function WallpaperModal({
  isOpen,
  onClose,
  config,
  onUpdateTheme,
  isDarkMode,
}: WallpaperModalProps) {
  const [activeCategory, setActiveCategory] = useState<WallpaperCategory | 'all' | 'bing' | 'gradient' | 'solid' | 'custom'>('all');
  const [customUrlInput, setCustomUrlInput] = useState<string>(
    config.theme.wallpaperCustomUrl || (config.theme.background && config.theme.background.startsWith('http') ? config.theme.background : '')
  );
  const [isRolling, setIsRolling] = useState(false);
  const [previewItem, setPreviewItem] = useState<WallpaperItem | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  if (!isOpen) return null;

  const currentTheme = config.theme;

  // Handle Curated Wallpaper Select
  const handleSelectCurated = (item: WallpaperItem) => {
    onUpdateTheme({
      wallpaperType: 'curated',
      wallpaperCategory: item.category as WallpaperCategory,
      background: item.fullUrl,
      useBingWallpaper: false,
    });
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Handle Gradient Select
  const handleSelectGradient = (grad: { id: string; name: string; css: string }) => {
    onUpdateTheme({
      wallpaperType: 'gradient',
      wallpaperGradient: grad.css,
      background: grad.css,
      useBingWallpaper: false,
    });
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Handle Solid Color Select
  const handleSelectSolid = (solid: { id: string; name: string; color: string }) => {
    onUpdateTheme({
      wallpaperType: 'solid',
      wallpaperSolidColor: solid.color,
      background: solid.color,
      useBingWallpaper: false,
    });
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Handle Bing Toggle & Resolution
  const handleToggleBing = (resolution: '1920' | 'UHD' = '1920') => {
    const bingUrl = getBingWallpaperUrl(resolution);
    onUpdateTheme({
      wallpaperType: 'bing',
      useBingWallpaper: true,
      bingResolution: resolution,
      background: bingUrl,
      wallpaperCustomUrl: bingUrl,
    });
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Handle Custom URL
  const handleApplyCustomUrl = () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;
    onUpdateTheme({
      wallpaperType: 'custom',
      wallpaperCustomUrl: trimmed,
      background: trimmed,
      useBingWallpaper: false,
    });
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Handle Random Roll
  const handleRandomRoll = () => {
    setIsRolling(true);
    const cat = activeCategory === 'bing' || activeCategory === 'gradient' || activeCategory === 'solid' || activeCategory === 'custom' ? 'all' : activeCategory;
    const randomItem = getRandomCuratedWallpaper(cat);
    setTimeout(() => {
      handleSelectCurated(randomItem);
      setIsRolling(false);
    }, 250);
  };

  // Filter items
  const filteredWallpapers = CURATED_WALLPAPERS.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60"
      />

      {/* Main Modal Box */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative w-full max-w-5xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border z-10 ${
          isDarkMode
            ? 'bg-slate-950 border-white/15 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between border-b shrink-0 ${
          isDarkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shadow-inner border border-sky-500/30 shrink-0">
              <Wallpaper size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold tracking-tight flex items-center gap-1.5 sm:gap-2">
                <span>壁纸中心与背景图库</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-medium border border-sky-500/30 hidden sm:inline-block">
                  4K / Bing / 渐变
                </span>
              </h2>
              <p className={`text-[11px] sm:text-xs hidden xs:block sm:block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                支持微软 Bing 每日壁纸、精选摄影画廊与参数调节
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Random Button */}
            <button
              type="button"
              onClick={handleRandomRoll}
              disabled={isRolling}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50"
              title="从精选图库随机挑选一张"
            >
              <Dices size={14} className={isRolling ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{isRolling ? '挑选壁纸中...' : '随机换一张'}</span>
              <span className="sm:hidden">随机</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
                isDarkMode
                  ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className={`px-3 sm:px-6 py-2 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar border-b shrink-0 ${
          isDarkMode ? 'border-white/10 bg-slate-900/40' : 'border-slate-200/80 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-sky-600 text-white shadow-md'
                : isDarkMode
                ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                : 'bg-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            全部精选 ({CURATED_WALLPAPERS.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('bing')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeCategory === 'bing'
                ? 'bg-sky-600 text-white shadow-md'
                : isDarkMode
                ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                : 'bg-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Globe size={13} />
            <span>微软 Bing 每日壁纸</span>
          </button>

          {WALLPAPER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-md'
                  : isDarkMode
                  ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  : 'bg-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setActiveCategory('gradient')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeCategory === 'gradient'
                ? 'bg-sky-600 text-white shadow-md'
                : isDarkMode
                ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                : 'bg-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Layers size={13} />
            <span>现代渐变</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('solid')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeCategory === 'solid'
                ? 'bg-sky-600 text-white shadow-md'
                : isDarkMode
                ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                : 'bg-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>纯色质感</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('custom')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeCategory === 'custom'
                ? 'bg-sky-600 text-white shadow-md'
                : isDarkMode
                ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                : 'bg-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <ExternalLink size={13} />
            <span>自定义直链</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Toast Notification */}
          <AnimatePresence>
            {copiedToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <CheckCircle2 size={15} />
                <span>壁纸已成功应用并同步至全局 AppConfig 配置！</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* View: Bing Daily Section */}
          {(activeCategory === 'bing' || activeCategory === 'all') && (
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100/70 border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Globe size={16} className="text-sky-400" />
                    <span>微软 Bing 官方每日高清壁纸</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    每日零点自动同步更新全球风景大片，无需手动更换，始终保持新鲜感
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleBing('1920')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      currentTheme.useBingWallpaper && (!currentTheme.background || !currentTheme.background.includes('resolution=3840'))
                        ? 'bg-sky-600 text-white font-bold shadow-md'
                        : isDarkMode ? 'bg-white/10 hover:bg-white/20 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    1080P 高清应用
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleBing('UHD')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      currentTheme.useBingWallpaper && currentTheme.background?.includes('resolution=3840')
                        ? 'bg-sky-600 text-white font-bold shadow-md'
                        : isDarkMode ? 'bg-white/10 hover:bg-white/20 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    4K UHD 超清原图
                  </button>
                </div>
              </div>

              {/* Bing Preview Card */}
              <div className="relative aspect-[21/9] rounded-xl overflow-hidden border border-white/10 shadow-lg group">
                <img
                  src="https://api.dujin.org/bing/1920.php"
                  alt="Bing Daily Wallpaper Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white drop-shadow">微软 Bing 每日官方轮播图</span>
                      <span className="text-[11px] text-white/80 block drop-shadow">每日 00:00 自动更新</span>
                    </div>
                    {currentTheme.useBingWallpaper && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow">
                        <Check size={12} />
                        <span>已应用 Bing</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View: Curated Wallpapers Grid */}
          {activeCategory !== 'bing' && activeCategory !== 'gradient' && activeCategory !== 'solid' && activeCategory !== 'custom' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ImageIcon size={16} className="text-indigo-400" />
                  <span>精选摄影画廊 ({filteredWallpapers.length} 张壁纸)</span>
                </h3>
                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  点击任意卡片即可实时预览并应用
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {filteredWallpapers.map((item) => {
                  const isSelected =
                    !currentTheme.useBingWallpaper &&
                    currentTheme.wallpaperType !== 'gradient' &&
                    currentTheme.wallpaperType !== 'solid' &&
                    currentTheme.background === item.fullUrl;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectCurated(item)}
                      className={`group relative aspect-video rounded-2xl overflow-hidden border text-left transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? 'ring-4 ring-sky-500 border-sky-400 shadow-xl shadow-sky-500/25 scale-[1.02]'
                          : isDarkMode
                          ? 'border-white/10 hover:border-white/40 hover:shadow-lg'
                          : 'border-slate-200 hover:border-slate-400 hover:shadow-md'
                      }`}
                    >
                      <img
                        src={item.thumbUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2.5 flex flex-col justify-end">
                        <span className="text-xs font-semibold text-white truncate drop-shadow">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-white/70 truncate capitalize">
                          {item.category}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-lg">
                          <Check size={14} className="stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* View: Modern Gradients */}
          {(activeCategory === 'gradient' || activeCategory === 'all') && (
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100/70 border-slate-200'
            }`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Layers size={16} className="text-sky-400" />
                <span>现代多色渐变质感色板</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {GRADIENT_PALETTES.map((grad) => {
                  const isSelected =
                    currentTheme.wallpaperType === 'gradient' &&
                    currentTheme.wallpaperGradient === grad.css;

                  return (
                    <button
                      key={grad.id}
                      type="button"
                      onClick={() => handleSelectGradient(grad)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                        isSelected
                          ? 'border-sky-400 ring-2 ring-sky-400/50 shadow-lg'
                          : isDarkMode
                          ? 'border-white/10 hover:border-white/30'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div
                        className="h-12 w-full rounded-lg mb-2 shadow-inner border border-white/15"
                        style={{ background: grad.css }}
                      />
                      <span className="text-xs font-semibold block truncate">
                        {grad.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs">
                          <Check size={12} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* View: Minimalist Solid Colors */}
          {(activeCategory === 'solid' || activeCategory === 'all') && (
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100/70 border-slate-200'
            }`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-sky-400" />
                <span>极简纯色质感背景</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                {SOLID_PALETTES.map((solid) => {
                  const isSelected =
                    currentTheme.wallpaperType === 'solid' &&
                    currentTheme.wallpaperSolidColor === solid.color;

                  return (
                    <button
                      key={solid.id}
                      type="button"
                      onClick={() => handleSelectSolid(solid)}
                      className={`p-2 rounded-xl border text-center transition-all relative group ${
                        isSelected
                          ? 'border-sky-400 ring-2 ring-sky-400/50 shadow-lg'
                          : isDarkMode
                          ? 'border-white/10 hover:border-white/30'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div
                        className="h-8 w-full rounded-lg mb-1 border border-white/15 shadow-inner"
                        style={{ backgroundColor: solid.color }}
                      />
                      <span className="text-[11px] font-medium block truncate">
                        {solid.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-white">
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* View: Custom Wallpaper URL */}
          {(activeCategory === 'custom' || activeCategory === 'all') && (
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100/70 border-slate-200'
            }`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ExternalLink size={16} className="text-sky-400" />
                <span>自定义背景图片外链直链 (URL)</span>
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="请输入任意以 https:// 开头的静态图片直链..."
                  className={`w-full flex-1 px-4 py-2.5 text-xs rounded-xl border outline-none focus:border-sky-500 ${
                    isDarkMode
                      ? 'bg-black/40 border-white/15 text-white placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow shrink-0"
                >
                  应用外链壁纸
                </button>
              </div>
            </div>
          )}

          {/* Visual Modifiers Toolkit (Blur, Mask, Fit) */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100/70 border-slate-200'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Sliders size={16} className="text-sky-400" />
              <span>壁纸视觉调校 (实时响应)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Blur */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>背景模糊 (Blur)</span>
                  <span className="font-mono text-sky-400 font-bold">{currentTheme.wallpaperBlur || 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  value={currentTheme.wallpaperBlur || 0}
                  onChange={(e) => onUpdateTheme({ wallpaperBlur: parseInt(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Mask Opacity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>遮罩暗度 (Mask)</span>
                  <span className="font-mono text-sky-400 font-bold">
                    {Math.round((currentTheme.wallpaperMaskOpacity ?? 0.35) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={Math.round((currentTheme.wallpaperMaskOpacity ?? 0.35) * 100)}
                  onChange={(e) =>
                    onUpdateTheme({ wallpaperMaskOpacity: parseInt(e.target.value) / 100 })
                  }
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Fit */}
              <div className="space-y-1.5">
                <span className={`text-xs block ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>铺满适配模式</span>
                <select
                  value={currentTheme.wallpaperFit || 'cover'}
                  onChange={(e) =>
                    onUpdateTheme({
                      wallpaperFit: e.target.value as 'cover' | 'contain' | 'repeat' | 'auto',
                    })
                  }
                  className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none focus:border-sky-500 ${
                    isDarkMode
                      ? 'bg-slate-900 border-white/20 text-white'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="cover">缩放铺满 (Cover)</option>
                  <option value="contain">完整包含 (Contain)</option>
                  <option value="repeat">平铺重复 (Repeat)</option>
                  <option value="auto">原始比例 (Auto)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-3.5 flex items-center justify-between border-t ${
          isDarkMode ? 'border-white/10 bg-slate-900/50' : 'border-slate-200/80 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
            <CloudCheck size={15} />
            <span>壁纸配置自动持久化并实时支持云端同步</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-md shadow-sky-600/25"
          >
            完成并关闭
          </button>
        </div>
      </motion.div>
    </div>
  );
}
