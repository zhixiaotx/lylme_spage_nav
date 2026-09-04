import { useState, useEffect, useRef, useMemo } from 'react';
import { AppConfig, NavItem, NavGroup, SearchEngine } from './types';
import { loadConfig, saveConfig, syncPull, syncPush } from './lib/storage';
import { PALETTE_THEMES } from './constants';
import { ClockWidget } from './components/ClockWidget';
import { SearchBar } from './components/SearchBar';
import { LinkGrid } from './components/LinkGrid';
import { LinkEditorModal } from './components/LinkEditorModal';
import { SettingsPanel } from './components/SettingsPanel';
import { FloatingActions } from './components/FloatingActions';
import {
  Settings,
  Edit3,
  Check,
  Cloud,
  CloudCheck,
  CloudAlert,
  Loader2,
  Compass,
  Plus,
  Database,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [config, setConfig] = useState<AppConfig>(loadConfig);
  const [editMode, setEditMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    'theme' | 'wallpaper' | 'sync' | 'search' | 'serverless' | 'backup'
  >('theme');

  const handleOpenSettings = (tab?: 'theme' | 'wallpaper' | 'sync' | 'search' | 'serverless' | 'backup') => {
    setSettingsTab(tab || 'theme');
    setSettingsOpen(true);
  };

  // Link / Group editor modal state
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'link' | 'group'>('link');
  const [editingItem, setEditingItem] = useState<{ item?: NavItem; groupId?: string } | null>(null);
  const [editingGroup, setEditingGroup] = useState<NavGroup | null>(null);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<{
    status: 'idle' | 'syncing' | 'success' | 'error';
    message?: string;
    lastSyncedAt?: number;
  }>({
    status: 'idle',
    message: config.sync.lastMessage,
    lastSyncedAt: config.sync.lastSyncedAt,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Current theme meta
  const currentThemeMeta = PALETTE_THEMES[config.theme.preset] || PALETTE_THEMES['palette-glass'];

  // Flatten all bookmarks for search autocomplete
  const allBookmarks = useMemo(() => {
    return config.groups.flatMap((g) => g.items);
  }, [config.groups]);

  // Initial Sync from Cloud on mount if provider is configured
  useEffect(() => {
    if (config.sync.provider !== 'none') {
      const fetchRemote = async () => {
        setSyncStatus({ status: 'syncing', message: '正在从云端拉取最新配置...' });
        const res = await syncPull(config);
        if (res.success && res.config) {
          setConfig(res.config);
          setSyncStatus({
            status: 'success',
            message: '云端同步成功',
            lastSyncedAt: Date.now(),
          });
        } else {
          setSyncStatus({
            status: 'error',
            message: res.message || '从云端同步失败',
            lastSyncedAt: config.sync.lastSyncedAt,
          });
        }
      };
      fetchRemote();
    }
  }, []);

  // Periodic background sync if enabled
  useEffect(() => {
    if (config.sync.provider === 'none' || !config.sync.syncIntervalMinutes) return;
    const intervalMs = config.sync.syncIntervalMinutes * 60 * 1000;
    const interval = setInterval(async () => {
      if (config.sync.provider !== 'none') {
        const res = await syncPull(config);
        if (res.success && res.config) {
          setConfig(res.config);
          setSyncStatus({
            status: 'success',
            message: '自动定时同步成功',
            lastSyncedAt: Date.now(),
          });
        }
      }
    }, intervalMs);
    return () => clearInterval(interval);
  }, [config.sync.provider, config.sync.syncIntervalMinutes]);

  // Handle local state update and trigger debounced sync
  const handleConfigUpdate = (newConfig: AppConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);

    // If auto sync is on and provider selected, push to cloud
    if (newConfig.sync.autoSync && newConfig.sync.provider !== 'none') {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setSyncStatus({ status: 'syncing', message: '正在同步到云端...' });
        const res = await syncPush(newConfig);
        if (res.success) {
          setSyncStatus({
            status: 'success',
            message: res.message,
            lastSyncedAt: Date.now(),
          });
        } else {
          setSyncStatus({
            status: 'error',
            message: res.message,
            lastSyncedAt: Date.now(),
          });
        }
      }, 1200); // 1.2s debounce
    }
  };

  // Manual trigger sync from UI
  const handleManualSync = async () => {
    if (config.sync.provider === 'none') {
      setSettingsOpen(true);
      return;
    }
    setSyncStatus({ status: 'syncing', message: '正在同步...' });
    const res = await syncPull(config);
    if (res.success && res.config) {
      setConfig(res.config);
      setSyncStatus({
        status: 'success',
        message: res.message,
        lastSyncedAt: Date.now(),
      });
    } else {
      setSyncStatus({
        status: 'error',
        message: res.message,
      });
    }
  };

  // Determine dark mode state
  const isDark = Boolean(
    config.theme.isDarkMode !== undefined
      ? config.theme.isDarkMode
      : config.theme.preset === 'palette-night' ||
        config.theme.preset === 'palette-dracula' ||
        config.theme.preset === 'lylme-dark'
  );

  // Synchronize 'dark' class, body background, and meta theme-color on <html> document element in real time
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    let metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }

    let themeBg = '#0b0f19';
    if (isDark) {
      themeBg = '#09090b';
    } else if (config.theme.preset === 'lylme-default') {
      themeBg = '#eef2f6';
    } else if (config.theme.preset === 'lylme-baisuTwo') {
      themeBg = '#fdfbfb';
    } else if (config.theme.preset === 'lylme-baisu' || config.theme.preset === 'palette-pure') {
      themeBg = '#f8fafc';
    } else {
      themeBg = '#0f172a';
    }

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }

    metaThemeColor.content = themeBg;
    root.style.backgroundColor = themeBg;
    body.style.backgroundColor = themeBg;
  }, [isDark, config.theme.preset]);

  const handleToggleThemeMode = () => {
    const nextIsDark = !isDark;
    let nextPreset = config.theme.preset;
    if (nextIsDark) {
      if (
        nextPreset === 'lylme-default' ||
        nextPreset === 'lylme-baisu' ||
        nextPreset === 'palette-light' ||
        nextPreset === 'palette-paper' ||
        nextPreset === 'palette-pure'
      ) {
        nextPreset = 'palette-night';
      }
    } else {
      if (
        nextPreset === 'palette-night' ||
        nextPreset === 'palette-dracula' ||
        nextPreset === 'lylme-dark'
      ) {
        nextPreset = 'palette-glass';
      }
    }

    const applyThemeChange = () => {
      const updatedConfig: AppConfig = {
        ...config,
        theme: {
          ...config.theme,
          isDarkMode: nextIsDark,
          preset: nextPreset,
        },
      };
      handleConfigUpdate(updatedConfig);
    };

    // Use modern browser View Transitions API if supported (smooth circle/fade cross-dissolve)
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        applyThemeChange();
      });
    } else {
      applyThemeChange();
    }
  };

  // Search submit handler
  const handleSearch = (engine: SearchEngine, query: string) => {
    // If local search engine or empty URL
    if (engine.value === 'local' || engine.id === 'local' || !engine.url) {
      const matches = allBookmarks.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.url.toLowerCase().includes(query.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
      );
      if (matches.length > 0) {
        window.open(matches[0].url, config.theme.openInNewTab ? '_blank' : '_self');
      } else {
        alert(`在本地书签与导航中未找到包含 "${query}" 的网址`);
      }
      return;
    }

    let searchUrl: string;
    if (engine.url.includes('%s')) {
      searchUrl = engine.url.replace('%s', encodeURIComponent(query));
    } else {
      searchUrl = `${engine.url}${encodeURIComponent(query)}`;
    }
    window.open(searchUrl, config.theme.openInNewTab ? '_blank' : '_self');
  };

  /* =========================================================================
     Bookmark & Group Operations
     ========================================================================= */

  const handleOpenAddLink = (groupId: string) => {
    setEditorMode('link');
    setEditingItem({ groupId });
    setEditorModalOpen(true);
  };

  const handleOpenEditLink = (item: NavItem, groupId: string) => {
    setEditorMode('link');
    setEditingItem({ item, groupId });
    setEditorModalOpen(true);
  };

  const handleDeleteLink = (itemId: string, groupId: string) => {
    const updatedGroups = config.groups.map((g) => {
      if (g.id === groupId) {
        return { ...g, items: g.items.filter((it) => it.id !== itemId) };
      }
      return g;
    });
    handleConfigUpdate({ ...config, groups: updatedGroups });
  };

  const handleReorderLinks = (groupId: string, newItems: NavItem[]) => {
    const updatedGroups = config.groups.map((g) => {
      if (g.id === groupId) {
        return { ...g, items: newItems };
      }
      return g;
    });
    handleConfigUpdate({ ...config, groups: updatedGroups });
  };

  const handleSaveLink = (item: NavItem, groupId: string) => {
    let found = false;
    const updatedGroups = config.groups.map((g) => {
      if (g.id === groupId) {
        found = true;
        const exists = g.items.some((it) => it.id === item.id);
        const newItems = exists
          ? g.items.map((it) => (it.id === item.id ? item : it))
          : [...g.items, item];
        return { ...g, items: newItems };
      }
      // If moved from another group
      return { ...g, items: g.items.filter((it) => it.id !== item.id) };
    });

    // If group wasn't found (fallback)
    if (!found && updatedGroups[0]) {
      updatedGroups[0].items.push(item);
    }

    handleConfigUpdate({ ...config, groups: updatedGroups });
  };

  const handleOpenAddGroup = () => {
    setEditorMode('group');
    setEditingGroup(null);
    setEditorModalOpen(true);
  };

  const handleOpenEditGroup = (group: NavGroup) => {
    setEditorMode('group');
    setEditingGroup(group);
    setEditorModalOpen(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (config.groups.length <= 1) {
      alert('请至少保留一个导航分组');
      return;
    }
    if (confirm('确定删除该分组及其全部书签吗？')) {
      const updatedGroups = config.groups.filter((g) => g.id !== groupId);
      handleConfigUpdate({ ...config, groups: updatedGroups });
    }
  };

  const handleSaveGroup = (group: NavGroup) => {
    const exists = config.groups.some((g) => g.id === group.id);
    const updatedGroups = exists
      ? config.groups.map((g) => (g.id === group.id ? { ...g, name: group.name } : g))
      : [...config.groups, group];
    handleConfigUpdate({ ...config, groups: updatedGroups });
  };

  // Determine dynamic background styling
  const backgroundStyle = useMemo(() => {
    const { theme } = config;
    const wType = theme.wallpaperType || (theme.useBingWallpaper ? 'bing' : 'preset');

    // 1. Solid Color Mode
    if (wType === 'solid') {
      return {
        backgroundColor: theme.wallpaperSolidColor || theme.background || '#09090b',
      };
    }

    // 2. Gradient Color Mode
    if (wType === 'gradient') {
      return {
        background: theme.wallpaperGradient || currentThemeMeta.backgroundCss || 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
      };
    }

    // 3. Image Wallpaper Modes (Bing, Curated, Custom URL, or preset image)
    const fit = theme.wallpaperFit || 'cover';
    const bgUrl =
      wType === 'custom' && theme.wallpaperCustomUrl
        ? theme.wallpaperCustomUrl
        : theme.background;

    if (bgUrl && bgUrl.startsWith('http')) {
      return {
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: fit,
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: fit === 'repeat' ? 'repeat' : 'no-repeat',
      };
    }

    return {
      background: currentThemeMeta.backgroundCss || '#0f172a',
    };
  }, [config.theme, currentThemeMeta]);

  // Compute dark overlay mask and background blur
  const maskOpacity = config.theme.wallpaperMaskOpacity ?? Math.min(0.65, 1 - config.theme.opacity);
  const bgBlur = config.theme.wallpaperBlur ?? 0;

  return (
    <div className="min-h-screen relative flex flex-col transition-colors duration-700 font-sans">
      {/* Fixed Fullscreen Background Layer */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700 z-0"
        style={backgroundStyle}
      />

      {/* Dynamic Custom CSS injection */}
      {config.theme.customCss && (
        <style dangerouslySetInnerHTML={{ __html: config.theme.customCss }} />
      )}

      {/* Backdrop overlay layer for glass effect, wallpaper blur & readability */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-500 z-0"
        style={{
          backgroundColor:
            config.theme.preset === 'palette-pure' || config.theme.preset === 'lylme-baisu'
              ? 'transparent'
              : !isDark
              ? `rgba(15, 23, 42, ${Math.min(0.2, Math.max(0.05, maskOpacity * 0.3))})`
              : `rgba(0, 0, 0, ${maskOpacity})`,
          backdropFilter: bgBlur > 0 || config.theme.blur > 0 ? `blur(${bgBlur + config.theme.blur}px)` : undefined,
        }}
      />

      {/* App Header Bar */}
      <header className="relative z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-8 h-8 flex items-center justify-center">
            <Compass size={22} className={isDark ? 'text-white' : 'text-sky-600'} />
          </div>
          <div>
            <h1 className={`text-base font-extrabold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {config.title}
            </h1>
          </div>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cloud Sync Status Pill */}
          <button
            type="button"
            onClick={handleManualSync}
            className={`p-2 rounded-full transition-all duration-200 ${
              config.sync.provider === 'none'
                ? isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/5'
                : syncStatus.status === 'syncing'
                ? 'text-amber-500 hover:bg-amber-500/10'
                : syncStatus.status === 'error'
                ? 'text-rose-500 hover:bg-rose-500/10'
                : 'text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/10'
            }`}
            title={syncStatus.message || (config.sync.provider === 'none' ? '未开启云同步 (点击管理配置)' : '点击立即同步')}
          >
            {syncStatus.status === 'syncing' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : syncStatus.status === 'error' ? (
              <CloudAlert size={16} />
            ) : config.sync.provider !== 'none' ? (
              <CloudCheck size={16} />
            ) : (
              <Cloud size={16} />
            )}
          </button>

          {/* Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className={`p-2 rounded-full transition-all duration-200 ${
              editMode
                ? 'text-amber-500 bg-amber-500/15 hover:bg-amber-500/20'
                : isDark
                ? 'text-white/80 hover:text-white hover:bg-white/10'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-900/5'
            }`}
            title={editMode ? '退出管理模式' : '编辑书签与分组'}
          >
            {editMode ? <Check size={16} /> : <Edit3 size={16} />}
          </button>

          {/* Quick Data Management Button */}
          <button
            type="button"
            onClick={() => handleOpenSettings('backup')}
            className={`p-2 rounded-full transition-all duration-200 ${
              isDark
                ? 'text-emerald-400 hover:text-emerald-300 hover:bg-white/10'
                : 'text-emerald-600 hover:text-emerald-800 hover:bg-slate-900/5'
            }`}
            title="数据管理中心 (书签 HTML/JSON 导入与导出)"
          >
            <Database size={16} />
          </button>

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => handleOpenSettings('theme')}
            className={`p-2 rounded-full transition-all duration-200 ${
              isDark
                ? 'text-white/80 hover:text-white hover:bg-white/10'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-900/5'
            }`}
            title="个性化设置 (主题·同步·引擎)"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        {/* LyLme Spage Nav 原版个人主页 (Page 主题) 站长名片专区 */}
        {config.theme.preset === 'lylme-page' && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mb-8 text-center flex flex-col items-center bg-white/10 border border-white/20 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl"
          >
            <div className="relative group mb-3">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-sky-400 via-indigo-500 to-rose-400 shadow-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[9px] text-white">
                ✓
              </span>
            </div>

            <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{config.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                个人主页·发布页
              </span>
            </h2>

            <p className="text-xs text-slate-200 mt-1.5 max-w-md leading-relaxed">
              {config.description}
            </p>

            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/10 w-full justify-center text-xs text-slate-300">
              <span className="hover:text-sky-300 transition-colors cursor-default">
                🌐 个人独立空间
              </span>
              <span className="text-white/20">|</span>
              <span className="hover:text-sky-300 transition-colors cursor-default">
                ⚡ 简洁·高效·纯净
              </span>
              <span className="text-white/20">|</span>
              <span className="hover:text-sky-300 transition-colors cursor-default">
                🔗 快捷导航中心
              </span>
            </div>
          </motion.div>
        )}

        {/* Clock & Hitokoto Widget */}
        <ClockWidget
          theme={config.theme}
          textClass={isDark ? 'text-white' : 'text-slate-900'}
          subtextClass={isDark ? 'text-white/70' : 'text-slate-600'}
        />

        {/* Search Bar with Autocomplete & Multi-engine Selector */}
        <SearchBar
          engines={config.searchEngines}
          allLinks={allBookmarks}
          theme={config.theme}
          onSearch={handleSearch}
          textClass={isDark ? 'text-white' : 'text-slate-900'}
          subtextClass={isDark ? 'text-white/70' : 'text-slate-600'}
          isDarkMode={isDark}
        />

        {/* Navigation Bookmarks Grid / Tabs / Sidebar */}
        <LinkGrid
          groups={config.groups}
          theme={config.theme}
          editMode={editMode}
          isDarkMode={isDark}
          onEditLink={handleOpenEditLink}
          onDeleteLink={handleDeleteLink}
          onReorderLinks={handleReorderLinks}
          onAddLink={handleOpenAddLink}
          onAddGroup={handleOpenAddGroup}
          onEditGroup={handleOpenEditGroup}
          onDeleteGroup={handleDeleteGroup}
          cardBgClass={
            isDark
              ? currentThemeMeta.cardBgClass
              : 'bg-white/85 backdrop-blur-xl shadow-sm hover:shadow-md'
          }
          cardBorderClass="border-transparent"
          textClass={isDark ? currentThemeMeta.textClass : 'text-slate-900 font-bold'}
          subtextClass={isDark ? currentThemeMeta.subtextClass : 'text-slate-600'}
        />
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-20 w-full py-6 text-center select-none mt-auto">
        <div className={`max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs opacity-65 ${currentThemeMeta.textClass}`}>
          {/* 项目与开源信息 */}
          <span>
            <a
              href="https://github.com/zhixiaotx/lylme_spage_nav"
              target="_blank"
              rel="noreferrer"
              className="hover:underline font-medium inline-flex items-center gap-1.5"
            >
              <span>六零导航页 - LyLme Spage Nav</span>
              <span className="opacity-80 font-mono text-[11px]">(zhixiaotx/lylme_spage_nav)</span>
            </a>
          </span>

          {/* 可选 ICP 备案号 */}
          {config.icp && config.icp.trim() && (
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline tracking-wide"
            >
              {config.icp.trim()}
            </a>
          )}

          {/* 版本号 */}
          <span className="font-mono text-[11px] opacity-80">
            v{config.version || '2.2.0'}
          </span>
        </div>
      </footer>

      {/* Bookmark & Group Editor Modal */}
      <LinkEditorModal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        onSaveLink={handleSaveLink}
        onSaveGroup={handleSaveGroup}
        groups={config.groups}
        editingItem={editingItem}
        editingGroup={editingGroup}
        mode={editorMode}
      />

      {/* Comprehensive Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        onChange={handleConfigUpdate}
        onManualSync={handleManualSync}
        syncStatus={syncStatus}
        initialTab={settingsTab}
      />

      {/* Floating Actions: Back to top, Day/Night mode toggle, Settings trigger */}
      <FloatingActions
        isDarkMode={isDark}
        theme={config.theme}
        onToggleThemeMode={handleToggleThemeMode}
        onOpenSettings={() => handleOpenSettings('theme')}
        onOpenWallpaper={() => handleOpenSettings('wallpaper')}
        onOpenBackup={() => handleOpenSettings('backup')}
      />
    </div>
  );
}
