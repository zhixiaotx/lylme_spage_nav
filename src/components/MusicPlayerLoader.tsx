import React, { useEffect } from 'react';

export const MusicPlayerLoader: React.FC = () => {
  useEffect(() => {
    // Intercept third-party script cross-origin error spikes
    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.message === 'Script error.' ||
        event.filename?.includes('myhkw.cn') ||
        event.filename?.includes('player')
      ) {
        // Prevent generic cross-origin third-party script error from bubbling up to dev overlay
        event.preventDefault();
        return true;
      }
    };

    window.addEventListener('error', handleGlobalError);

    // Prevent duplicate load if already initialized or script present
    if (document.getElementById('myhk') || (window as any).myhkLoaded) {
      return () => {
        window.removeEventListener('error', handleGlobalError);
      };
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

    // Function to load music player script
    const loadPlayer = () => {
      if (document.getElementById('myhk') || (window as any).myhkLoaded) return;
      if (!(window as any).jQuery && !(window as any).$) {
        console.warn('jQuery not available, skipping music player load to prevent errors.');
        return;
      }
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
    };

    const ensureJQueryThenLoad = () => {
      if ((window as any).jQuery || (window as any).$) {
        setTimeout(loadPlayer, 300);
        return;
      }

      // If not yet loaded, load jQuery dynamically
      const jScript = document.createElement('script');
      jScript.src = 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js';
      jScript.onload = () => {
        setTimeout(loadPlayer, 300);
      };
      jScript.onerror = () => {
        // Try fallback CDN
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js';
        fallbackScript.onload = () => {
          setTimeout(loadPlayer, 300);
        };
        fallbackScript.onerror = () => {
          console.warn('Failed to load jQuery for music player.');
        };
        document.head.appendChild(fallbackScript);
      };
      document.head.appendChild(jScript);
    };

    ensureJQueryThenLoad();

    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  return null;
};
