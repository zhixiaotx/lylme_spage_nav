import React, { useState, useEffect } from 'react';
import { IconSource } from '../types';
import {
  getHostname,
  getFaviconUrl,
  getLetterAvatar,
  getColorForString,
  SOURCE_PRIORITY,
} from '../lib/favicon';

interface FaviconProps {
  url?: string;
  name?: string;
  icon?: string;
  size?: number;
  className?: string;
  preferredSource?: IconSource;
  roundedClassName?: string;
}

export function Favicon({
  url = '',
  name = '',
  icon = '',
  size = 20,
  className = '',
  preferredSource = 'favicon_im',
  roundedClassName = 'rounded-md',
}: FaviconProps) {
  // Step index in fallback source list
  const [sourceIdx, setSourceIdx] = useState<number>(0);
  const [hasFailedAll, setHasFailedAll] = useState<boolean>(false);

  // Flat list of prioritized fallback sources
  const rawFallback: IconSource[] = [
    preferredSource,
    'favicon_myhkw',
    'favicon_im',
    'favicon_iowen',
    'google',
    'icons_duckduckgo',
    'favicon_baidu',
    'direct',
  ];
  const fallbackChain: IconSource[] = Array.from(new Set(rawFallback));

  const hostname = getHostname(url);
  const letter = getLetterAvatar(name || hostname || '★');
  const bgColor = getColorForString(name || hostname || 'default');

  // If explicit emoji or short text is provided
  const isEmoji =
    icon &&
    icon.trim().length <= 4 &&
    !icon.startsWith('http') &&
    !icon.startsWith('data:');

  // Reset fallback state when url or icon changes
  useEffect(() => {
    setSourceIdx(0);
    setHasFailedAll(false);
  }, [url, icon, preferredSource]);

  // If emoji, render emoji directly
  if (isEmoji) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 select-none ${className}`}
        style={{ width: size, height: size, fontSize: Math.floor(size * 0.75) }}
      >
        <span>{icon.trim()}</span>
      </div>
    );
  }

  // Determine current image URL to attempt
  const currentImgUrl = () => {
    if (icon && icon.startsWith('http')) {
      // If custom direct icon is set, try it first
      if (sourceIdx === 0) return icon;
    }
    const targetSource = fallbackChain[sourceIdx] || 'favicon_im';
    return getFaviconUrl({ url, name, title: name }, targetSource);
  };

  // If all image attempts have failed or no URL/hostname, render beautiful letter avatar
  if (hasFailedAll || (!url && !icon)) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 text-white font-bold shadow-sm select-none ${roundedClassName} ${className}`}
        style={{
          width: size,
          height: size,
          background: bgColor,
          fontSize: Math.max(10, Math.floor(size * 0.55)),
        }}
        title={name || hostname}
      >
        <span>{letter}</span>
      </div>
    );
  }

  const src = currentImgUrl();

  const handleError = () => {
    if (sourceIdx < fallbackChain.length - 1) {
      // Try next fallback source
      setSourceIdx((prev) => prev + 1);
    } else {
      // Exhausted all sources, show letter avatar
      setHasFailedAll(true);
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 overflow-hidden ${roundedClassName} ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={handleError}
        className="w-full h-full object-contain pointer-events-none transition-transform duration-200"
      />
    </div>
  );
}
