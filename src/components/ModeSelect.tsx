import React from 'react';
import { GameMode } from '../types/game.ts';
import { FullscreenButton } from './FullscreenButton.tsx';
import { SoundToggleButton } from './SoundToggleButton.tsx';

interface ModeSelectProps {
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
}

export const ModeSelect: React.FC<ModeSelectProps> = ({ onSelectMode, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="max-w-4xl w-full">
        {/* Header with Navigation, Sound Toggle and Fullscreen */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            ← Kembali ke Menu Utama
          </button>
          <div className="flex items-center gap-2">
            <SoundToggleButton variant="header" />
            <FullscreenButton variant="header" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            PILIH MODE PERMAINAN
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pilih petualangan lari mandiri atau adu kepintaran bersama teman di satu layar!
          </p>
        </div>

        {/* 2 Mode Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Solo Mode */}
          <div
            onClick={() => onSelectMode('solo')}
            className="group relative bg-slate-900/90 hover:bg-slate-800/90 border-2 border-slate-800 hover:border-amber-400 rounded-3xl p-6 sm:p-8 transition-all duration-300 cursor-pointer shadow-xl hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div className="absolute top-4 right-4 bg-amber-500/20 text-amber-400 text-xs font-black uppercase px-3 py-1 rounded-full border border-amber-500/30">
              1 Pemain
            </div>

            <div>
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
                🏃‍♂️
              </div>
              <h2 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors mb-2">
                MODE INDIVIDU
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Lari sejauh mungkin di lintasan rel kereta!
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✔</span>
                  <span>Nyawa berkurang jika menabrak rintangan atau kereta.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✔</span>
                  <span>Ambil <strong>Kotak Bonus Soal</strong>: Jawab benar dapat <strong>tambahan nyawa (+1 ❤️)</strong>!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✔</span>
                  <span>Lapor hasil & nilai akhir langsung ke <strong>WhatsApp Guru</strong>.</span>
                </li>
              </ul>
            </div>

            <button
              className="mt-8 w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 group-hover:from-amber-400 group-hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              <span>Mulai Mode Individu</span>
              <span>→</span>
            </button>
          </div>

          {/* Battle Mode */}
          <div
            onClick={() => onSelectMode('battle')}
            className="group relative bg-slate-900/90 hover:bg-slate-800/90 border-2 border-slate-800 hover:border-purple-400 rounded-3xl p-6 sm:p-8 transition-all duration-300 cursor-pointer shadow-xl hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <div className="absolute top-4 right-4 bg-purple-500/20 text-purple-400 text-xs font-black uppercase px-3 py-1 rounded-full border border-purple-500/30">
              2 Pemain Split Screen
            </div>

            <div>
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
                ⚔️
              </div>
              <h2 className="text-2xl font-black text-white group-hover:text-purple-300 transition-colors mb-2">
                MODE BATTLE
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Tantang temanmu dalam pertarungan layar terbelah (Split-Screen)!
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">✔</span>
                  <span>Layar terbelah menjadi dua untuk Pemain 1 (Kiri) dan Pemain 2 (Kanan).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">✔</span>
                  <span>Setiap pemain memiliki <strong>3 nyawa</strong> saat menabrak rintangan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">✔</span>
                  <span>Dapatkan <strong>poin sebanyak-banyaknya</strong> dari soal kuis & lari!</span>
                </li>
              </ul>
            </div>

            <button
              className="mt-8 w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              <span>Mulai Mode Battle</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
