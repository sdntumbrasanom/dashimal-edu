import React from 'react';
import { useFullscreen } from '../hooks/useFullscreen.ts';

interface FullscreenButtonProps {
  variant?: 'header' | 'hud' | 'menu' | 'floating';
  className?: string;
  showLabel?: boolean;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  variant = 'header',
  className = '',
  showLabel = true,
}) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen(false);

  // SVG Expand Icon
  const expandIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );

  // SVG Compress / Exit Fullscreen Icon
  const compressIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );

  if (variant === 'hud') {
    return (
      <button
        onClick={toggleFullscreen}
        className={`h-9 px-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 active:bg-amber-500/20 border border-slate-700 text-xs flex items-center gap-1.5 transition-all cursor-pointer text-cyan-300 font-bold shadow-md hover:border-cyan-400/50 ${className}`}
        title={isFullscreen ? 'Keluar Layar Penuh (F)' : 'Masuk Layar Penuh (F)'}
        aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
      >
        {isFullscreen ? compressIcon : expandIcon}
        {showLabel && (
          <span className="hidden sm:inline">
            {isFullscreen ? 'Keluar Full' : 'Full Screen'}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'menu') {
    return (
      <button
        onClick={toggleFullscreen}
        className={`w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-cyan-300 hover:text-white shadow ${className}`}
      >
        {isFullscreen ? compressIcon : expandIcon}
        <span>{isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh (Full Screen)'}</span>
      </button>
    );
  }

  if (variant === 'floating') {
    return (
      <button
        onClick={toggleFullscreen}
        className={`fixed top-4 right-4 z-50 p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 shadow-2xl flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-white backdrop-blur-md transition-all cursor-pointer ${className}`}
        title={isFullscreen ? 'Keluar Layar Penuh (F)' : 'Mode Layar Penuh (F)'}
      >
        {isFullscreen ? compressIcon : expandIcon}
        {showLabel && (
          <span className="hidden md:inline font-mono">
            {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          </span>
        )}
      </button>
    );
  }

  // Default 'header' variant
  return (
    <button
      onClick={toggleFullscreen}
      className={`h-9 sm:h-10 ${
        showLabel ? 'px-3 sm:px-3.5 gap-2' : 'w-9 sm:w-10 p-0 justify-center'
      } rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-cyan-300 hover:text-white border border-cyan-500/30 flex items-center transition-all cursor-pointer shadow-md shrink-0 ${className}`}
      title={isFullscreen ? 'Keluar Layar Penuh (F)' : 'Masuk Layar Penuh (F)'}
      aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
    >
      {isFullscreen ? compressIcon : expandIcon}
      {showLabel && (
        <span className="hidden sm:inline">
          {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        </span>
      )}
    </button>
  );
};
