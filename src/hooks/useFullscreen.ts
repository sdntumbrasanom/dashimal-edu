import { useState, useEffect, useCallback } from 'react';

// Cross-browser Fullscreen Helpers
export function checkIsFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as unknown as {
    fullscreenElement?: Element | null;
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return Boolean(
    doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
  );
}

export async function requestFullscreen(element?: HTMLElement): Promise<boolean> {
  const el = (element || (typeof document !== 'undefined' ? document.documentElement : null)) as unknown as {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  } | null;

  if (!el) return false;

  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      await el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
    }
    return true;
  } catch (err) {
    console.warn('Fullscreen request declined or restricted:', err);
    return false;
  }
}

export async function exitFullscreen(): Promise<boolean> {
  const doc = (typeof document !== 'undefined' ? document : null) as unknown as {
    exitFullscreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  } | null;

  if (!doc) return false;

  try {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }
    return true;
  } catch (err) {
    console.warn('Exit fullscreen failed:', err);
    return false;
  }
}

export async function toggleFullscreen(element?: HTMLElement): Promise<boolean> {
  if (checkIsFullscreen()) {
    await exitFullscreen();
    return false;
  } else {
    await requestFullscreen(element);
    return true;
  }
}

export function useFullscreen(enableShortcut = true) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => checkIsFullscreen());

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(checkIsFullscreen());
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    let handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
    if (enableShortcut) {
      handleKeyDown = (e: KeyboardEvent) => {
        // Only trigger if not typing inside an input or textarea
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        ) {
          return;
        }

        if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleFullscreen();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
      if (handleKeyDown) {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [enableShortcut]);

  const toggle = useCallback(() => toggleFullscreen(), []);
  const enter = useCallback((el?: HTMLElement) => requestFullscreen(el), []);
  const exit = useCallback(() => exitFullscreen(), []);

  return {
    isFullscreen,
    toggleFullscreen: toggle,
    enterFullscreen: enter,
    exitFullscreen: exit,
  };
}
