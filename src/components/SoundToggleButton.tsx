import React, { useState, useEffect } from 'react';
import { getMuted, setMuted } from '../utils/sound.ts';

interface SoundToggleButtonProps {
  variant?: 'header' | 'hud' | 'banner';
  showLabel?: boolean;
  className?: string;
}

export const SoundToggleButton: React.FC<SoundToggleButtonProps> = ({
  variant = 'header',
  showLabel = true,
  className = '',
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(getMuted());

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.muted === 'boolean') {
        setIsMuted(customEvent.detail.muted);
      } else {
        setIsMuted(getMuted());
      }
    };

    window.addEventListener('subway_sound_toggle', handleToggle);
    return () => window.removeEventListener('subway_sound_toggle', handleToggle);
  }, []);

  const handleClick = () => {
    const next = !getMuted();
    setMuted(next);
    setIsMuted(next);
  };

  const isAudioOn = !isMuted;

  if (variant === 'hud') {
    return (
      <button
        onClick={handleClick}
        className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer pointer-events-auto shadow-md ${
          isAudioOn
            ? 'bg-emerald-950/85 hover:bg-emerald-900 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
            : 'bg-slate-900/85 hover:bg-slate-800 border-rose-500/60 text-rose-300 ring-1 ring-rose-500/30'
        } ${className}`}
        title={isAudioOn ? 'Matikan Suara (Klik untuk Mute)' : 'Nyalakan Suara (Klik untuk Audio ON)'}
        aria-label={isAudioOn ? 'Suara Aktif - Matikan' : 'Suara Mati - Hidupkan'}
      >
        <span className="text-sm">{isAudioOn ? '🔊' : '🔇'}</span>
        {showLabel && (
          <span className="font-mono uppercase tracking-wider text-[11px]">
            {isAudioOn ? 'AUDIO: ON' : 'AUDIO: OFF'}
          </span>
        )}
      </button>
    );
  }

  // Header / Menu Variant
  return (
    <button
      onClick={handleClick}
      className={`h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm select-none ${
        isAudioOn
          ? 'bg-emerald-950/70 hover:bg-emerald-900/80 border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
          : 'bg-slate-900/80 hover:bg-slate-800 border-rose-500/50 text-rose-300 hover:border-rose-400'
      } ${className}`}
      title={isAudioOn ? 'Suara Sedang ON (Klik untuk Mute)' : 'Suara Sedang OFF (Klik untuk Bunyikan)'}
      aria-label={isAudioOn ? 'Suara Aktif' : 'Suara Nonaktif'}
    >
      <span className="text-base">{isAudioOn ? '🔊' : '🔇'}</span>
      {showLabel && (
        <span className="font-mono text-xs tracking-wider flex items-center gap-1.5">
          <span className="hidden sm:inline">SUARA:</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
              isAudioOn
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {isAudioOn ? 'ON' : 'OFF'}
          </span>
        </span>
      )}
    </button>
  );
};
