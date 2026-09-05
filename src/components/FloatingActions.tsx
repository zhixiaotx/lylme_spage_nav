import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, Sun, Moon, Settings, Wallpaper, Database, Users } from 'lucide-react';
import { ThemeConfig } from '../types';

interface FloatingActionsProps {
  isDarkMode: boolean;
  theme: ThemeConfig;
  onToggleThemeMode: () => void;
  onOpenSettings: () => void;
  onOpenWallpaper?: () => void;
  onOpenBackup?: () => void;
  onOpenAccounts?: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  isDarkMode,
  theme,
  onToggleThemeMode,
  onOpenSettings,
  onOpenWallpaper,
  onOpenBackup,
  onOpenAccounts,
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 160);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const opacityVal = typeof theme?.opacity === 'number' ? theme.opacity : 0.85;
  const blurVal = typeof theme?.blur === 'number' ? theme.blur : 12;

  const floatingButtonStyle: React.CSSProperties = {
    backgroundColor: isDarkMode
      ? `rgba(15, 23, 42, ${opacityVal})`
      : `rgba(255, 255, 255, ${opacityVal})`,
    backdropFilter: `blur(${blurVal}px)`,
    WebkitBackdropFilter: `blur(${blurVal}px)`,
  };

  return (
    <div
      id="floating-actions-container"
      className="fixed right-3.5 bottom-5 sm:right-6 sm:bottom-6 z-50 flex flex-col items-end gap-3.5 sm:gap-4 select-none pointer-events-none pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pr-[env(safe-area-inset-right,0px)]"
    >
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <div className="group relative flex items-center pointer-events-auto">
            <span className="hidden sm:block absolute right-full mr-2.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              返回顶部
            </span>
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 10 }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              onClick={scrollToTop}
              aria-label="一键返回顶部"
              style={floatingButtonStyle}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border-transparent ${
                isDarkMode
                  ? 'text-white/90 hover:text-white hover:bg-slate-800/80'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 shadow-slate-300/50'
              }`}
            >
              <ArrowUp size={20} className="stroke-[2.5]" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Day / Night Mode Toggle Button */}
      <div className="group relative flex items-center pointer-events-auto">
        <span className="hidden sm:block absolute right-full mr-2.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {isDarkMode ? '切换白天模式' : '切换黑夜模式'}
        </span>
        <motion.button
          type="button"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          onClick={onToggleThemeMode}
          aria-label={isDarkMode ? '切换为白天明亮模式' : '切换为黑夜深色模式'}
          style={floatingButtonStyle}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border-transparent ${
            isDarkMode
              ? 'text-amber-300 hover:text-amber-200 hover:bg-slate-800/80'
              : 'text-sky-600 hover:text-sky-800 hover:bg-slate-100/80 shadow-slate-300/50'
          }`}
        >
          <AnimatePresence mode="wait">
            {isDarkMode ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun size={20} />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Quick Wallpaper Studio Button */}
      {onOpenWallpaper && (
        <div className="group relative flex items-center pointer-events-auto">
          <span className="hidden sm:block absolute right-full mr-2.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            壁纸中心
          </span>
          <motion.button
            type="button"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            onClick={onOpenWallpaper}
            aria-label="打开壁纸中心"
            style={floatingButtonStyle}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border-transparent ${
              isDarkMode
                ? 'text-sky-400 hover:text-sky-300 hover:bg-slate-800/80'
                : 'text-indigo-600 hover:text-indigo-800 hover:bg-slate-100/80 shadow-slate-300/50'
            }`}
          >
            <Wallpaper size={20} />
          </motion.button>
        </div>
      )}

      {/* Quick Data Backup & Import/Export Button */}
      {onOpenBackup && (
        <div className="group relative flex items-center pointer-events-auto">
          <span className="hidden sm:block absolute right-full mr-2.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            数据管理 (HTML/JSON导入导出)
          </span>
          <motion.button
            type="button"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            onClick={onOpenBackup}
            aria-label="打开数据管理中心"
            style={floatingButtonStyle}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border-transparent ${
              isDarkMode
                ? 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80'
                : 'text-emerald-600 hover:text-emerald-800 hover:bg-slate-100/80 shadow-slate-300/50'
            }`}
          >
            <Database size={20} />
          </motion.button>
        </div>
      )}

      {/* Quick Account & Admin Management Button */}
      {onOpenAccounts && (
        <div className="group relative flex items-center pointer-events-auto">
          <span className="hidden sm:block absolute right-full mr-2.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            多账户与后台管理
          </span>
          <motion.button
            type="button"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            onClick={onOpenAccounts}
            aria-label="打开账户与后台管理"
            style={floatingButtonStyle}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border-transparent ${
              isDarkMode
                ? 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/80'
                : 'text-indigo-600 hover:text-indigo-800 hover:bg-slate-100/80 shadow-slate-300/50'
            }`}
          >
            <Users size={20} />
          </motion.button>
        </div>
      )}

      {/* Quick Settings Button */}
      <div className="group relative flex items-center pointer-events-auto">
        <span className="hidden sm:block absolute right-full mr-2.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 shadow-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          个性化设置
        </span>
        <motion.button
          type="button"
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          onClick={onOpenSettings}
          aria-label="打开系统设置"
          style={floatingButtonStyle}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border-transparent ${
            isDarkMode
              ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 shadow-slate-300/50'
          }`}
        >
          <Settings size={20} />
        </motion.button>
      </div>
    </div>
  );
};
