import React, { useEffect } from 'react';
import { ANIMALS } from '../game/animalsData.ts';
import { useSoundManager } from '../hooks/useSoundManager.ts';
import { FullscreenButton } from './FullscreenButton.tsx';
import { SoundToggleButton } from './SoundToggleButton.tsx';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenTeacherPortal: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenTeacherPortal,
}) => {
  const { playBGM } = useSoundManager('title');

  useEffect(() => {
    // Start BGM on user gesture / interaction
    const handleInteraction = () => {
      playBGM('title');
    };
    window.addEventListener('pointerdown', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [playBGM]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Bar with Brand, Fullscreen & Sound */}
      <header className="relative z-10 px-4 sm:px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚇</span>
          <span className="font-mono text-xs font-bold tracking-wider text-amber-400 uppercase bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            Developed By Misbahul Munir
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle (ON/OFF) */}
          <SoundToggleButton variant="header" />

          {/* Fullscreen Button */}
          <FullscreenButton variant="header" />

          <button
            onClick={onOpenTeacherPortal}
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-blue-300 hover:text-white border border-blue-500/30 flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
          >
            <span>👨‍🏫</span>
            <span className="hidden sm:inline">Portal Guru</span>
          </button>
        </div>
      </header>

      {/* Hero Showcase Centerpiece */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-6">
        {/* Custom Inline SVG Subway Surfers Style Title Lockup */}
        <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
          <svg
            viewBox="0 0 680 140"
            className="w-full max-w-[540px] sm:max-w-[620px] drop-shadow-[0_12px_24px_rgba(245,158,11,0.35)]"
          >
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#312e81" />
              </linearGradient>
            </defs>
            <text
              x="50%"
              y="68"
              textAnchor="middle"
              className="font-black tracking-tighter"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '66px',
                fontWeight: 950,
                fill: 'url(#titleGrad)',
                stroke: '#0f172a',
                strokeWidth: '10px',
                paintOrder: 'stroke fill',
                letterSpacing: '-2px',
              }}
            >
              DASHIMAL EDU
            </text>
            <text
              x="50%"
              y="118"
              textAnchor="middle"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '28px',
                fontWeight: 800,
                fill: '#38bdf8',
                stroke: '#0369a1',
                strokeWidth: '4px',
                paintOrder: 'stroke fill',
                letterSpacing: '5px',
              }}
            >
              Fun Game Edukatif
            </text>
          </svg>
        </div>

        {/* Subtitle / Pitch */}
        <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-6 leading-relaxed">
          Game 3D seru dengan <span className="text-amber-300 font-bold">11 karakter hewan</span>,
          lompat & meluncur di rel kereta, raih poin dan soal kuis buatan guru, dan bagikan skormu ke WhatsApp!
        </p>

        {/* Animals Emoji Parade Preview */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl max-w-2xl">
          {ANIMALS.map((a) => (
            <div
              key={a.id}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl sm:text-2xl cursor-default transition-transform hover:scale-125 border border-slate-700/60"
              title={`${a.name} (${a.species})`}
            >
              {a.emoji}
            </div>
          ))}
        </div>

        {/* Primary Start CTA Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button
            data-start="true"
            onClick={onStartGame}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-lg sm:text-xl rounded-2xl shadow-[0_8px_30px_rgba(245,158,11,0.5)] transform hover:-translate-y-1 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-3"
          >
            <span>🚀</span>
            <span>MULAI BERMAIN</span>
            <span>→</span>
          </button>

          <button
            onClick={onOpenTeacherPortal}
            className="w-full sm:w-auto px-6 py-4 bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm sm:text-base rounded-2xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>📝</span>
            <span>Portal Guru</span>
          </button>
        </div>
      </main>

      {/* Single Flat Non-Interactive Control Hint Line in Safe Margin */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-400 border-t border-slate-800/60 max-w-7xl mx-auto w-full px-4">
        <span>A / D atau ◄ / ► Ganti Jalur</span>
        <span className="mx-2 text-slate-600">·</span>
        <span>W / Space / ▲ Lompat</span>
        <span className="mx-2 text-slate-600">·</span>
        <span>S / ▼ Meluncur Duck</span>
        <span className="mx-2 text-slate-600">·</span>
        <span>Space / Enter Mulai Cepat</span>
      </footer>
    </div>
  );
};
