import React, { useState } from 'react';
import { AnimalId, GameMode } from '../types/game.ts';
import { ANIMALS } from '../game/animalsData.ts';
import { FullscreenButton } from './FullscreenButton.tsx';
import { SoundToggleButton } from './SoundToggleButton.tsx';

interface CharacterSelectProps {
  mode: GameMode;
  player1Name: string;
  player2Name?: string;
  onSelectAnimals: (p1Animal: AnimalId, p2Animal?: AnimalId) => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  mode,
  player1Name,
  player2Name,
  onSelectAnimals,
  onBack,
}) => {
  const [p1Animal, setP1Animal] = useState<AnimalId>('kelinci');
  const [p2Animal, setP2Animal] = useState<AnimalId>('harimau');
  const [activePicking, setActivePicking] = useState<'p1' | 'p2'>('p1');

  const selectedAnimal = ANIMALS.find(
    (a) => a.id === (activePicking === 'p1' ? p1Animal : p2Animal)
  )!;

  const handleStart = () => {
    onSelectAnimals(p1Animal, mode === 'battle' ? p2Animal : undefined);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={onBack}
                className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
              >
                ← Kembali ke Lobi
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              PILIH KARAKTER HEWAN
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              11 hewan spesial siap berlari di atas rel Subway Surfers!
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <SoundToggleButton variant="header" />
            <FullscreenButton variant="header" />

            {/* If Battle mode, toggle between P1 and P2 picker */}
            {mode === 'battle' && (
              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setActivePicking('p1')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePicking === 'p1'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  P1: {player1Name} ({ANIMALS.find((a) => a.id === p1Animal)?.emoji})
                </button>
                <button
                  onClick={() => setActivePicking('p2')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePicking === 'p2'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  P2: {player2Name} ({ANIMALS.find((a) => a.id === p2Animal)?.emoji})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Hero Highlight Card */}
        <div className="mb-6 bg-gradient-to-r from-slate-900 to-slate-900/80 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-wrap items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800 border-2 border-amber-400/50 flex items-center justify-center text-5xl sm:text-6xl shadow-inner">
            {selectedAnimal.emoji}
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {mode === 'battle' ? `Memilih untuk: ${activePicking === 'p1' ? player1Name : player2Name}` : 'Karakter Pilihan'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {selectedAnimal.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {selectedAnimal.description}
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-300 rounded-lg text-xs font-semibold border border-amber-500/20">
              <span>⚡ Keahlian:</span>
              <span>{selectedAnimal.trait}</span>
            </div>
          </div>
        </div>

        {/* 11 Animals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {ANIMALS.map((animal) => {
            const isP1 = p1Animal === animal.id;
            const isP2 = mode === 'battle' && p2Animal === animal.id;
            const isCurrent =
              (activePicking === 'p1' && isP1) || (activePicking === 'p2' && isP2);

            return (
              <button
                key={animal.id}
                onClick={() => {
                  if (activePicking === 'p1') {
                    setP1Animal(animal.id);
                  } else {
                    setP2Animal(animal.id);
                  }
                }}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]'
                    : isP1 || isP2
                    ? 'bg-slate-900 border-purple-500/60'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Badges for P1 / P2 */}
                {isP1 && (
                  <span className="absolute top-2 right-2 text-[10px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-md">
                    P1
                  </span>
                )}
                {isP2 && (
                  <span className="absolute top-2 left-2 text-[10px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded-md">
                    P2
                  </span>
                )}

                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform text-center py-2">
                  {animal.emoji}
                </div>

                <div>
                  <div className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                    {animal.species}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {animal.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Button Dock */}
      <div className="max-w-6xl mx-auto w-full pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-slate-400">
          {mode === 'battle' ? (
            <span>
              Pemain 1: <strong className="text-amber-400">{player1Name}</strong> ({ANIMALS.find((a) => a.id === p1Animal)?.name}) vs Pemain 2: <strong className="text-purple-400">{player2Name}</strong> ({ANIMALS.find((a) => a.id === p2Animal)?.name})
            </span>
          ) : (
            <span>
              Karakter: <strong className="text-amber-400">{selectedAnimal.name}</strong>
            </span>
          )}
        </div>

        <button
          data-start="true"
          onClick={handleStart}
          className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-lg rounded-2xl shadow-xl transition-all cursor-pointer flex items-center gap-3 transform hover:-translate-y-0.5"
        >
          <span>🏁</span>
          <span>GAS! MULAI BERLARI</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
