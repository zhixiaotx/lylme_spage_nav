import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Sparkles, RefreshCw } from 'lucide-react';

interface GlobalLoadingProps {
  isLoading: boolean;
  title?: string;
  subtitle?: string;
  message?: string;
  onSkip?: () => void;
}

export const GlobalLoading: React.FC<GlobalLoadingProps> = ({
  isLoading,
  title = '六零导航页',
  subtitle = 'LyLme Spage Nav',
  message = '正在从 Cloudflare 边缘接口获取最新配置...',
  onSkip,
}) => {
  const [showSkipButton, setShowSkipButton] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSkipButton(false);
      return;
    }
    // If loading exceeds 2.5s, show friendly skip button so user is never stuck
    const timer = setTimeout(() => {
      setShowSkipButton(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="global-loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl text-white select-none overflow-hidden"
          style={{ willChange: 'opacity' }}
        >
          {/* Ambient Glow Background Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-blue-600/20 via-indigo-500/15 to-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col items-center max-w-sm px-6 text-center space-y-5">
            {/* Animated Logo / Icon Container */}
            <div className="relative flex items-center justify-center w-20 h-20">
              {/* Outer Pulsing Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.12, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-400 blur-md opacity-60"
              />

              {/* Center Icon Box */}
              <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-white/20 shadow-2xl overflow-hidden">
                <Compass className="w-8 h-8 text-sky-400 animate-[spin_8s_linear_infinite]" />
                <Sparkles className="absolute top-2 right-2 w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-wide text-white drop-shadow-sm">
                {title}
              </h1>
              <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">
                {subtitle}
              </p>
            </div>

            {/* Shimmer Progress Bar */}
            <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden relative shadow-inner">
              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'easeInOut',
                }}
                className="w-full h-full bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 rounded-full"
              />
            </div>

            {/* Loading Tip */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-300 font-medium">
              <RefreshCw size={13} className="animate-spin text-sky-400 shrink-0" />
              <span>{message}</span>
            </div>

            {/* Graceful Fallback Skip Option */}
            {showSkipButton && onSkip && (
              <motion.button
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                type="button"
                onClick={onSkip}
                className="text-xs text-slate-400 hover:text-white underline underline-offset-4 decoration-white/20 transition-colors pt-2 cursor-pointer"
              >
                网络响应较慢？点击直接进入本地离线页面
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
