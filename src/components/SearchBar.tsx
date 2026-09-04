import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Globe, ExternalLink, ArrowRight } from 'lucide-react';
import { SearchEngine, NavItem, ThemeConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Favicon } from './Favicon';
import { getEngineIcon } from '../lib/searchEngines';

interface SearchBarProps {
  engines: SearchEngine[];
  allLinks: NavItem[];
  theme: ThemeConfig;
  onSearch: (engine: SearchEngine, query: string) => void;
  textClass?: string;
  subtextClass?: string;
  isDarkMode?: boolean;
}

export function SearchBar({
  engines,
  allLinks,
  theme,
  onSearch,
  textClass = 'text-white',
  subtextClass = 'text-white/70',
  isDarkMode = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [currentEngineId, setCurrentEngineId] = useState(engines[0]?.id || 'google');
  const [showDropdown, setShowDropdown] = useState(false);
  const [engineFilter, setEngineFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentEngine =
    engines.find((e) => e.id === currentEngineId || (e.value && e.value === currentEngineId)) ||
    engines[0] || {
      id: 'bing',
      name: '必应',
      url: 'https://www.bing.com/search?q=',
      placeholder: '必应搜索或输入网址...',
    };

  // Instant bookmark matches
  const matchedBookmarks = query.trim()
    ? allLinks
        .filter(
          (item) =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.url.toLowerCase().includes(query.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      // Cycle to next engine
      const currentIndex = engines.findIndex(
        (eng) => eng.id === currentEngine.id || eng.value === currentEngine.value
      );
      const nextIndex = (currentIndex + 1) % engines.length;
      setCurrentEngineId(engines[nextIndex].id || engines[nextIndex].value || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < matchedBookmarks.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setQuery('');
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && matchedBookmarks[selectedIndex]) {
      window.open(matchedBookmarks[selectedIndex].url, theme.openInNewTab ? '_blank' : '_self');
      setQuery('');
      setSelectedIndex(-1);
      return;
    }

    if (query.trim()) {
      onSearch(currentEngine, query.trim());
    }
  };

  const openBookmark = (item: NavItem) => {
    window.open(item.url, theme.openInNewTab ? '_blank' : '_self');
    setQuery('');
    setSelectedIndex(-1);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('#search-engine-selector')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEngines = engineFilter.trim()
    ? engines.filter(
        (e) =>
          e.name.toLowerCase().includes(engineFilter.toLowerCase()) ||
          (e.shortcut && e.shortcut.toLowerCase().includes(engineFilter.toLowerCase()))
      )
    : engines;

  return (
    <div className="relative w-full max-w-3xl mx-auto mb-10 z-30">
      {/* Search Engine Quick Tab Bar */}
      <div className="flex items-center justify-start sm:justify-center gap-1.5 mb-3 overflow-x-auto py-1.5 px-2 scrollbar-none max-w-full">
        {engines.map((eng) => {
          const isActive =
            eng.id === currentEngine.id || (eng.value && eng.value === currentEngine.value);
          return (
            <button
              key={eng.id || eng.value}
              type="button"
              onClick={() => {
                setCurrentEngineId(eng.id || eng.value || '');
                inputRef.current?.focus();
              }}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-200 shrink-0 flex items-center gap-1.5 select-none ${
                isActive
                  ? isDarkMode
                    ? 'bg-white/25 text-white shadow-sm border border-white/30 backdrop-blur-md font-bold'
                    : 'bg-white text-slate-900 shadow-md border border-slate-300/80 font-bold'
                  : isDarkMode
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-black/5'
              }`}
            >
              <span className="w-4 h-4 flex items-center justify-center shrink-0">
                {getEngineIcon(eng)}
              </span>
              <span>{eng.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Search Input Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: isDarkMode
            ? `rgba(15, 23, 42, ${typeof theme?.opacity === 'number' ? theme.opacity : 0.85})`
            : `rgba(255, 255, 255, ${typeof theme?.opacity === 'number' ? theme.opacity : 0.85})`,
          backdropFilter: `blur(${typeof theme?.blur === 'number' ? theme.blur : 12}px)`,
          WebkitBackdropFilter: `blur(${typeof theme?.blur === 'number' ? theme.blur : 12}px)`,
        }}
        className={`relative flex items-center rounded-full px-5 py-3.5 shadow-xl border border-transparent transition-all duration-300 ${
          isDarkMode
            ? 'shadow-black/20'
            : 'shadow-slate-200/60'
        } ${matchedBookmarks.length > 0 ? 'rounded-b-none' : ''}`}
      >
        {/* Engine Switcher Trigger */}
        <div id="search-engine-selector" className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-2 pr-3.5 border-r hover:opacity-80 transition-opacity select-none cursor-pointer ${
              isDarkMode ? 'border-white/20' : 'border-slate-300'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              {getEngineIcon(currentEngine)}
            </div>
            <span className={`text-sm font-semibold tracking-wide truncate max-w-[80px] sm:max-w-none ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {currentEngine.name}
            </span>
            <ChevronDown
              size={14}
              className={`opacity-70 transition-transform ${
                isDarkMode ? 'text-white' : 'text-slate-700'
              } ${showDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Engine Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full left-0 mt-3.5 w-64 backdrop-blur-2xl rounded-2xl overflow-hidden border shadow-2xl z-50 py-2 ${
                  isDarkMode
                    ? 'bg-slate-950/95 border-white/15 text-white'
                    : 'bg-white/95 border-slate-200 text-slate-800'
                }`}
              >
                <div className={`px-3.5 pb-2 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <div className={`flex items-center justify-between text-[11px] font-medium mb-1.5 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <span>选择搜索引擎</span>
                    <span className="text-[10px] opacity-75">按 Tab 快速轮换</span>
                  </div>
                  <input
                    type="text"
                    placeholder="过滤搜索引擎..."
                    value={engineFilter}
                    onChange={(e) => setEngineFilter(e.target.value)}
                    className={`w-full rounded-lg px-2.5 py-1 text-xs outline-none focus:border-sky-400 border ${
                      isDarkMode
                        ? 'bg-white/10 border-white/10 text-white placeholder:text-slate-500'
                        : 'bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                    autoFocus
                  />
                </div>

                <div className="max-h-80 overflow-y-auto scrollbar-thin py-1">
                  {filteredEngines.map((engine) => {
                    const isSelected =
                      currentEngine.id === engine.id ||
                      (engine.value && currentEngine.value === engine.value);
                    return (
                      <button
                        key={engine.id || engine.value}
                        type="button"
                        onClick={() => {
                          setCurrentEngineId(engine.id || engine.value || '');
                          setShowDropdown(false);
                          setEngineFilter('');
                          inputRef.current?.focus();
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-sky-500/20 text-sky-500 font-bold border-l-2 border-sky-500'
                            : isDarkMode
                            ? 'text-slate-200 hover:bg-white/10'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-4 h-4 flex items-center justify-center shrink-0">
                            {getEngineIcon(engine)}
                          </div>
                          <span className="truncate">{engine.name}</span>
                        </div>
                        {engine.shortcut && (
                          <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                            isDarkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {engine.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            currentEngine.placeholder ||
            (currentEngine.value === 'local' || currentEngine.id === 'local'
              ? '在本地书签与导航中检索...'
              : `在 ${currentEngine.name} 中搜索或输入网址...`)
          }
          className={`flex-1 bg-transparent border-none outline-none px-4 text-base md:text-lg ${
            isDarkMode
              ? 'text-white placeholder:text-white/50'
              : 'text-slate-900 placeholder:text-slate-400 font-medium'
          }`}
          autoComplete="off"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            className={`p-1 rounded-full transition-colors mr-2 ${
              isDarkMode
                ? 'text-white/50 hover:text-white hover:bg-white/10'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <X size={16} />
          </button>
        )}

        {/* Submit Search Button */}
        <button
          type="submit"
          className={`p-2.5 rounded-full shadow-md transition-transform active:scale-95 ${
            isDarkMode
              ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
              : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
          }`}
          title="立即搜索"
        >
          <Search size={18} />
        </button>
      </form>

      {/* Instant Bookmark Suggestions Popup */}
      <AnimatePresence>
        {matchedBookmarks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`absolute left-0 right-0 backdrop-blur-2xl rounded-b-2xl border border-t-0 shadow-2xl overflow-hidden z-40 py-2 ${
              isDarkMode
                ? 'bg-slate-950/95 border-white/20 text-white'
                : 'bg-white/95 border-slate-200 text-slate-900'
            }`}
          >
            <div className={`px-4 py-1.5 flex items-center justify-between text-[11px] border-b ${
              isDarkMode ? 'text-slate-400 border-white/10' : 'text-slate-500 border-slate-200'
            }`}>
              <span>发现匹配的书签导航 (按上下键选择，回车打开)</span>
              <span>{matchedBookmarks.length} 个结果</span>
            </div>
            {matchedBookmarks.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openBookmark(item)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                  selectedIndex === idx
                    ? 'bg-sky-500/20 text-sky-500 font-medium'
                    : isDarkMode
                    ? 'text-slate-200 hover:bg-white/10'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <Favicon
                      url={item.url}
                      name={item.name}
                      icon={item.icon}
                      size={16}
                      preferredSource={theme.iconSource || 'favicon_im'}
                      roundedClassName=""
                    />
                  </div>
                  <div className="truncate">
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.description && (
                      <span className={`text-xs ml-2 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        · {item.description}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs shrink-0 ml-2 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <span className="truncate max-w-[120px] opacity-60">
                    {(() => {
                      try {
                        return new URL(item.url).hostname;
                      } catch {
                        return item.url;
                      }
                    })()}
                  </span>
                  <ArrowRight size={13} />
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
