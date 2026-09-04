import React, { useState } from 'react';
import {
  Settings,
  Palette,
  Cloud,
  Search,
  Server,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Sparkles,
  Sliders,
  Eye,
  KeyRound,
  Database,
  Github,
  Globe,
  Bookmark,
  FileCode,
  ShieldAlert,
  FileJson,
  CheckCircle2,
  Image as ImageIcon,
  Dices,
  Layers,
  SlidersHorizontal,
  Wallpaper,
  Sun,
  Moon,
  Maximize,
  Compass,
} from 'lucide-react';
import {
  AppConfig,
  ThemePreset,
  SyncProvider,
  SearchEngine,
  LayoutMode,
  IconSource,
  WallpaperCategory,
  WallpaperSourceType,
} from '../types';
import { PALETTE_THEMES } from '../constants';
import { iconSources, getFaviconUrlWithFallback } from '../lib/favicon';
import {
  WALLPAPER_CATEGORIES,
  CURATED_WALLPAPERS,
  GRADIENT_PALETTES,
  SOLID_PALETTES,
  getBingWallpaperUrl,
  getRandomCuratedWallpaper,
  WallpaperItem,
} from '../lib/wallpapers';
import {
  syncPull,
  syncPush,
  testSyncConnection,
  createNewGist,
  initCfD1Table,
  exportConfigJson,
  importConfigJson,
  exportBookmarksHtml,
  importBookmarksHtmlWithOptions,
  importConfigJsonWithOptions,
  clearAllBookmarks,
  restoreFactoryDefaults,
} from '../lib/storage';
import { ExportAuthModal } from './ExportAuthModal';
import { isExportAuthenticated } from '../lib/exportAuth';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onChange: (config: AppConfig) => void;
  onManualSync: () => Promise<void>;
  syncStatus: {
    status: 'idle' | 'syncing' | 'success' | 'error';
    message?: string;
    lastSyncedAt?: number;
  };
}

