import React, { useEffect, useState } from 'react';
import { GameMode, QuizToken, AnimalId } from '../types/game.ts';
import { ANIMALS } from '../game/animalsData.ts';
import {
  generateWhatsAppMessage,
  generateBattleWhatsAppMessage,
  buildWhatsAppUrl,
} from '../game/gameLogic.ts';
import { playGameOverSound } from '../utils/sound.ts';
import confetti from 'canvas-confetti';

interface PlayerFinalStats {
  name: string;
  animalId: AnimalId;
  score: number;
  distance: number;
  coins: number;
  questionsTotal: number;
  questionsCorrect: number;
  lives: number;
}

interface GameOverModalProps {
  mode: GameMode;
  token?: QuizToken | null;
  p1Stats: PlayerFinalStats;
  p2Stats?: PlayerFinalStats;
  onRestart: () => void;
  onExitToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  mode,
  token,
  p1Stats,
  p2Stats,
  onRestart,
  onExitToMenu,
}) => {
  const [customPhone, setCustomPhone] = useState(token?.teacherPhone || '');
  const [showEditPhone, setShowEditPhone] = useState(false);

  useEffect(() => {
    if (token?.teacherPhone) {
      setCustomPhone(token.teacherPhone);
    }
  }, [token]);

  useEffect(() => {
    playGameOverSound();
    if (mode === 'battle') {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.5 },
        });
      } catch {}
    }
  }, [mode]);

  const p1Animal = ANIMALS.find((a) => a.id === p1Stats.animalId)!;
  const p2Animal = p2Stats ? ANIMALS.find((a) => a.id === p2Stats.animalId) : null;

  // Determine winner for battle
  const p1Wins = p2Stats ? p1Stats.score >= p2Stats.score : false;
  const isDraw = p2Stats ? p1Stats.score === p2Stats.score : false;

  const effectivePhone = customPhone.trim() || token?.teacherPhone || '';

  // Solo WhatsApp message & url
  const soloMsg = generateWhatsAppMessage({
    playerName: p1Stats.name,
    token,
    score: p1Stats.score,
    distance: p1Stats.distance,
    coins: p1Stats.coins,
    questionsTotal: p1Stats.questionsTotal,
    questionsCorrect: p1Stats.questionsCorrect,
    livesRemaining: p1Stats.lives,
    animalName: p1Animal?.name || 'Karakter',
  });
  const soloWhatsAppUrl = buildWhatsAppUrl(effectivePhone, soloMsg);

  // Battle WhatsApp message & url
  const battleMsg =
    p2Stats && p2Animal
      ? generateBattleWhatsAppMessage({
          p1Name: p1Stats.name,
          p1Animal: p1Animal?.name || 'P1',
          p1Score: p1Stats.score,
          p1Distance: p1Stats.distance,
          p1Correct: p1Stats.questionsCorrect,
          p1Total: p1Stats.questionsTotal,
          p2Name: p2Stats.name,
          p2Animal: p2Animal?.name || 'P2',
          p2Score: p2Stats.score,
          p2Distance: p2Stats.distance,
          p2Correct: p2Stats.questionsCorrect,
          p2Total: p2Stats.questionsTotal,
          token,
        })
      : '';
  const battleWhatsAppUrl = buildWhatsAppUrl(effectivePhone, battleMsg);




  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-auto">
        {/* Title Lockup */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">
            {mode === 'battle' ? '🏆' : '💀'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {mode === 'battle'
              ? isDraw
                ? 'HASIL SERI SEIMBANG!'
                : `${p1Wins ? p1Stats.name : p2Stats?.name} MENANG!`
              : 'GAME OVER!'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {mode === 'battle'
              ? 'Pertarungan sengit telah usai! Skor kuis & jarak lari menentukan pemenang.'
              : 'Nyawa telah habis saat menabrak rintangan. Kerja bagus, terus berlatih!'}
          </p>
        </div>

        {/* Solo Stats Card */}
        {mode === 'solo' && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 sm:p-5 mb-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700/60">
              <span className="text-3xl bg-slate-900 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-700">
                {p1Animal.emoji}
              </span>
              <div>
                <div className="font-black text-lg text-white">{p1Stats.name}</div>
                <div className="text-xs text-amber-400">{p1Animal.name}</div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Skor</div>
                <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                  {Math.floor(p1Stats.score).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Jarak Lari</div>
                <div className="text-xl font-black text-white font-mono mt-0.5">
                  {Math.floor(p1Stats.distance)}m
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Koin</div>
                <div className="text-xl font-black text-yellow-400 font-mono mt-0.5">
                  🪙 {p1Stats.coins}
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Soal Benar</div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                  {p1Stats.questionsCorrect}/{p1Stats.questionsTotal}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Battle Stats Comparison */}
        {mode === 'battle' && p2Stats && p2Animal && (
          <div className="space-y-3 mb-6">
            {/* P1 Row */}
            <div
              className={`p-4 rounded-2xl border ${
                p1Wins
                  ? 'bg-amber-500/15 border-amber-500/60 ring-2 ring-amber-400/40'
                  : 'bg-slate-800/80 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p1Animal.emoji}</span>
                  <div>
                    <div className="font-black text-sm flex items-center gap-1.5">
                      <span>{p1Stats.name}</span>
                      {p1Wins && !isDraw && <span className="text-amber-400">👑 JUARA</span>}
                    </div>
                    <div className="text-[11px] text-slate-400">{p1Animal.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Skor</div>
                  <div className="text-lg font-black font-mono text-amber-300">
                    {Math.floor(p1Stats.score).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                <span>Jarak: {Math.floor(p1Stats.distance)}m · Koin: {p1Stats.coins}</span>
                <span className="text-purple-300">
                  Kuis: {p1Stats.questionsCorrect}/{p1Stats.questionsTotal} Benar
                </span>
              </div>
            </div>

            {/* P2 Row */}
            <div
              className={`p-4 rounded-2xl border ${
                !p1Wins && !isDraw
                  ? 'bg-purple-500/15 border-purple-500/60 ring-2 ring-purple-400/40'
                  : 'bg-slate-800/80 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{p2Animal.emoji}</span>
                  <div>
                    <div className="font-black text-sm flex items-center gap-1.5">
                      <span>{p2Stats.name}</span>
                      {!p1Wins && !isDraw && <span className="text-purple-400">👑 JUARA</span>}
                    </div>
                    <div className="text-[11px] text-slate-400">{p2Animal.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Skor</div>
                  <div className="text-lg font-black font-mono text-purple-300">
                    {Math.floor(p2Stats.score).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-700/40">
                <span>Jarak: {Math.floor(p2Stats.distance)}m · Koin: {p2Stats.coins}</span>
                <span className="text-purple-300">
                  Kuis: {p2Stats.questionsCorrect}/{p2Stats.questionsTotal} Benar
                </span>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Share Card - Directed to teacher's WhatsApp number */}
        <div className="mb-5 bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              <div>
                <div className="text-xs font-bold text-white flex flex-wrap items-center gap-1.5">
                  <span>Tujuan WhatsApp Guru:</span>
                  {effectivePhone ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold rounded-lg border border-emerald-500/40">
                      {effectivePhone}
                    </span>
                  ) : (
                    <span className="text-xs text-amber-300 italic font-normal">
                      Belum ditentukan oleh guru
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {token?.teacherName
                    ? `Guru Pengampu: ${token.teacherName}`
                    : 'Kuis Latihan Soal'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowEditPhone(!showEditPhone)}
              className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer shrink-0"
            >
              {showEditPhone ? 'Tutup' : effectivePhone ? 'Ganti No. WA' : '+ Masukkan No. WA'}
            </button>
          </div>

          {showEditPhone && (
            <div className="pt-1 flex items-center gap-2">
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowEditPhone(false)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Gunakan
              </button>
            </div>
          )}

          {mode === 'solo' ? (
            <a
              href={soloWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-[0_8px_25px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2.5 text-center cursor-pointer"
            >
              <span className="text-2xl">📲</span>
              <span>KIRIM NILAI KE WHATSAPP GURU</span>
            </a>
          ) : (
            <a
              href={battleWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-[0_8px_25px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2.5 text-center cursor-pointer"
            >
              <span className="text-2xl">⚔️</span>
              <span>KIRIM LAPORAN BATTLE KE WHATSAPP GURU</span>
            </a>
          )}

          <div className="text-center text-[11px] text-slate-400">
            {effectivePhone ? (
              <span className="text-emerald-400 font-medium">
                ✔ Pesan otomatis ditujukan ke WhatsApp Guru ({effectivePhone})
              </span>
            ) : (
              <span>Format pesan resmi siap dikirimkan via WhatsApp</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            data-start="true"
            onClick={onRestart}
            className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>MAIN LAGI</span>
          </button>

          <button
            onClick={onExitToMenu}
            className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
};
