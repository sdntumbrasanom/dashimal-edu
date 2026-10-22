import React, { useState, useEffect } from 'react';
import { GameMode, LeaderboardEntry } from '../types/game.ts';
import { ANIMALS } from '../game/animalsData.ts';
import {
  getLeaderboardEntries,
  fetchLeaderboardFromSpreadsheet,
  normalizeTokenCode,
  resetLeaderboardToDefault,
} from '../utils/leaderboardStore.ts';
import { getAllTokens } from '../utils/tokenStore.ts';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightEntryId?: string;
  initialModeFilter?: GameMode | 'all';
  initialTokenCode?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  highlightEntryId,
  initialModeFilter = 'all',
  initialTokenCode,
}) => {
  const [selectedToken, setSelectedToken] = useState<string>(() =>
    normalizeTokenCode(initialTokenCode)
  );
  const [modeFilter, setModeFilter] = useState<GameMode | 'all'>(initialModeFilter);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() =>
    getLeaderboardEntries('all', normalizeTokenCode(initialTokenCode))
  );
  const [isLoadingOnline, setIsLoadingOnline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const allKnownTokens = getAllTokens();

  // Load from spreadsheet when modal opens or selectedToken changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingOnline(true);
    setSyncStatus('Menghubungkan ke Google Spreadsheet...');

    // Load current memory first
    setEntries(getLeaderboardEntries(modeFilter, selectedToken));

    fetchLeaderboardFromSpreadsheet(selectedToken)
      .then((data) => {
        if (!isMounted) return;
        setEntries(data);
        setSyncStatus(`Tersinkron dengan Tab Skor_${selectedToken}`);
      })
      .catch(() => {
        if (!isMounted) return;
        setSyncStatus('Mode offline / cache memori');
      })
      .finally(() => {
        if (isMounted) setIsLoadingOnline(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedToken]);

  if (!isOpen) return null;

  const filteredEntries =
    modeFilter === 'all' ? entries : entries.filter((e) => e.mode === modeFilter);

  const handleRefresh = async () => {
    setIsLoadingOnline(true);
    setSyncStatus('Menyegarkan dari Google Spreadsheet...');
    try {
      const data = await fetchLeaderboardFromSpreadsheet(selectedToken);
      setEntries(data);
      setSyncStatus(`Berhasil diperbarui dari Tab Skor_${selectedToken}`);
    } catch {
      setSyncStatus('Gagal menyegarkan spreadsheet');
    } finally {
      setIsLoadingOnline(false);
    }
  };

  const handleReset = () => {
    if (confirm('Kembalikan papan skor memori ke data awal?')) {
      resetLeaderboardToDefault();
      setEntries(getLeaderboardEntries('all', selectedToken));
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg border border-yellow-200">
            🥇
          </span>
        );
      case 2:
        return (
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-md border border-white/40">
            🥈
          </span>
        );
      case 3:
        return (
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 text-white font-black text-sm flex items-center justify-center shadow border border-amber-500/50">
            🥉
          </span>
        );
      default:
        return (
          <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-700">
            #{rank}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-500/30">
              🏆
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>PAPAN SKOR SPREADSHEET</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  TOP {filteredEntries.length}
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Tersimpan di Google Spreadsheet</span>
                <span className="text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  Tab: Skor_{selectedToken}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-lg border border-slate-700 cursor-pointer transition-colors shrink-0"
            title="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Token Selector Bar */}
        <div className="pt-3 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Pilih Token Soal:</span>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(normalizeTokenCode(e.target.value))}
              className="bg-slate-950 text-emerald-300 border border-emerald-500/40 rounded-xl px-2.5 py-1 font-mono text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="UMUM">UMUM (Tanpa Token)</option>
              {allKnownTokens.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.code} - {t.title.slice(0, 26)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoadingOnline}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Muat ulang dari Google Spreadsheet"
          >
            <span className={isLoadingOnline ? 'animate-spin inline-block' : ''}>🔄</span>
            <span>{isLoadingOnline ? 'Menghubungkan...' : 'Segarkan Spreadsheet'}</span>
          </button>
        </div>

        {/* Filter Tabs & Status */}
        <div className="flex items-center justify-between gap-2 my-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setModeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                modeFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Mode
            </button>
            <button
              onClick={() => setModeFilter('solo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                modeFilter === 'solo'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏃 Solo
            </button>
            <button
              onClick={() => setModeFilter('battle')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                modeFilter === 'battle'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚔️ Battle
            </button>
          </div>

          <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
            {syncStatus || (isLoadingOnline ? 'Memuat spreadsheet...' : 'Data aktif')}
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
          {isLoadingOnline && filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center gap-2">
              <span className="text-2xl animate-spin">⏳</span>
              <span>Sedang mengambil data skor dari Google Spreadsheet Tab Skor_{selectedToken}...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Belum ada riwayat skor pada token <strong>{selectedToken}</strong>. Mainkan kuis untuk mencatat skormu langsung ke spreadsheet!
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const rank = index + 1;
              const isHighlighted = highlightEntryId === entry.id;
              const animal = ANIMALS.find((a) => a.id === entry.animalId);

              return (
                <div
                  key={entry.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isHighlighted
                      ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                      : rank === 1
                      ? 'bg-slate-800/90 border-amber-500/40'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  {/* Left: Rank & Player Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{getRankBadge(rank)}</div>

                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                      {animal?.emoji || '🐾'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-sm text-white truncate">
                          {entry.playerName}
                        </span>
                        {isHighlighted && (
                          <span className="bg-emerald-500 text-slate-950 font-black text-[9px] uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0">
                            Lari Kamu!
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border shrink-0 ${
                            entry.mode === 'battle'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {entry.mode === 'battle' ? 'Battle' : 'Solo'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{animal?.name || 'Karakter'}</span>
                        <span>•</span>
                        <span>{entry.dateStr}</span>
                        {entry.tokenCode && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-emerald-300 text-[10px]">
                              {entry.tokenCode}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Scores & Stats */}
                  <div className="text-right shrink-0">
                    <div className="font-black font-mono text-base sm:text-lg text-amber-300">
                      {entry.score.toLocaleString('id-ID')}
                      <span className="text-xs font-normal text-amber-400/80 ml-1">Poin</span>
                    </div>

                    <div className="text-[10px] sm:text-[11px] text-slate-300 flex items-center justify-end gap-2 mt-0.5">
                      <span className="text-emerald-400 font-medium">
                        ✔ {entry.questionsCorrect}/{entry.questionsTotal} Soal
                      </span>
                      <span>•</span>
                      <span className="text-yellow-400 font-medium">🪙 {entry.coins}</span>
                      <span>•</span>
                      <span className="text-slate-400">{Math.floor(entry.distance)}m</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="truncate">
            Skor dihitung dari: (Soal Benar × 100) + (Koin × 10)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer transition-colors shrink-0 ml-2"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