export function SettingsPanel({
  isOpen,
  onClose,
  config,
  onChange,
  onManualSync,
  syncStatus,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<
    'theme' | 'wallpaper' | 'sync' | 'search' | 'serverless' | 'backup'
  >('theme');
  const [themeCategoryFilter, setThemeCategoryFilter] = useState<'all' | 'official' | 'palette'>('all');
  const [wallpaperCategoryFilter, setWallpaperCategoryFilter] = useState<WallpaperCategory | 'all'>('all');
  const [customWallpaperInput, setCustomWallpaperInput] = useState<string>(
    config.theme.wallpaperCustomUrl || (config.theme.background && config.theme.background.startsWith('http') ? config.theme.background : '')
  );
  const [isRollingRandom, setIsRollingRandom] = useState(false);

  // Sync test state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [creatingGist, setCreatingGist] = useState(false);
  const [initializingD1, setInitializingD1] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // New Search Engine Form
  const [newEngine, setNewEngine] = useState<Partial<SearchEngine>>({
    name: '',
    url: '',
    placeholder: '',
    shortcut: '',
  });
  const [showAddEngine, setShowAddEngine] = useState(false);
  const [batchScanning, setBatchScanning] = useState(false);
  const [batchDoneMsg, setBatchDoneMsg] = useState<string | null>(null);

  // Data Management States
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    danger?: boolean;
    action: () => void;
  } | null>(null);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'overwrite'>('merge');
  const [dataActionNotice, setDataActionNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<'json' | 'html' | null>(null);

  const handleTriggerExport = (type: 'json' | 'html') => {
    if (isExportAuthenticated()) {
      if (type === 'json') {
        exportConfigJson(config);
        setDataActionNotice({
          type: 'success',
          message: '已通过管理员权限校验，生成并下载 JSON 完整备份文件！',
        });
      } else {
        exportBookmarksHtml(config);
        setDataActionNotice({
          type: 'success',
          message: '已通过管理员权限校验，生成并下载标准 HTML 书签文件！',
        });
      }
    } else {
      setPendingExportType(type);
      setAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingExportType === 'json') {
      exportConfigJson(config);
      setDataActionNotice({
        type: 'success',
        message: '管理员身份验证成功，已下载 JSON 完整备份！',
      });
    } else if (pendingExportType === 'html') {
      exportBookmarksHtml(config);
      setDataActionNotice({
        type: 'success',
        message: '管理员身份验证成功，已下载 HTML 书签文件！',
      });
    }
    setPendingExportType(null);
  };

  const handleBatchDetectIcons = async () => {
    setBatchScanning(true);
    setBatchDoneMsg(null);
    try {
      const fallbackList: IconSource[] = [
        config.theme.iconSource || 'favicon_im',
        'favicon_myhkw',
        'favicon_iowen',
        'google',
      ];

      const updatedGroups = await Promise.all(
        config.groups.map(async (grp) => {
          const updatedItems = await Promise.all(
            grp.items.map(async (it) => {
              try {
                const best = await getFaviconUrlWithFallback(
                  it,
                  fallbackList
                );
                return { ...it, icon: best.url };
              } catch {
                return it;
              }
            })
          );
          return { ...grp, items: updatedItems };
        })
      );

      onChange({
        ...config,
        groups: updatedGroups,
      });
      setBatchDoneMsg('已成功批量刷新与匹配所有书签图标！');
      setTimeout(() => setBatchDoneMsg(null), 4000);
    } catch {
      setBatchDoneMsg('批量抓取完成');
      setTimeout(() => setBatchDoneMsg(null), 3000);
    } finally {
      setBatchScanning(false);
    }
  };

  const updateTheme = (updates: Partial<AppConfig['theme']>) => {
    onChange({
      ...config,
      theme: { ...config.theme, ...updates },
    });
  };

  const updateSync = (updates: Partial<AppConfig['sync']>) => {
    onChange({
      ...config,
      sync: { ...config.sync, ...updates },
    });
  };

  // Switch Theme Preset
  const selectPreset = (presetId: ThemePreset) => {
    const meta = PALETTE_THEMES[presetId];
    updateTheme({
      preset: presetId,
      background: meta.defaultBgUrl || meta.backgroundCss,
      useBingWallpaper: false,
      wallpaperType: 'preset',
      accentColor: meta.accentColor,
    });
  };

  // Wallpaper Handlers
  const selectCuratedWallpaper = (item: WallpaperItem) => {
    updateTheme({
      wallpaperType: 'curated',
      wallpaperCategory: item.category as WallpaperCategory,
      background: item.fullUrl,
      useBingWallpaper: false,
    });
  };

  const selectGradient = (grad: { id: string; name: string; css: string }) => {
    updateTheme({
      wallpaperType: 'gradient',
      wallpaperGradient: grad.css,
      background: grad.css,
      useBingWallpaper: false,
    });
  };

  const selectSolid = (solid: { id: string; name: string; color: string }) => {
    updateTheme({
      wallpaperType: 'solid',
      wallpaperSolidColor: solid.color,
      background: solid.color,
      useBingWallpaper: false,
    });
  };

  const handleRandomWallpaper = () => {
    setIsRollingRandom(true);
    const item = getRandomCuratedWallpaper(wallpaperCategoryFilter);
    setTimeout(() => {
      selectCuratedWallpaper(item);
      setIsRollingRandom(false);
    }, 250);
  };

  const handleApplyCustomUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    updateTheme({
      wallpaperType: 'custom',
      wallpaperCustomUrl: trimmed,
      background: trimmed,
      useBingWallpaper: false,
    });
  };

  const handleToggleBing = (resolution: '1920' | 'UHD' = '1920') => {
    const bingUrl = getBingWallpaperUrl(resolution);
    updateTheme({
      wallpaperType: 'bing',
      useBingWallpaper: true,
      background: bingUrl,
      wallpaperCustomUrl: bingUrl,
    });
  };

  // Test current sync credentials
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testSyncConnection(config, config.sync.provider);
      setTestResult({
        success: res.success,
        message: res.message,
      });
      if (res.success) {
        updateSync({
          lastStatus: 'success',
          lastSyncedAt: Date.now(),
          lastMessage: res.message,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || '测试连接异常',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Auto Create Gist for User
  const handleCreateGist = async () => {
    if (!config.sync.gist.token) {
      alert('请先输入 GitHub Personal Access Token (需勾选 gist 权限)');
      return;
    }
    setCreatingGist(true);
    try {
      const res = await createNewGist(config.sync.gist.token, config);
      if (res.success && res.gistId) {
        onChange({
          ...config,
          sync: {
            ...config.sync,
            provider: 'gist',
            gist: {
              ...config.sync.gist,
              gistId: res.gistId,
            },
            lastStatus: 'success',
            lastSyncedAt: Date.now(),
            lastMessage: 'Gist 创建并绑定成功',
          },
        });
        alert(`Gist 创建成功！ID: ${res.gistId}`);
      } else {
        alert(res.message);
      }
    } finally {
      setCreatingGist(false);
    }
  };

  // Initialize Cloudflare D1 Table
  const handleInitD1 = async () => {
    setInitializingD1(true);
    try {
      const res = await initCfD1Table(config);
      alert(res.message);
    } finally {
      setInitializingD1(false);
    }
  };

  // File Import handler (JSON) with Merge / Overwrite options
  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importConfigJsonWithOptions(file, config, importStrategy);
      onChange(result.config);
      setDataActionNotice({
        type: 'success',
        message: `JSON 配置导入成功 (${importStrategy === 'merge' ? `增量合并，共添加/更新 ${result.addedCount} 项` : '完全覆盖'})！`,
      });
    } catch (err: any) {
      setDataActionNotice({
        type: 'error',
        message: `JSON 导入失败: ${err.message}`,
      });
    } finally {
      e.target.value = '';
    }
  };

  // Browser Bookmarks HTML Import handler
  const handleHtmlImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importBookmarksHtmlWithOptions(file, config, importStrategy);
      onChange(result.config);
      setDataActionNotice({
        type: 'success',
        message: `HTML 浏览器书签导入成功 (${importStrategy === 'merge' ? `增量合并，导入 ${result.groupCount} 个分组、${result.count} 个书签` : `完全覆盖，共 ${result.count} 个书签`})！`,
      });
    } catch (err: any) {
      setDataActionNotice({
        type: 'error',
        message: `HTML 书签导入失败: ${err.message}`,
      });
    } finally {
      e.target.value = '';
    }
  };

  // Trigger Clear All Bookmarks Dialog
  const handleTriggerClearBookmarks = () => {
    setConfirmModal({
      isOpen: true,
      title: '高危操作：确认一键清空所有书签数据？',
      message: '此操作将彻底删除本地存储的所有导航分组与书签链接，但会保留您的主题外观、搜索引擎与同步配置。此操作无法撤销！',
      confirmText: '确认清空所有书签',
      danger: true,
      action: () => {
        const cleared = clearAllBookmarks(config);
        onChange(cleared);
        setDataActionNotice({
          type: 'success',
          message: '已成功清除所有书签与分组数据！',
        });
        setConfirmModal(null);
      },
    });
  };

  // Trigger Restore Factory Defaults Dialog
  const handleTriggerRestoreFactory = () => {
    setConfirmModal({
      isOpen: true,
      title: '高危警告：确认一键恢复出厂初始状态？',
      message: '此操作将清除所有自定义修改，完全重置为六零导航出厂默认推荐书签、搜索引擎与初始主题，并重置本地缓存。此操作无法撤销！',
      confirmText: '确认恢复出厂设置',
      danger: true,
      action: () => {
        const factory = restoreFactoryDefaults();
        onChange(factory);
        setDataActionNotice({
          type: 'success',
          message: '系统已成功恢复到出厂默认状态！',
        });
        setConfirmModal(null);
      },
    });
  };

  // Add search engine
  const handleAddSearchEngine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEngine.name || !newEngine.url) return;

    const formattedUrl = newEngine.url.includes('%s')
      ? newEngine.url
      : newEngine.url.endsWith('=') || newEngine.url.endsWith('?')
      ? newEngine.url
      : `${newEngine.url}?q=`;

    const engineItem: SearchEngine = {
      id: `engine_${Date.now()}`,
      name: newEngine.name.trim(),
      url: formattedUrl.trim(),
      placeholder: newEngine.placeholder?.trim() || `在 ${newEngine.name} 中搜索...`,
      shortcut: newEngine.shortcut?.trim(),
    };

    onChange({
      ...config,
      searchEngines: [...config.searchEngines, engineItem],
    });
    setNewEngine({ name: '', url: '', placeholder: '', shortcut: '' });
    setShowAddEngine(false);
  };

  // Delete search engine
  const handleDeleteSearchEngine = (id: string) => {
    if (config.searchEngines.length <= 1) {
      alert('至少保留一个搜索引擎');
      return;
    }
    onChange({
      ...config,
      searchEngines: config.searchEngines.filter((e) => e.id !== id),
    });
  };

  // Cloudflare Worker Code Template for CORS-safe edge proxy
  const workerProxyCode = `// Cloudflare Worker KV & D1 Proxy (serverless edge proxy)
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    const url = new URL(request.url);
    const key = url.searchParams.get('key') || 'lylme_spage_config';

    // Cloudflare KV mode
    if (env.SPAGE_KV) {
      if (request.method === 'GET') {
        const val = await env.SPAGE_KV.get(key);
        return new Response(val || '{}', { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (request.method === 'PUT') {
        const body = await request.text();
        await env.SPAGE_KV.put(key, body);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
    }
    return new Response(JSON.stringify({ error: 'Binding missing' }), { status: 500, headers: corsHeaders });
  }
};`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 md:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Shell */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-100"
        >
          {/* Top Bar / Navigation Tabs */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
              <TabButton
                active={activeTab === 'theme'}
                onClick={() => setActiveTab('theme')}
                icon={<Palette size={16} />}
                label="主题画板 (Palette)"
              />
              <TabButton
                active={activeTab === 'wallpaper'}
                onClick={() => setActiveTab('wallpaper')}
                icon={<Wallpaper size={16} />}
                label="壁纸与背景"
                badge={config.theme.useBingWallpaper ? 'BING' : config.theme.wallpaperType ? config.theme.wallpaperType.toUpperCase() : undefined}
              />
              <TabButton
                active={activeTab === 'sync'}
                onClick={() => setActiveTab('sync')}
                icon={<Cloud size={16} />}
                label="多云实时同步"
                badge={config.sync.provider !== 'none' ? config.sync.provider.toUpperCase() : undefined}
              />
              <TabButton
                active={activeTab === 'search'}
                onClick={() => setActiveTab('search')}
                icon={<Search size={16} />}
                label="搜索引擎"
              />
              <TabButton
                active={activeTab === 'serverless'}
                onClick={() => setActiveTab('serverless')}
                icon={<Server size={16} />}
                label="无服务器部署"
              />
              <TabButton
                active={activeTab === 'backup'}
                onClick={() => setActiveTab('backup')}
                icon={<Database size={16} />}
                label="数据管理中心"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const nextIsDark = !config.theme.isDarkMode;
                  updateTheme({
                    isDarkMode: nextIsDark,
                    preset: nextIsDark
                      ? ['lylme-default', 'lylme-baisu', 'palette-pure', 'palette-classic', 'palette-retro'].includes(config.theme.preset)
                        ? 'palette-cyber'
                        : config.theme.preset
                      : ['palette-cyber', 'palette-ocean', 'palette-neon'].includes(config.theme.preset)
                      ? 'palette-glass'
                      : config.theme.preset,
                  });
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                title="全站白天与黑夜模式快速切换"
              >
                {config.theme.isDarkMode ? (
                  <>
                    <Sun size={14} className="text-amber-400" />
                    <span>白天模式</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-sky-300" />
                    <span>黑夜模式</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors ml-1"
                title="关闭设置"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-8 scrollbar-thin">
            {/* =========================================================================
                TAB 1: PALETTE THEMES
               ========================================================================= */}
            {activeTab === 'theme' && (
              <div className="space-y-8">
                {/* 1. Global Day / Night Mode Selector */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {config.theme.isDarkMode ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-400" />}
                        <span>全站昼夜模式 (Day / Night Mode)</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        全站统一光暗对比度自适应调节，涵盖搜索框、导航卡片、时钟组件、背景毛玻璃与对话框
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateTheme({
                          isDarkMode: false,
                          preset: ['palette-cyber', 'palette-ocean', 'palette-neon'].includes(config.theme.preset)
                            ? 'palette-glass'
                            : config.theme.preset,
                        })
                      }
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        !config.theme.isDarkMode
                          ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 text-amber-200 shadow-md shadow-amber-500/10'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <Sun size={20} />
                        </div>
                        <div>
                          <span className="text-sm font-bold block text-white">☀️ 白天明亮模式 (Day)</span>
                          <span className="text-xs text-slate-400">轻快通透，高对比度清爽阅读</span>
                        </div>
                      </div>
                      {!config.theme.isDarkMode && <Check size={18} className="text-amber-400 stroke-[3]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateTheme({
                          isDarkMode: true,
                          preset: ['lylme-default', 'lylme-baisu', 'palette-pure', 'palette-classic', 'palette-retro'].includes(config.theme.preset)
                            ? 'palette-cyber'
                            : config.theme.preset,
                        })
                      }
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        config.theme.isDarkMode
                          ? 'bg-indigo-500/20 border-indigo-400 ring-2 ring-indigo-400/40 text-indigo-200 shadow-md shadow-indigo-500/10'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                          <Moon size={20} />
                        </div>
                        <div>
                          <span className="text-sm font-bold block text-white">🌙 黑夜深色模式 (Night)</span>
                          <span className="text-xs text-slate-400">沉浸暗夜，深邃护眼质感</span>
                        </div>
                      </div>
                      {config.theme.isDarkMode && <Check size={18} className="text-indigo-400 stroke-[3]" />}
                    </button>
                  </div>
                </div>

                {/* Theme Selector with Categories */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <label className="text-sm font-bold text-white flex items-center gap-2">
                        <Palette size={16} className="text-sky-400" />
                        主题模版库 (含原版官方主题与 Palette 调色盘全集)
                      </label>
                      <span className="text-xs text-slate-400">保留 LyLme Spage 原版经典主题，完整集成 Palette 高颜值风格</span>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setThemeCategoryFilter('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          themeCategoryFilter === 'all'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        全部 ({Object.values(PALETTE_THEMES).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeCategoryFilter('official')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          themeCategoryFilter === 'official'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        原版官方 ({Object.values(PALETTE_THEMES).filter((t) => t.category === 'official').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeCategoryFilter('palette')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          themeCategoryFilter === 'palette'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Palette 调色盘 ({Object.values(PALETTE_THEMES).filter((t) => t.category === 'palette').length})
                      </button>
                    </div>
                  </div>

                  {/* Themes Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {Object.values(PALETTE_THEMES)
                      .filter((themeMeta) => {
                        if (themeCategoryFilter === 'all') return true;
                        return themeMeta.category === themeCategoryFilter;
                      })
                      .map((themeMeta) => {
                        const isSelected = config.theme.preset === themeMeta.id;
                        return (
                          <button
                            key={themeMeta.id}
                            type="button"
                            onClick={() => selectPreset(themeMeta.id)}
                            className={`relative flex flex-col p-3 rounded-2xl border text-left transition-all duration-200 group overflow-hidden ${
                              isSelected
                                ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                            }`}
                          >
                            {/* Color preview swatch and badge */}
                            <div className="flex items-center justify-between gap-1 mb-2.5">
                              <div className="flex items-center gap-1">
                                {themeMeta.previewColors.slice(0, 4).map((color, idx) => (
                                  <div
                                    key={idx}
                                    className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              {themeMeta.badge && (
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold tracking-tight ${
                                    themeMeta.category === 'official'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  }`}
                                >
                                  {themeMeta.badge}
                                </span>
                              )}
                            </div>

                            <span className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                              {themeMeta.nameZh}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate mt-0.5">
                              {themeMeta.name}
                            </span>
                            <span className="text-[10px] text-slate-500 line-clamp-1 mt-1 opacity-80" title={themeMeta.description}>
                              {themeMeta.description}
                            </span>

                            {isSelected && (
                              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shadow">
                                <Check size={10} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Wallpaper & Background Studio Quick Access */}
                <div className="bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-500/20 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Wallpaper size={16} className="text-sky-400" />
                        <span>壁纸与背景设定</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        当前模式: {config.theme.useBingWallpaper ? '微软 Bing 每日高清' : config.theme.wallpaperType ? config.theme.wallpaperType.toUpperCase() : '主题默认背景'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('wallpaper')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow transition-all shrink-0"
                    >
                      <Sparkles size={14} />
                      <span>打开高清壁纸工作室</span>
                    </button>
                  </div>

                  {/* Bing Wallpaper Quick Switch */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <span className="text-xs font-semibold text-white block">快速开启 Bing 每日高清壁纸</span>
                      <span className="text-[11px] text-slate-400">每天随微软 Bing 官方主页自动更新精选风景</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (config.theme.useBingWallpaper) {
                          updateTheme({
                            useBingWallpaper: false,
                            wallpaperType: 'preset',
                            background: PALETTE_THEMES[config.theme.preset]?.defaultBgUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=2560&q=80',
                          });
                        } else {
                          handleToggleBing('1920');
                        }
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        config.theme.useBingWallpaper ? 'bg-sky-600' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          config.theme.useBingWallpaper ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Visual Glassmorphism & Layout Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Glass Card Blur & Opacity */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      亚克力毛玻璃与质感
                    </h4>

                    {/* Blur */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-300">磨砂模糊度 (Blur)</span>
                        <span className="font-mono text-sky-400">{config.theme.blur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        value={config.theme.blur}
                        onChange={(e) => updateTheme({ blur: parseInt(e.target.value) })}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Opacity */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-300">卡片不透明度 (Opacity)</span>
                        <span className="font-mono text-sky-400">{Math.round(config.theme.opacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={Math.round(config.theme.opacity * 100)}
                        onChange={(e) => updateTheme({ opacity: parseInt(e.target.value) / 100 })}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Card Rounded Radius */}
                    <div>
                      <span className="text-xs text-slate-300 block mb-2">卡片圆角风格</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['rounded-xl', 'rounded-2xl', 'rounded-3xl'] as const).map((rad) => (
                          <button
                            key={rad}
                            type="button"
                            onClick={() => updateTheme({ cardBorderRadius: rad })}
                            className={`py-1.5 text-xs font-medium rounded-xl border transition-all ${
                              config.theme.cardBorderRadius === rad
                                ? 'bg-blue-600/30 border-blue-500 text-white'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            {rad === 'rounded-xl' ? '轻度圆角' : rad === 'rounded-2xl' ? '标准圆角' : '胶囊大圆角'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Layout & Display Options */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      排版模式与组件开关
                    </h4>

                    {/* Layout Mode */}
                    <div>
                      <span className="text-xs text-slate-300 block mb-2">导航排版模式</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'grid', label: '居中网格' },
                          { id: 'tabs', label: '分类标签' },
                          { id: 'sidebar', label: '侧边栏索引' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => updateTheme({ layoutMode: m.id as LayoutMode })}
                            className={`py-1.5 text-xs font-medium rounded-xl border transition-all ${
                              config.theme.layoutMode === m.id
                                ? 'bg-blue-600/30 border-blue-500 text-white'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clock toggle */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-300">显示数字时钟与日期</span>
                      <input
                        type="checkbox"
                        checked={config.theme.showClock}
                        onChange={(e) => updateTheme({ showClock: e.target.checked })}
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                      />
                    </div>

                    {/* Hitokoto toggle */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">显示“一言”哲学每日箴言</span>
                      <input
                        type="checkbox"
                        checked={config.theme.showHitokoto}
                        onChange={(e) => updateTheme({ showHitokoto: e.target.checked })}
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                      />
                    </div>

                    {/* Open in new tab */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">链接新标签页打开</span>
                      <input
                        type="checkbox"
                        checked={config.theme.openInNewTab}
                        onChange={(e) => updateTheme({ openInNewTab: e.target.checked })}
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Favicon Multi-Source & Automatic Fetching Settings */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Sparkles size={14} className="text-sky-400" />
                        <span>自动抓取 Favicon 图标与失败首字母占位</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        集成 20+ 个国内外高质量聚合解析源，智能多重故障回退，若无图标或抓取失败自动基于域名生成彩色渐变首字母头像。
                      </p>
                    </div>
                  </div>

                  {/* Preferred Icon Source Dropdown */}
                  <div>
                    <label className="text-xs text-slate-300 block mb-2 font-medium">默认图标抓取源 (Default Icon Source)</label>
                    <select
                      value={config.theme.iconSource || 'favicon_im'}
                      onChange={(e) => updateTheme({ iconSource: e.target.value as IconSource })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-400 outline-none"
                    >
                      {iconSources.map((s) => (
                        <option key={s.value} value={s.value} className="bg-slate-900 text-white">
                          {s.label} — {s.detail}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch Refresh Button */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-white block font-medium">批量探测与更新所有书签图标</span>
                      <span className="text-[11px] text-slate-400">
                        使用当前首选源遍历所有书签，重新检测并补全丢失的图标
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={batchScanning}
                      onClick={handleBatchDetectIcons}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white flex items-center gap-1.5 shadow transition-all shrink-0 ml-3"
                    >
                      <RefreshCw size={13} className={batchScanning ? 'animate-spin' : ''} />
                      <span>{batchScanning ? '正在逐一探测中...' : '一键批量刷新'}</span>
                    </button>
                  </div>

                  {batchDoneMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <Check size={14} />
                      <span>{batchDoneMsg}</span>
                    </div>
                  )}
                </div>

                {/* Custom CSS */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>自定义 CSS 样式注入 (兼容 LyLme Spage 自定义代码)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={config.theme.customCss || ''}
                    onChange={(e) => updateTheme({ customCss: e.target.value })}
                    placeholder="/* 输入自定义 CSS，例如 .nav-card { filter: contrast(1.1); } */"
                    className="w-full font-mono text-xs bg-black/50 border border-white/15 rounded-xl p-3 text-emerald-400 placeholder:text-slate-600 outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB: WALLPAPER STUDIO (Bing, Curated 4K, Gradients, Solids, Custom URL, FX)
               ========================================================================= */}
            {activeTab === 'wallpaper' && (
              <div className="space-y-8">
                {/* Wallpaper Studio Quick Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-sky-950/50 to-indigo-950/50 border border-sky-500/20 rounded-2xl backdrop-blur-md">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Wallpaper size={16} className="text-sky-400" />
                      <span>高清壁纸工作室 (Wallpaper Studio)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      支持微软 Bing 每日自动更新、精选 4K 超清图库、赛博渐变色以及自定义静态直链。
                    </p>
                  </div>

                  {/* Random Wallpaper Roll Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRandomWallpaper}
                      disabled={isRollingRandom}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 active:scale-95 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-sky-600/20 disabled:opacity-50"
                      title="从精选图库随机挑选一张壁纸"
                    >
                      <Dices size={15} className={isRollingRandom ? 'animate-spin' : ''} />
                      <span>{isRollingRandom ? '挑选壁纸中...' : '随机换一张'}</span>
                    </button>
                  </div>
                </div>

                {/* 1. Bing Daily Wallpaper Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <Globe size={15} className="text-sky-400" />
                        <span>微软 Bing 每日高清壁纸</span>
                      </span>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        与微软 Bing 官方主页同步，每日零点自动更新全球精选风景大片
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (config.theme.useBingWallpaper) {
                          updateTheme({
                            useBingWallpaper: false,
                            wallpaperType: 'preset',
                            background: PALETTE_THEMES[config.theme.preset]?.defaultBgUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=2560&q=80',
                          });
                        } else {
                          handleToggleBing('1920');
                        }
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        config.theme.useBingWallpaper ? 'bg-sky-600' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          config.theme.useBingWallpaper ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {config.theme.useBingWallpaper && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 flex-wrap">
                      <span className="text-xs text-slate-400">Bing 分辨率模式:</span>
                      <button
                        type="button"
                        onClick={() => handleToggleBing('1920')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          !config.theme.background?.includes('resolution=3840')
                            ? 'bg-sky-600 text-white shadow'
                            : 'bg-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        1080P 高清 (推荐·加载快)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleBing('UHD')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          config.theme.background?.includes('resolution=3840')
                            ? 'bg-sky-600 text-white shadow'
                            : 'bg-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        4K UHD 超清原图 (高画质)
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Curated High-Definition Wallpapers by Category */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <ImageIcon size={16} className="text-indigo-400" />
                        <span>精选 4K 超清艺术画廊</span>
                      </h4>
                      <span className="text-xs text-slate-400">
                        涵盖自然、动漫、赛博朋克、建筑等全类别 2560+ 分辨率高清壁纸
                      </span>
                    </div>

                    {/* Category Selector Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                      {WALLPAPER_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setWallpaperCategoryFilter(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                            wallpaperCategoryFilter === cat.id
                              ? 'bg-indigo-600 text-white shadow'
                              : 'bg-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wallpapers Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {CURATED_WALLPAPERS.filter((item) =>
                      wallpaperCategoryFilter === 'all'
                        ? true
                        : item.category === wallpaperCategoryFilter
                    ).map((item) => {
                      const isSelected =
                        config.theme.background === item.fullUrl ||
                        (config.theme.wallpaperType === 'curated' && config.theme.background === item.fullUrl);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectCuratedWallpaper(item)}
                          className={`group relative aspect-video rounded-xl overflow-hidden border transition-all duration-200 text-left ${
                            isSelected
                              ? 'border-indigo-400 ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-500/20'
                              : 'border-white/10 hover:border-white/40'
                          }`}
                        >
                          <img
                            src={item.thumbUrl}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-end">
                            <span className="text-[11px] font-semibold text-white truncate drop-shadow">
                              {item.name}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-md">
                              <Check size={12} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Modern Gradients & Solid Palettes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gradients */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Layers size={14} className="text-sky-400" />
                      <span>现代多色渐变</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {GRADIENT_PALETTES.map((grad) => {
                        const isSelected =
                          config.theme.wallpaperType === 'gradient' &&
                          config.theme.wallpaperGradient === grad.css;

                        return (
                          <button
                            key={grad.id}
                            type="button"
                            onClick={() => selectGradient(grad)}
                            className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                              isSelected
                                ? 'border-sky-400 ring-2 ring-sky-400/40 shadow-md'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div
                              className="h-10 w-full rounded-lg mb-1.5 border border-white/10"
                              style={{ background: grad.css }}
                            />
                            <span className="text-[11px] font-medium text-slate-200 block truncate">
                              {grad.name}
                            </span>
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-white text-[10px]">
                                <Check size={10} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Solid Colors */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-sky-400" />
                      <span>极简纯色背景</span>
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {SOLID_PALETTES.map((solid) => {
                        const isSelected =
                          config.theme.wallpaperType === 'solid' &&
                          config.theme.wallpaperSolidColor === solid.color;

                        return (
                          <button
                            key={solid.id}
                            type="button"
                            onClick={() => selectSolid(solid)}
                            className={`p-2 rounded-xl border text-center transition-all relative group ${
                              isSelected
                                ? 'border-sky-400 ring-2 ring-sky-400/40 shadow-md'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div
                              className="h-8 w-full rounded-lg mb-1 border border-white/15"
                              style={{ backgroundColor: solid.color }}
                            />
                            <span className="text-[10px] font-medium text-slate-300 block truncate">
                              {solid.name}
                            </span>
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-sky-500 flex items-center justify-center text-white">
                                <Check size={8} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. Custom Wallpaper URL */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ExternalLink size={14} className="text-sky-400" />
                    <span>自定义背景图片直链 (URL)</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customWallpaperInput}
                      onChange={(e) => setCustomWallpaperInput(e.target.value)}
                      placeholder="https://example.com/wallpaper.jpg"
                      className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCustomUrl(customWallpaperInput)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow"
                    >
                      应用此直链
                    </button>
                  </div>
                </div>

                {/* 5. Background Visual Effects & Glass Modifiers */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Sliders size={14} className="text-sky-400" />
                    <span>壁纸视觉调校与滤镜特效</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {/* Background Blur */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">背景模糊度 (Blur)</span>
                        <span className="font-mono text-sky-400">{config.theme.wallpaperBlur || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={config.theme.wallpaperBlur || 0}
                        onChange={(e) => updateTheme({ wallpaperBlur: parseInt(e.target.value) })}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>

                    {/* Dark Mask Opacity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">背景暗度遮罩 (Mask)</span>
                        <span className="font-mono text-sky-400">
                          {Math.round((config.theme.wallpaperMaskOpacity ?? 0.3) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        value={Math.round((config.theme.wallpaperMaskOpacity ?? 0.3) * 100)}
                        onChange={(e) =>
                          updateTheme({ wallpaperMaskOpacity: parseInt(e.target.value) / 100 })
                        }
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>

                    {/* Wallpaper Fit */}
                    <div className="space-y-1.5">
                      <span className="text-xs text-slate-300 block">填充适配模式</span>
                      <select
                        value={config.theme.wallpaperFit || 'cover'}
                        onChange={(e) =>
                          updateTheme({
                            wallpaperFit: e.target.value as 'cover' | 'contain' | 'repeat' | 'auto',
                          })
                        }
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:border-sky-400 outline-none"
                      >
                        <option value="cover" className="bg-slate-900">缩放铺满 (Cover)</option>
                        <option value="contain" className="bg-slate-900">完整包含 (Contain)</option>
                        <option value="repeat" className="bg-slate-900">平铺重复 (Repeat)</option>
                        <option value="auto" className="bg-slate-900">原始比例 (Auto)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 2: CLOUD SYNCHRONIZATION (Gist, Cloudflare KV, Cloudflare D1, API)
               ========================================================================= */}
            {activeTab === 'sync' && (
              <div className="space-y-6">
                {/* Sync Provider Selector Bar */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    选择云端实时同步方案
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'gist', label: 'GitHub Gist', desc: '免建仓库·极简轻量', icon: <Github size={16} /> },
                      { id: 'github_repo', label: 'GitHub 独立仓库', desc: '独立Repo·版本历史', icon: <FileCode size={16} /> },
                      { id: 'webdav', label: '坚果云 / WebDAV', desc: '多端网盘·标准协议', icon: <Cloud size={16} /> },
                      { id: 'cf_kv', label: 'Cloudflare KV', desc: '全球极速·KV存储', icon: <Database size={16} /> },
                      { id: 'cf_d1', label: 'Cloudflare D1', desc: 'SQL数据库·高可靠', icon: <Server size={16} /> },
                      { id: 'none', label: '纯本地存储', desc: '仅保存在本设备', icon: <Sliders size={16} /> },
                    ].map((prov) => {
                      const isSelected = config.sync.provider === prov.id;
                      return (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => updateSync({ provider: prov.id as SyncProvider })}
                          className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-blue-600/25 border-blue-500 text-white ring-1 ring-blue-500 shadow-md'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                            {prov.icon}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{prov.label}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{prov.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* GitHub Gist Config Form */}
                {config.sync.provider === 'gist' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Github size={18} className="text-purple-400" />
                        <h4 className="text-sm font-bold text-white">GitHub Gist 云端配置</h4>
                      </div>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=gist&description=LyLme_Spage_Sync"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                      >
                        获取 Token <ExternalLink size={12} />
                      </a>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          GitHub Personal Access Token (PAT)
                        </label>
                        <input
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (需包含 gist 权限)"
                          value={config.sync.gist.token}
                          onChange={(e) =>
                            updateSync({
                              gist: { ...config.sync.gist, token: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-slate-300">Gist ID (留空可点击右侧自动新建)</label>
                          <button
                            type="button"
                            onClick={handleCreateGist}
                            disabled={creatingGist || !config.sync.gist.token}
                            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-40"
                          >
                            <Sparkles size={12} />
                            {creatingGist ? '正在自动创建...' : '自动新建并绑定 Gist'}
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="例如: 8a9b2c3d4e5f6g7h8i9j (在 Gist URL 末尾的字符串)"
                          value={config.sync.gist.gistId}
                          onChange={(e) =>
                            updateSync({
                              gist: { ...config.sync.gist, gistId: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* GitHub Independent Repository Sync Form */}
                {config.sync.provider === 'github_repo' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <FileCode size={18} className="text-emerald-400" />
                        <h4 className="text-sm font-bold text-white">GitHub 独立代码仓库同步</h4>
                      </div>
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=LyLme_Spage_Repo_Sync"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        获取含 repo 权限 Token <ExternalLink size={12} />
                      </a>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 leading-relaxed">
                      💡 支持私有/公开 Git 仓库同步。每次推送到云端都会产生清晰的 Git Commit 提交记录，方便回溯历史版本。
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          GitHub Personal Access Token (PAT) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (需包含 repo 权限)"
                          value={config.sync.githubRepo.token}
                          onChange={(e) =>
                            updateSync({
                              githubRepo: { ...config.sync.githubRepo, token: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          仓库所有者 / 用户名 (Owner) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="例如: octocat"
                          value={config.sync.githubRepo.owner}
                          onChange={(e) =>
                            updateSync({
                              githubRepo: { ...config.sync.githubRepo, owner: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          仓库名称 (Repository) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="例如: my-spage-nav"
                          value={config.sync.githubRepo.repo}
                          onChange={(e) =>
                            updateSync({
                              githubRepo: { ...config.sync.githubRepo, repo: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          分支名称 (Branch)
                        </label>
                        <input
                          type="text"
                          placeholder="main"
                          value={config.sync.githubRepo.branch || 'main'}
                          onChange={(e) =>
                            updateSync({
                              githubRepo: { ...config.sync.githubRepo, branch: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          保存文件路径 (Path)
                        </label>
                        <input
                          type="text"
                          placeholder="data/lylme_spage.json"
                          value={config.sync.githubRepo.path || 'data/lylme_spage.json'}
                          onChange={(e) =>
                            updateSync({
                              githubRepo: { ...config.sync.githubRepo, path: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 坚果云 / 自建 WebDAV Sync Form */}
                {config.sync.provider === 'webdav' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Cloud size={18} className="text-sky-400" />
                        <h4 className="text-sm font-bold text-white">坚果云 / 自建 WebDAV 协议同步</h4>
                      </div>
                      <a
                        href="https://help.jianguoyun.com/?p=2064"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                      >
                        坚果云 WebDAV 开启教程 <ExternalLink size={12} />
                      </a>
                    </div>

                    <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                      <p className="font-semibold text-sky-300">📦 坚果云设置提示：</p>
                      <p>1. 坚果云服务器地址：<code className="text-sky-200 bg-black/40 px-1 py-0.5 rounded font-mono">https://dav.jianguoyun.com/dav/</code></p>
                      <p>2. 账号：您的坚果云注册邮箱</p>
                      <p>3. 密码：请在坚果云网页端【账户信息】&rarr;【安全设置】&rarr;【第三方应用管理】中生成<strong>应用授权密码</strong>（切勿使用网页登录原密码）。</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          WebDAV 服务器地址 (URL) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="https://dav.jianguoyun.com/dav/ 或自建 WebDAV 地址"
                          value={config.sync.webdav.url}
                          onChange={(e) =>
                            updateSync({
                              webdav: { ...config.sync.webdav, url: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          WebDAV 账号 / 邮箱 (Username) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="your_email@example.com"
                          value={config.sync.webdav.username}
                          onChange={(e) =>
                            updateSync({
                              webdav: { ...config.sync.webdav, username: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          应用密码 / 授权凭证 (Password) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="password"
                          placeholder="坚果云应用密码"
                          value={config.sync.webdav.password}
                          onChange={(e) =>
                            updateSync({
                              webdav: { ...config.sync.webdav, password: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none font-mono"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          存储文件名 (Filename)
                        </label>
                        <input
                          type="text"
                          placeholder="lylme_spage.json"
                          value={config.sync.webdav.filename || 'lylme_spage.json'}
                          onChange={(e) =>
                            updateSync({
                              webdav: { ...config.sync.webdav, filename: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cloudflare KV Config Form */}
                {config.sync.provider === 'cf_kv' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Database size={18} className="text-amber-400" />
                        <h4 className="text-sm font-bold text-white">Cloudflare Workers KV 配置</h4>
                      </div>
                      <a
                        href="https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                      >
                        前往 Cloudflare 控制台 <ExternalLink size={12} />
                      </a>
                    </div>

                    {/* Edge Zero-CORS Notice */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-sky-500/10 border border-amber-500/30 text-xs text-slate-300 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <Sparkles size={15} />
                        <span>推荐最佳实践：Cloudflare Pages 边缘后端模式 (免填凭证 & 100% 绕过 CORS)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        由于 Cloudflare REST API 会被浏览器严格拦截跨域 (CORS)，本项目内置了 Cloudflare Pages Serverless 接口 (<code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">/api/sync</code>)。
                      </p>
                      <div className="bg-black/30 rounded-lg p-2.5 space-y-1 text-[11px] font-mono text-slate-300 border border-white/5">
                        <p className="text-emerald-400 font-semibold">⚡ 2 步极速免密配置：</p>
                        <p>1. 在 Cloudflare 控制台创建 KV 命名空间（如 <code className="text-amber-300">my-nav-kv</code>）</p>
                        <p>2. 在 Cloudflare Pages 项目的 <strong className="text-white">Settings &rarr; Functions &rarr; KV namespace bindings</strong> 中添加绑定：</p>
                        <p className="pl-4 text-sky-300">变量名 (Variable name): <strong className="text-amber-300 bg-black/60 px-1.5 py-0.5 rounded">ONENAV_KV</strong></p>
                        <p className="text-emerald-300">✓ 绑定后前端无需填写 Account ID 与 API Token，系统自动通过边缘服务端无感读写！</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Cloudflare Account ID <span className="text-slate-500 text-[10px]">(免密绑定模式下可留空)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="若未绑定 ONENAV_KV，在此填写 Account ID"
                          value={config.sync.cfKv.accountId}
                          onChange={(e) =>
                            updateSync({
                              cfKv: { ...config.sync.cfKv, accountId: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          KV Namespace ID <span className="text-slate-500 text-[10px]">(免密绑定模式下可留空)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="若未绑定 ONENAV_KV，在此填写 Namespace ID"
                          value={config.sync.cfKv.namespaceId}
                          onChange={(e) =>
                            updateSync({
                              cfKv: { ...config.sync.cfKv, namespaceId: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Cloudflare API Token <span className="text-slate-500 text-[10px]">(免密绑定模式下可留空)</span>
                        </label>
                        <input
                          type="password"
                          placeholder="若未绑定 ONENAV_KV，在此填写含 KV 权限的 Token"
                          value={config.sync.cfKv.apiToken}
                          onChange={(e) =>
                            updateSync({
                              cfKv: { ...config.sync.cfKv, apiToken: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cloudflare D1 Config Form */}
                {config.sync.provider === 'cf_d1' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Server size={18} className="text-emerald-400" />
                        <h4 className="text-sm font-bold text-white">Cloudflare D1 SQL 数据库配置</h4>
                      </div>
                      <a
                        href="https://dash.cloudflare.com/?to=/:account/workers/d1"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                      >
                        前往 Cloudflare D1 <ExternalLink size={12} />
                      </a>
                    </div>

                    {/* Edge Zero-CORS Notice for D1 */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-500/30 text-xs text-slate-300 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-emerald-300">
                        <Sparkles size={15} />
                        <span>推荐最佳实践：Cloudflare Pages D1 边缘直连 (零跨域 & 免客户端凭证)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        将本项目部署至 Cloudflare Pages，在 <strong className="text-white">Settings &rarr; Functions &rarr; D1 database bindings</strong> 中添加绑定：
                      </p>
                      <div className="bg-black/30 rounded-lg p-2.5 space-y-1 text-[11px] font-mono text-slate-300 border border-white/5">
                        <p className="text-sky-300">变量名 (Variable name): <strong className="text-emerald-300 bg-black/60 px-1.5 py-0.5 rounded">ONENAV_D1</strong> (或 <strong className="text-emerald-300">DB</strong>)</p>
                        <p className="text-emerald-300">✓ 绑定后无需填写 API Token，系统自动通过服务端 /api/sync 端点执行 SQL 读写。</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Cloudflare Account ID <span className="text-slate-500 text-[10px]">(免密绑定模式下可留空)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Account ID"
                          value={config.sync.cfD1.accountId}
                          onChange={(e) =>
                            updateSync({
                              cfD1: { ...config.sync.cfD1, accountId: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          D1 Database ID <span className="text-slate-500 text-[10px]">(免密绑定模式下可留空)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="D1 Database UUID"
                          value={config.sync.cfD1.databaseId}
                          onChange={(e) =>
                            updateSync({
                              cfD1: { ...config.sync.cfD1, databaseId: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Cloudflare API Token <span className="text-slate-500 text-[10px]">(免密绑定模式下可留空)</span>
                        </label>
                        <input
                          type="password"
                          placeholder="Cloudflare API Token"
                          value={config.sync.cfD1.apiToken}
                          onChange={(e) =>
                            updateSync({
                              cfD1: { ...config.sync.cfD1, apiToken: e.target.value.trim() },
                            })
                          }
                          className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-400">首次使用需在 D1 中自动建表:</span>
                        <button
                          type="button"
                          onClick={handleInitD1}
                          disabled={initializingD1}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Database size={13} />
                          {initializingD1 ? '正在检查初始化...' : '一键初始化 D1 数据表'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Global Sync Controls & Test */}
                {config.sync.provider !== 'none' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      自动同步策略与连接测试
                    </h4>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white block">本地修改后自动推送同步</span>
                        <span className="text-slate-400">每次添加、编辑或删除书签时，自动防抖同步至云端</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.sync.autoSync}
                        onChange={(e) => updateSync({ autoSync: e.target.checked })}
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleTestConnection}
                          disabled={testingConnection}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                        >
                          <RefreshCw size={13} className={testingConnection ? 'animate-spin' : ''} />
                          {testingConnection ? '正在测试...' : '测试云端连接 & 立即推送'}
                        </button>
                        <button
                          type="button"
                          onClick={onManualSync}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Download size={13} />
                          从云端拉取最新
                        </button>
                      </div>

                      {/* Sync Status Badge */}
                      <div className="text-xs text-slate-400">
                        最后同步: {syncStatus.lastSyncedAt ? new Date(syncStatus.lastSyncedAt).toLocaleTimeString() : '尚未同步'}
                      </div>
                    </div>

                    {/* Test result message banner */}
                    {testResult && (
                      <div
                        className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                          testResult.success
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                        }`}
                      >
                        {testResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
                        <span>{testResult.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 3: SEARCH ENGINES
               ========================================================================= */}
            {activeTab === 'search' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Search size={16} className="text-sky-400" />
                    搜索引擎列表 (已启用 {config.searchEngines.length} 个)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddEngine(!showAddEngine)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={14} /> 添加搜索引擎
                  </button>
                </div>

                {/* Add Engine Form */}
                <AnimatePresence>
                  {showAddEngine && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddSearchEngine}
                      className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="引擎名称 (如: 小红书)"
                          value={newEngine.name}
                          onChange={(e) => setNewEngine({ ...newEngine, name: e.target.value })}
                          className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                        <input
                          type="text"
                          placeholder="搜索 URL (如: https://.../search?q=)"
                          value={newEngine.url}
                          onChange={(e) => setNewEngine({ ...newEngine, url: e.target.value })}
                          className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white sm:col-span-2"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddEngine(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                        >
                          确认添加
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Engine List */}
                <div className="space-y-2">
                  {config.searchEngines.map((engine) => (
                    <div
                      key={engine.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs text-white">
                          {engine.name[0]}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white">{engine.name}</span>
                          <span className="text-xs text-slate-400 block truncate max-w-md">{engine.url}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSearchEngine(engine.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                        title="删除此搜索引擎"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 4: SERVERLESS DEPLOYMENT GUIDE
               ========================================================================= */}
            {activeTab === 'serverless' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 leading-relaxed">
                  <p className="font-bold text-sm text-blue-100 mb-1">
                    🎉 零服务器·真正的现代 Serverless 架构
                  </p>
                  本项目基于纯静态前端 + 边缘云原生设计，无需购买任何云服务器或虚拟主机，直接构建出的静态文件可免费托管在以下无服务器平台，并支持通过 GitHub Gist 或 Cloudflare 实时多端持久化同步：
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* GitHub Pages */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      <Github size={16} /> 部署到 GitHub Pages
                    </h5>
                    <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                      <li>将本项目推送到您的 GitHub 个人仓库；</li>
                      <li>在仓库设置 Settings -&gt; Pages 中，将 Source 选为 <code>GitHub Actions</code>；</li>
                      <li>项目内置标准 Vite 构建流，提交即自动编译上线！</li>
                    </ol>
                  </div>

                  {/* Cloudflare Pages */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      <Server size={16} /> 部署到 Cloudflare Pages
                    </h5>
                    <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside leading-relaxed">
                      <li>在 Cloudflare 控制台新建 Pages 项目，连接 GitHub 仓库；</li>
                      <li>构建命令填写: <code>npm run build</code>，输出目录填写: <code>dist</code>；</li>
                      <li>在设置中绑定 KV 为 <code>SPAGE_KV</code> 或 D1 为 <code>SPAGE_D1</code> 即可！</li>
                    </ol>
                  </div>

                  {/* Vercel */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      <ExternalLink size={16} /> 部署到 Vercel
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      在 Vercel 仪表盘一键 Import 仓库，框架预设选择 Vite，零配置直接点击 Deploy，1分钟内即可在全球边缘 CDN 节点生效。
                    </p>
                  </div>

                  {/* Netlify */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      <ExternalLink size={16} /> 部署到 Netlify
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      新建 Netlify 站点，Publish directory 填写 <code>dist</code>，Build command 填写 <code>npm run build</code> 即可。
                    </p>
                  </div>
                </div>

                {/* Cloudflare Worker Edge Proxy Script Code */}
                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      备用: Cloudflare Worker 15行极简边缘跨域代码 (可选)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(workerProxyCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                      {copiedCode ? '已复制' : '复制 Worker 代码'}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto p-3 bg-black/60 rounded-xl max-h-44">
                    {workerProxyCode}
                  </pre>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 5: BACKUP & RESTORE / SITE INFO & ICP
               ========================================================================= */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                {/* Site & Compliance Filing Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2 text-sky-400">
                      <Globe size={18} />
                      <h4 className="text-sm font-bold text-white">网站信息与站长备案</h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                      版本号: v{config.version || '2.2.0'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">站点主标题</label>
                      <input
                        type="text"
                        value={config.title}
                        onChange={(e) => onChange({ ...config, title: e.target.value })}
                        className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">副标题</label>
                      <input
                        type="text"
                        value={config.subtitle}
                        onChange={(e) => onChange({ ...config, subtitle: e.target.value })}
                        className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-400 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">
                          ICP 备案号 (个人站长合规展示，将在极简页脚自动呈现)
                        </label>
                        <a
                          href="https://beian.miit.gov.cn/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                        >
                          工信部 ICP 备案查询 <ExternalLink size={11} />
                        </a>
                      </div>
                      <input
                        type="text"
                        placeholder="例如: 京ICP备12345678号-1 或 粤B2-20240001 (留空则页脚不展示)"
                        value={config.icp || ''}
                        onChange={(e) => onChange({ ...config, icp: e.target.value })}
                        className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-400 outline-none font-mono"
                      />
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        根据工信部《互联网信息服务管理办法》，个人站长可在上方输入合规 ICP 备案号，系统将在极简页脚中自动展示并附带工信部官方查询链接。
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Notice Alert */}
                {dataActionNotice && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                      dataActionNotice.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {dataActionNotice.type === 'success' ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <AlertCircle size={16} />
                      )}
                      <span>{dataActionNotice.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDataActionNotice(null)}
                      className="text-white/60 hover:text-white px-2 py-0.5 text-[11px]"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Import Strategy Option */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Database size={14} className="text-sky-400" />
                        导入与还原处理策略 (Import Strategy)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        选择导入 JSON 备份或浏览器 HTML 书签文件时如何与现有数据合并。
                      </p>
                    </div>
                    <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setImportStrategy('merge')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          importStrategy === 'merge'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        增量合并去重
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportStrategy('overwrite')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          importStrategy === 'overwrite'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        完全覆盖替换
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg">
                    {importStrategy === 'merge'
                      ? '💡 增量合并模式：保留现有分组，仅将备份文件中的新书签追加到对应分组，遇到重复网址自动跳过，保障已有数据安全。'
                      : '⚠️ 完全覆盖模式：将用文件中的书签与分组完全取代当前所有分类与网址。'}
                  </p>
                </div>

                {/* Export Cards */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      数据一键导出与备份 (Export Center)
                    </h4>
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                      🔒 需管理员权限 (admin)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* JSON Export */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sky-400">
                        <FileJson size={18} />
                        <h5 className="text-xs font-bold text-white">一键备份所有配置 (JSON)</h5>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        包含全部分类、多级分组、书签网址、搜索引擎以及主题外观的完整快照，适合全量备份与跨机迁移。
                      </p>
                      <button
                        type="button"
                        onClick={() => handleTriggerExport('json')}
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Download size={14} /> 导出 JSON 完整备份
                      </button>
                    </div>

                    {/* HTML Bookmark Export */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Bookmark size={18} />
                        <h5 className="text-xs font-bold text-white">导出浏览器书签 (HTML)</h5>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        标准 Netscape Bookmark HTML 格式，导出后可直接导入 Chrome、Edge、Firefox 或 Safari 浏览器收藏夹。
                      </p>
                      <button
                        type="button"
                        onClick={() => handleTriggerExport('html')}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Download size={14} /> 导出 HTML 书签文件
                      </button>
                    </div>
                  </div>

                  {/* Security & Env Notice */}
                  <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <span>🛡️ 数据导出安全权限说明</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      为防止未授权访客下载您的全量书签与配置数据，导出操作已受到凭证保护。默认账号为 <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">admin</code>，初始密码为 <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">123456</code>。
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      <strong>如何自定义凭据：</strong>您可在环境变量文件（如 <code className="text-sky-300 bg-black/40 px-1 py-0.5 rounded font-mono">.env</code>）中配置 <code className="text-sky-300 bg-black/40 px-1 py-0.5 rounded font-mono">VITE_EXPORT_ADMIN_USER</code> 与 <code className="text-sky-300 bg-black/40 px-1 py-0.5 rounded font-mono">VITE_EXPORT_ADMIN_PASS</code>，账号密码不会在前端代码中明文显示。
                    </p>
                  </div>
                </div>

                {/* Import Cards */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 px-1">
                    数据一键还原与导入 (Import & Restore)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* JSON Import */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Upload size={18} />
                        <h5 className="text-xs font-bold text-white">从 JSON 文件还原数据</h5>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        支持导入之前导出的 JSON 配置文件，支持按上方策略进行增量合并或完全覆盖。
                      </p>
                      <label className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-white/15">
                        <Upload size={14} /> 选择本地 JSON 文件还原
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleJsonImport}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* HTML Bookmark Import */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <FileCode size={18} />
                        <h5 className="text-xs font-bold text-white">从浏览器 HTML 书签导入</h5>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        支持 Chrome、Edge、Firefox 导出的书签 HTML，自动解析文件夹层级结构并批量创建网址。
                      </p>
                      <label className="w-full py-2.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-100 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500/30">
                        <Bookmark size={14} /> 选择浏览器 HTML 书签文件
                        <input
                          type="file"
                          accept=".html,.htm"
                          onChange={handleHtmlImport}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Dangerous Operations Area */}
                <div>
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-1.5">
                    <ShieldAlert size={14} />
                    危险数据管理与重置 (带二次确认防护)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Clear All Bookmarks */}
                    <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-2.5">
                      <div>
                        <h5 className="text-xs font-bold text-rose-300">一键清空所有存储数据</h5>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          清空所有自定义书签与分类分组，保留您的搜索引擎与主题外观配置。
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerClearBookmarks}
                        className="w-full py-2 bg-rose-600/40 hover:bg-rose-600 text-rose-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-rose-500/40 flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        一键清空所有书签
                      </button>
                    </div>

                    {/* Restore Factory Defaults */}
                    <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-2.5">
                      <div>
                        <h5 className="text-xs font-bold text-rose-300">一键恢复出厂初始状态</h5>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          彻底清除本地存储，重置为六零导航初始推荐书签、搜索引擎与默认主题。
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerRestoreFactory}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw size={13} />
                        一键恢复出厂值
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Secondary Confirmation Modal for Destructive Actions */}
          <AnimatePresence>
            {confirmModal && confirmModal.isOpen && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center">
                    <ShieldAlert size={26} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white">{confirmModal.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.message}</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setConfirmModal(null)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      取消返回
                    </button>
                    <button
                      type="button"
                      onClick={confirmModal.action}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      {confirmModal.confirmText}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Export Authentication Modal */}
          <ExportAuthModal
            isOpen={authModalOpen}
            onClose={() => {
              setAuthModalOpen(false);
              setPendingExportType(null);
            }}
            onSuccess={handleAuthSuccess}
            actionTitle={pendingExportType === 'json' ? '导出 JSON 完整备份' : '导出 HTML 书签文件'}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* =========================================================================
   Subcomponent: Tab Button
   ========================================================================= */

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
        active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
          : 'text-slate-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          {badge}
        </span>
      )}
    </button>
  );
}
