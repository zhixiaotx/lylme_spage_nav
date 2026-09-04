import React, { useEffect } from 'react';

export const MusicPlayerLoader: React.FC = () => {
  useEffect(() => {
    // Prevent duplicate load if already initialized or script present
    if (document.getElementById('myhk') || (window as any).myhkLoaded) {
      return;
    }

    try {
      // Clear storage locks
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('myhk') || key.includes('player') || key.includes('myhkw'))) {
          sessionStorage.removeItem(key);
        }
      }
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.includes('myhk') || key.includes('myhkw'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Mark as loaded globally
    (window as any).myhkLoaded = true;

    const script = document.createElement('script');
    script.id = 'myhk';
    script.src = 'https://myhkw.cn/api/player/178355703190';
    script.setAttribute('key', '178355703190');
    script.setAttribute('m', '1');
    script.async = true;

    script.onerror = () => {
      console.warn('Music player script failed to load.');
    };

    document.body.appendChild(script);
  }, []);

  return null;
};
