import React from 'react';
import { SearchEngine } from '../types';

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'local',
    value: 'local',
    name: '本站',
    group: 'local',
    url: '',
    icon: '🔍',
    placeholder: '在本地书签与导航中检索 (输入关键词或名称)...',
  },
  {
    id: 'bing',
    value: 'bing',
    name: '必应',
    group: 'general',
    url: 'https://www.bing.com/search?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M7 5v14l6-3.5V8.5L7 5zm6 3.5v7l6 3.5V8.5L13 8.5z" fill="#0089D6" />
      </svg>
    ),
    placeholder: '微软必应搜索或输入网址...',
    shortcut: 'b',
  },
  {
    id: 'baidu',
    value: 'baidu',
    name: '百度',
    group: 'general',
    url: 'https://www.baidu.com/s?wd=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.5 15c-.8 0-1.5-.7-1.5-1.5v-3c0-.8.7-1.5 1.5-1.5h3c.8 0 1.5.7 1.5 1.5v3c0 .8-.7 1.5-1.5 1.5h-3zm0-6c-.8 0-1.5-.7-1.5-1.5v-3c0-.8.7-1.5 1.5-1.5h3c.8 0 1.5.7 1.5 1.5v3c0 .8-.7 1.5-1.5 1.5h-3z"
          fill="#23B8E8"
        />
      </svg>
    ),
    placeholder: '百度一下，你就知道...',
    shortcut: 'bd',
  },
  {
    id: 'google',
    value: 'google',
    name: '谷歌',
    group: 'general',
    url: 'https://www.google.com/search?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M21.35 11.1H12v3.8h5.38c-.24 1.28-.96 2.37-2.05 3.1v2.58h3.32c1.94-1.78 3.06-4.4 3.06-7.48 0-.68-.06-1.34-.16-2z"
          fill="#4285F4"
        />
        <path
          d="M12 20.6c2.43 0 4.47-.8 5.96-2.18l-3.32-2.58c-.92.62-2.1.98-3.64.98-2.34 0-4.32-1.58-5.03-3.7H2.54v2.66C4.02 18.7 7.74 20.6 12 20.6z"
          fill="#34A853"
        />
        <path
          d="M6.97 13.12a5.16 5.16 0 0 1 0-3.24V7.22H2.54a8.98 8.98 0 0 0 0 9.56l4.43-3.66z"
          fill="#FBBC05"
        />
        <path
          d="M12 7.4c1.32 0 2.5.45 3.44 1.35l2.58-2.58C16.46 4.68 14.43 4 12 4c-4.26 0-7.98 1.9-9.46 4.66l4.43 3.66c.71-2.12 2.69-3.7 5.03-3.7z"
          fill="#EA4335"
        />
      </svg>
    ),
    placeholder: 'Google 搜索或输入网址...',
    shortcut: 'g',
  },
  {
    id: 'duckduckgo',
    value: 'duckduckgo',
    name: 'DuckDuckGo',
    group: 'general',
    url: 'https://duckduckgo.com/?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#DE5833" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          D
        </text>
      </svg>
    ),
    placeholder: 'DuckDuckGo 隐私保护搜索...',
    shortcut: 'd',
  },
  {
    id: 'sogou',
    value: 'sogou',
    name: '搜狗搜索',
    group: 'general',
    url: 'https://www.sogou.com/web?query=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#FB6022" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          搜
        </text>
      </svg>
    ),
    placeholder: '搜狗搜索...',
  },
  {
    id: 'so',
    value: 'so',
    name: '360搜索',
    group: 'general',
    url: 'https://www.so.com/s?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#18B22B" />
        <path
          d="M9 12l2 2 4-4"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    placeholder: '360 安全搜索...',
  },
  {
    id: 'sm',
    value: 'sm',
    name: '神马搜索',
    group: 'general',
    url: 'https://m.sm.cn/s?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#FFB200" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          神
        </text>
      </svg>
    ),
    placeholder: '神马移动搜索...',
  },
  {
    id: 'yahoo',
    value: 'yahoo',
    name: '雅虎',
    group: 'general',
    url: 'https://search.yahoo.com/search?p=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#6001D2" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          Y
        </text>
      </svg>
    ),
    placeholder: 'Yahoo! Search...',
  },
  {
    id: 'yandex',
    value: 'yandex',
    name: 'Yandex',
    group: 'general',
    url: 'https://yandex.com/search/?text=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#FC3F1D" />
        <text
          x="12"
          y="17"
          fontSize="13"
          fontWeight="700"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          Я
        </text>
      </svg>
    ),
    placeholder: 'Yandex Search...',
  },
  {
    id: 'brave',
    value: 'brave',
    name: 'Brave',
    group: 'general',
    url: 'https://search.brave.com/search?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#FB542B" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          B
        </text>
      </svg>
    ),
    placeholder: 'Brave 隐私搜索...',
  },
  {
    id: 'startpage',
    value: 'startpage',
    name: 'Startpage',
    group: 'general',
    url: 'https://www.startpage.com/sp/search?query=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#082A62" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          S
        </text>
      </svg>
    ),
    placeholder: 'Startpage 隐私搜索...',
  },
  {
    id: 'ecosia',
    value: 'ecosia',
    name: 'Ecosia',
    group: 'general',
    url: 'https://www.ecosia.org/search?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#008060" />
        <path d="M12 6v12M8 10h8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    placeholder: 'Ecosia 植树环保搜索...',
  },
  {
    id: 'naver',
    value: 'naver',
    name: 'Naver',
    group: 'general',
    url: 'https://search.naver.com/search.naver?query=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#03C75A" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          N
        </text>
      </svg>
    ),
    placeholder: 'Naver 搜索...',
  },
  {
    id: 'youtube',
    value: 'youtube',
    name: 'YouTube',
    group: 'general',
    url: 'https://www.youtube.com/results?search_query=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M23 12s0-3.85-.5-5.4a3 3 0 0 0-2.1-2.1C18.8 4 12 4 12 4s-6.8 0-8.4.5a3 3 0 0 0-2.1 2.1C1 8.15 1 12 1 12s0 3.85.5 5.4a3 3 0 0 0 2.1 2.1c1.6.5 8.4.5 8.4.5s6.8 0 8.4-.5a3 3 0 0 0 2.1-2.1c.5-1.55.5-5.4.5-5.4z"
          fill="#FF0000"
        />
        <path d="M9.5 8.5V15.5L15.5 12z" fill="#FFF" />
      </svg>
    ),
    placeholder: '在 YouTube 搜索全球视频...',
    shortcut: 'yt',
  },
  {
    id: 'bilibili',
    value: 'bilibili',
    name: '哔哩哔哩',
    group: 'general',
    url: 'https://search.bilibili.com/all?keyword=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#00AEEC" />
        <path
          d="M6 15h12M9 9h.01M15 9h.01"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    placeholder: '哔哩哔哩 (゜-゜)つロ 干杯~',
    shortcut: 'bl',
  },
  {
    id: 'zhihu',
    value: 'zhihu',
    name: '知乎',
    group: 'general',
    url: 'https://www.zhihu.com/search?type=content&q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#0084FF" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          知
        </text>
      </svg>
    ),
    placeholder: '在知乎搜索感兴趣的回答...',
    shortcut: 'zh',
  },
  {
    id: 'weixin',
    value: 'weixin',
    name: '微信搜一搜',
    group: 'general',
    url: 'https://weixin.sogou.com/weixin?type=2&query=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M2 12c0-5 4.5-9 10-9s10 4 10 9-4.5 9-10 9c-1.2 0-2.3-.2-3.3-.6l-3 1 .8-2.5C3.5 16.5 2 14.5 2 12z"
          fill="#07C160"
        />
        <circle cx="8" cy="10" r="1.5" fill="#fff" />
        <circle cx="14" cy="10" r="1.5" fill="#fff" />
      </svg>
    ),
    placeholder: '搜索微信公众号与文章...',
    shortcut: 'wx',
  },
  {
    id: 'jike',
    value: 'jike',
    name: '即刻',
    group: 'general',
    url: 'https://okjike.com/search?keyword=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#FFE411" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="#111"
          fontFamily="Arial, sans-serif"
        >
          即
        </text>
      </svg>
    ),
    placeholder: '即刻搜索动态与圈子...',
  },
  {
    id: 'taobao',
    value: 'taobao',
    name: '淘宝',
    group: 'general',
    url: 'https://s.taobao.com/search?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#FF5000" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          淘
        </text>
      </svg>
    ),
    placeholder: '在淘宝搜索海量商品...',
    shortcut: 'tb',
  },
  {
    id: 'jd',
    value: 'jd',
    name: '京东',
    group: 'general',
    url: 'https://search.jd.com/Search?keyword=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#E1251B" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="800"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          东
        </text>
      </svg>
    ),
    placeholder: '在京东搜索正品数码与好物...',
    shortcut: 'jd',
  },
  {
    id: 'metaso',
    value: 'metaso',
    name: '秘塔AI搜索',
    group: 'ai',
    url: 'https://metaso.cn/?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#5B67E8" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="700"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          M
        </text>
      </svg>
    ),
    placeholder: '秘塔 AI 没有广告的深度学术搜索...',
  },
  {
    id: 'nami',
    value: 'nami',
    name: '纳米AI搜索',
    group: 'ai',
    url: 'https://www.n.cn/search/?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#E1051B" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="700"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          纳
        </text>
      </svg>
    ),
    placeholder: '纳米 AI 全网精准问答搜索...',
  },
  {
    id: 'felo',
    value: 'felo',
    name: 'Felo AI搜索',
    group: 'ai',
    url: 'https://felo.ai/search?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#00A4FF" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="700"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          F
        </text>
      </svg>
    ),
    placeholder: 'Felo 跨语言全球智能 AI 检索...',
  },
  {
    id: 'tiangong',
    value: 'tiangong',
    name: '天工AI搜索',
    group: 'ai',
    url: 'https://www.tiangong.cn/search?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#6633CC" />
        <text
          x="12"
          y="17"
          fontSize="14"
          fontWeight="700"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
        >
          天
        </text>
      </svg>
    ),
    placeholder: '昆仑万维天工 AI 智能搜索...',
  },
  // 保留原有的开发者搜索引擎
  {
    id: 'github',
    value: 'github',
    name: 'GitHub',
    group: 'dev',
    url: 'https://github.com/search?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    ),
    placeholder: '在 GitHub 搜索代码库与开源项目...',
    shortcut: 'gh',
  },
  {
    id: 'npm',
    value: 'npm',
    name: 'NPM',
    group: 'dev',
    url: 'https://www.npmjs.com/search?q=',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#CB3837">
        <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.13h13.74v13.74h-3.435V8.565h-3.435v10.305H5.13z" />
      </svg>
    ),
    placeholder: '搜索 NPM 包依赖...',
    shortcut: 'npm',
  },
];

