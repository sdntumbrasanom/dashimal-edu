import React from 'react';
import { getMuted, setMuted } from '../utils/sound.ts';

interface GameHUDProps {
  playerName: string;
  animalEmoji: string;
  lives: number;
  maxLives: number;
  score: number;
  distance: number;
  coins: number;
  questionsTotal: number;
  questionsCorrect: number;
  onPause: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  onToggleView?: () => void;
  isFacingFront?: boolean;
  isBattle?: boolean;
  playerSide?: 'left' | 'right';
}

export const GameHUD: React.FC<GameHUDProps> = ({
  playerName,
  animalEmoji,
  lives,
  maxLives,
  score,
  distance,
  coins,
  questionsTotal,
  questionsCorrect,
  onPause,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
  onToggleView,
  isFacingFront = true,
  isBattle = false,
  playerSide = 'left',
}) => {
  const [isMutedState, setIsMutedState] = React.useState(getMuted());

  const toggleSound = () => {
    const next = !isMutedState;
    setMuted(next);
    setIsMutedState(next);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* Top Bar Status */}
      <div className="flex items-start justify-between gap-3">
        {/* Player Profile & Lives */}
        <div className="bg-slate-900/85 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-lg pointer-events-auto flex items-center gap-3">
          <div className="text-2xl sm:text-3xl bg-slate-800 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border border-slate-700">
            {animalEmoji}
          </div>

          <div>
            <div className="text-xs sm:text-sm font-black text-white leading-tight truncate max-w-[120px] sm:max-w-[180px]">
              {playerName}
            </div>

            {/* Vitality Sockets (Hearts) */}
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: maxLives }).map((_, idx) => (
                <span
                  key={idx}
                  className={`text-sm sm:text-base transition-transform ${
                    idx < lives ? 'text-red-500 scale-100' : 'text-slate-600 scale-90'
                  }`}
                  title={`${lives} Nyawa Tersisa`}
                >
                  {idx < lives ? '❤️' : '🖤'}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Right Metrics: Score & Coins */}
        <div className="flex items-center gap-2">
          {/* Score & Distance cluster */}
          <div className="bg-slate-900/85 border border-slate-700/80 rounded-2xl px-3.5 py-2 shadow-lg text-right">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              SKOR
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-white tabular-nums leading-none">
              {Math.floor(score).toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              {Math.floor(distance)}m · 🪙 {coins}
            </div>
          </div>

          {/* Utility Buttons: View Toggle, Mute & Pause */}
          {(!isBattle || playerSide === 'left') && (
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {onToggleView && (
                <button
                  onClick={onToggleView}
                  className="h-9 px-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer text-amber-300 font-bold"
                  title="Ganti Sudut Pandang Karakter (Depan/Belakang) [V]"
                  aria-label="Ganti Sudut Pandang"
                >
                  <span>📷</span>
                  <span className="hidden sm:inline">
                    {isFacingFront ? 'Hadap Depan' : 'Hadap Rel'}
                  </span>
                </button>
              )}

              <button
                onClick={toggleSound}
                className="w-9 h-9 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-sm flex items-center justify-center transition-colors cursor-pointer"
                title="Mute Audio"
                aria-label="Mute Audio"
              >
                {isMutedState ? '🔇' : '🔊'}
              </button>

              <button
                onClick={onPause}
                className="w-9 h-9 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-sm flex items-center justify-center transition-colors cursor-pointer text-slate-200"
                title="Pause Game (P / Esc)"
                aria-label="Pause Game"
              >
                ⏸
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Progress Pill */}
      {questionsTotal > 0 && (
        <div className="self-center bg-purple-950/80 border border-purple-500/40 rounded-full px-3 py-1 shadow-md text-xs text-purple-200 pointer-events-none">
          🎁 Kuis: <strong className="text-amber-300">{questionsCorrect}</strong> / {questionsTotal} Benar
        </div>
      )}

      {/* Touch On-Screen Controls for Mobile / Tablets */}
      <div className="pointer-events-auto flex items-end justify-between gap-4 pb-2">
        {/* Left & Right Steering */}
        <div className="flex items-center gap-2">
          <button
            onPointerDown={onMoveLeft}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-900/80 active:bg-amber-500/80 border-2 border-slate-700/80 active:border-amber-400 text-white font-black text-xl flex items-center justify-center shadow-xl backdrop-blur-none cursor-pointer"
            aria-label="Geser Kiri"
          >
            ◀
          </button>
          <button
            onPointerDown={onMoveRight}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-900/80 active:bg-amber-500/80 border-2 border-slate-700/80 active:border-amber-400 text-white font-black text-xl flex items-center justify-center shadow-xl backdrop-blur-none cursor-pointer"
            aria-label="Geser Kanan"
          >
            ▶
          </button>
        </div>

        {/* Jump & Slide Actions */}
        <div className="flex items-center gap-2">
          <button
            onPointerDown={onSlide}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-900/80 active:bg-blue-500/80 border-2 border-slate-700/80 active:border-blue-400 text-white font-black text-xs flex flex-col items-center justify-center shadow-xl cursor-pointer"
            aria-label="Meluncur"
          >
            <span className="text-lg leading-none">▼</span>
            <span className="text-[9px] uppercase font-bold tracking-tight">Slide</span>
          </button>

          <button
            onPointerDown={onJump}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/90 active:bg-amber-400 border-2 border-amber-300 text-slate-950 font-black text-sm flex flex-col items-center justify-center shadow-[0_4px_16px_rgba(245,158,11,0.5)] cursor-pointer"
            aria-label="Lompat"
          >
            <span className="text-xl leading-none">▲</span>
            <span className="text-[10px] uppercase font-black tracking-tight">Lompat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
