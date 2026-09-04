import { useState, useEffect } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ThemeConfig } from '../types';

interface ClockWidgetProps {
  theme: ThemeConfig;
  textClass?: string;
  subtextClass?: string;
}

export function ClockWidget({ theme, textClass = 'text-white', subtextClass = 'text-white/70' }: ClockWidgetProps) {
  const [time, setTime] = useState(new Date());
  const [hitokoto, setHitokoto] = useState(theme.customHitokoto || '心之所向，素履以往；生如逆旅，一苇以航。');
  const [hitokotoFrom, setHitokotoFrom] = useState('');
  const [loadingHitokoto, setLoadingHitokoto] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchHitokoto = async () => {
    setLoadingHitokoto(true);
    try {
      const res = await fetch('https://v1.hitokoto.cn/?encode=json');
      if (res.ok) {
        const data = await res.json();
        setHitokoto(data.hitokoto);
        setHitokotoFrom(data.from_who ? `${data.from_who} · 《${data.from}》` : `《${data.from}》`);
      }
    } catch (e) {
      // Fallback
    } finally {
      setLoadingHitokoto(false);
    }
  };

  useEffect(() => {
    if (theme.showHitokoto && !theme.customHitokoto) {
      fetchHitokoto();
    }
  }, [theme.showHitokoto, theme.customHitokoto]);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const dateString = time.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-8 select-none"
    >
      {theme.showClock && (
        <div className="flex flex-col items-center">
          <div className="flex items-baseline justify-center tracking-tight font-black">
            <span className={`text-6xl md:text-7xl font-mono ${textClass} drop-shadow-sm`}>
              {hours}:{minutes}
            </span>
            <span className={`text-xl md:text-2xl font-mono ml-2 font-normal opacity-60 ${textClass}`}>
              :{seconds}
            </span>
          </div>
          <p className={`text-sm md:text-base font-medium mt-2 tracking-wide ${subtextClass}`}>
            {dateString}
          </p>
        </div>
      )}

      {theme.showHitokoto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 max-w-xl mx-auto px-4 py-2 flex items-center justify-center gap-2 group cursor-pointer"
          onClick={fetchHitokoto}
          title="点击换一句"
        >
          <Sparkles size={14} className="opacity-50 group-hover:opacity-100 group-hover:text-amber-400 transition-colors shrink-0" />
          <p className={`text-xs md:text-sm italic tracking-wide truncate ${subtextClass} group-hover:opacity-100 transition-opacity`}>
            “{hitokoto}” {hitokotoFrom && <span className="opacity-60 text-[11px] not-italic ml-1">— {hitokotoFrom}</span>}
          </p>
          <RefreshCw
            size={12}
            className={`opacity-0 group-hover:opacity-70 transition-opacity shrink-0 ${loadingHitokoto ? 'animate-spin opacity-100' : ''}`}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