// Map of built-in engine icons by ID or value (ensures icons render even after JSON serialization)
const ENGINE_ICON_MAP: Record<string, React.ReactNode> = {};
SEARCH_ENGINES.forEach((eng) => {
  if (eng.icon) {
    ENGINE_ICON_MAP[eng.id] = eng.icon;
    if (eng.value) {
      ENGINE_ICON_MAP[eng.value] = eng.icon;
    }
  }
});

/**
 * Safely render search engine icon with fallback
 */
export function getEngineIcon(engine?: SearchEngine | null, className: string = 'w-4 h-4'): React.ReactNode {
  if (!engine) return <span>🔍</span>;

  // 1. Check if engine.icon is an existing valid React element or string
  if (React.isValidElement(engine.icon)) {
    return engine.icon;
  }
  if (typeof engine.icon === 'string' && engine.icon.trim()) {
    // If emoji or text
    if (engine.icon.length <= 4) {
      return <span>{engine.icon}</span>;
    }
    // If image URL
    return (
      <img
        src={engine.icon}
        alt=""
        className={`${className} object-contain`}
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // 2. Check built-in registry map by ID or value
  const key = engine.id || engine.value || '';
  if (ENGINE_ICON_MAP[key]) {
    return ENGINE_ICON_MAP[key];
  }

  // 3. Fallback to first letter in stylish avatar
  const firstLetter = (engine.name || 'S')[0].toUpperCase();
  return (
    <span className="font-bold text-[11px] text-white/90">
      {firstLetter}
    </span>
  );
}

export const ENGINE_GROUPS = [
  { id: 'all', name: '全部引擎' },
  { id: 'general', name: '常用搜索' },
  { id: 'ai', name: 'AI 搜索' },
  { id: 'dev', name: '开发社区' },
  { id: 'local', name: '本站搜索' },
];
