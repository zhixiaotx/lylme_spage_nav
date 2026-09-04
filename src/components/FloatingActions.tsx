import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, Sun, Moon, Settings, Wallpaper } from 'lucide-react';

interface FloatingActionsProps {
  isDarkMode: boolean;
  onToggleThemeMode: () => void;
  onOpenSettings: () => void;
  onOpenWallpaper?: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  isDarkMode,
  onToggleThemeMode,
  onOpenSettings,
  onOpenWallpaper,
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

  return (
    <div
      id="floating-actions-container"
      className="fixed right-3.5 bottom-4 sm:right-6 sm:bottom-6 z-50 flex flex-col items-end gap-2.5 sm:gap-3.5 select-none pointer-events-none pb-[env(safe-area-inset-bottom,0px)] pr-[env(safe-area-inset-right,0px)]"
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
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={scrollToTop}
              aria-label="一键返回顶部"
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-xl transition-all duration-300 ${
                isDarkMode
                  ? 'bg-slate-900/85 hover:bg-slate-800 text-white border-white/20 shadow-black/40'
                  : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200 shadow-slate-300/50'
              }`}
            >
              <ArrowUp size={19} className="stroke-[2.5]" />
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
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={onToggleThemeMode}
          aria-label={isDarkMode ? '切换为白天明亮模式' : '切换为黑夜深色模式'}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-xl transition-all duration-300 ${
            isDarkMode
              ? 'bg-slate-900/85 hover:bg-slate-800 text-amber-300 border-white/20 shadow-black/40 ring-1 ring-amber-400/20'
              : 'bg-white/95 hover:bg-white text-sky-600 border-slate-200 shadow-slate-300/50 ring-1 ring-sky-500/10'
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
                <Sun size={19} />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon size={19} />
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
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenWallpaper}
            aria-label="打开壁纸中心"
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-xl transition-all duration-300 ${
              isDarkMode
                ? 'bg-slate-900/85 hover:bg-slate-800 text-sky-400 border-white/20 shadow-black/40'
                : 'bg-white/95 hover:bg-white text-indigo-600 border-slate-200 shadow-slate-300/50'
            }`}
          >
            <Wallpaper size={19} />
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
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={onOpenSettings}
          aria-label="打开系统设置"
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg border backdrop-blur-xl transition-all duration-300 ${
            isDarkMode
              ? 'bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border-white/20 shadow-black/40'
              : 'bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 border-slate-200 shadow-slate-300/50'
          }`}
        >
          <Settings size={19} />
        </motion.button>
      </div>
    </div>
  );
};
