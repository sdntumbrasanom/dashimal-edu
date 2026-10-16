import React, { useState } from 'react';
import { GameMode, QuizToken } from '../types/game.ts';
import { getTokenByCode, getAllTokens, saveToken } from '../utils/tokenStore.ts';
import { buildGoogleSheetCsvUrl, parseQuestionsCsv } from '../game/quizParser.ts';
import { FullscreenButton } from './FullscreenButton.tsx';

interface LobbyScreenProps {
  mode: GameMode;
  onProceed: (data: {
    player1Name: string;
    player2Name?: string;
    token: QuizToken | null;
  }) => void;
  onBack: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ mode, onProceed, onBack }) => {
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [matchedToken, setMatchedToken] = useState<QuizToken | null>(null);
  const [tokenStatus, setTokenStatus] = useState<{
    type: 'idle' | 'matched' | 'custom' | 'sheet';
    message: string;
  }>({ type: 'idle', message: '' });

  // Optional direct sheet input toggle
  const [showSheetInput, setShowSheetInput] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [sheetLoading, setSheetLoading] = useState(false);

  const activeTokens = getAllTokens();

  const handleCheckToken = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    setTokenInput(trimmed);

    if (!trimmed) {
      setMatchedToken(null);
      setTokenStatus({ type: 'idle', message: '' });
      return;
    }

    const found = getTokenByCode(trimmed);
    if (found) {
      setMatchedToken(found);
      setTokenStatus({
        type: 'matched',
        message: `Token Terverifikasi: "${found.title}" oleh ${found.teacherName} (${found.questions.length} soal)`,
      });
    } else {
      // Allow custom token name
      setMatchedToken({
        code: trimmed,
        title: `Kuis Token ${trimmed}`,
        teacherName: 'Guru Pengampu',
        sheetUrl: '',
        questions: activeTokens[0]?.questions || [],
        createdAt: new Date().toISOString().split('T')[0],
      });
      setTokenStatus({
        type: 'custom',
        message: `Kode token "${trimmed}" siap digunakan! Laporan nilai WhatsApp akan mencatat kode token ini.`,
      });
    }
  };

  const handleSelectQuickToken = (t: QuizToken) => {
    setTokenInput(t.code);
    setMatchedToken(t);
    setTokenStatus({
      type: 'matched',
      message: `Token Terverifikasi: "${t.title}" oleh ${t.teacherName} (${t.questions.length} soal)`,
    });
  };

  const handleImportSheet = async () => {
    if (!sheetUrlInput.trim()) return;
    setSheetLoading(true);
    try {
      const csvUrl = buildGoogleSheetCsvUrl(sheetUrlInput);
      if (!csvUrl) throw new Error('Format tautan tidak valid');
      const resp = await fetch(csvUrl);
      if (!resp.ok) throw new Error('Gagal memuat spreadsheet');
      const text = await resp.text();
      const questions = parseQuestionsCsv(text);
      if (questions.length === 0) throw new Error('Tidak ada soal yang terdeteksi');

      const autoCode = (tokenInput || `TOKEN-${Date.now().toString().slice(-4)}`).toUpperCase();
      const newToken: QuizToken = {
        code: autoCode,
        title: 'Kuis Google Spreadsheet',
        teacherName: 'Bapak/Ibu Guru',
        sheetUrl: sheetUrlInput,
        questions,
        createdAt: new Date().toISOString().split('T')[0],
      };
      saveToken(newToken);
      setTokenInput(autoCode);
      setMatchedToken(newToken);
      setShowSheetInput(false);
      setTokenStatus({
        type: 'matched',
        message: `Berhasil mengimpor ${questions.length} soal dari Google Spreadsheet dengan kode "${autoCode}"!`,
      });
    } catch {
      setTokenStatus({
        type: 'custom',
        message: 'Gagal memuat otomatis. Pastikan spreadsheet publik atau gunakan token yang sudah terdaftar.',
      });
    } finally {
      setSheetLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalP1 = p1Name.trim() || 'Pemain 1';
    const finalP2 = mode === 'battle' ? p2Name.trim() || 'Pemain 2' : undefined;

    // Use matched token, or fallback to first available token with custom code name
    let finalToken = matchedToken;
    if (!finalToken) {
      const defaultToken = activeTokens[0];
      finalToken = {
        code: tokenInput.trim().toUpperCase() || (defaultToken ? defaultToken.code : 'LATIHAN'),
        title: defaultToken ? defaultToken.title : 'Kuis Latihan',
        teacherName: defaultToken ? defaultToken.teacherName : 'Bapak/Ibu Guru',
        sheetUrl: '',
        questions: defaultToken ? defaultToken.questions : [],
        createdAt: new Date().toISOString().split('T')[0],
      };
    }

    onProceed({
      player1Name: finalP1,
      player2Name: finalP2,
      token: finalToken,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
          >
            ← Ganti Mode Permainan
          </button>
          <FullscreenButton variant="header" />
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{mode === 'solo' ? '🏃‍♂️' : '⚔️'}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {mode === 'solo' ? 'Lobi Pemain Individu' : 'Lobi Pemain Battle 2 Orang'}
            </h1>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            Isi nama pemain dan masukkan kode token kuis yang diberikan oleh guru.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Player Names */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>👤</span> {mode === 'battle' ? 'Nama Pemain 1 (Sisi Kiri)' : 'Nama Lengkap Siswa'}
              </label>
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {mode === 'battle' && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <span>👤</span> Nama Pemain 2 (Sisi Kanan)
                </label>
                <input
                  type="text"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  placeholder="Contoh: Siti Aisyah"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400"
                  required
                />
              </div>
            )}
          </div>

          {/* DEDICATED TOKEN INPUT FIELD */}
          <div className="bg-slate-800/60 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase text-amber-300 flex items-center gap-1.5 tracking-wider">
                <span>🏷️</span> Kolom Pengisian Token Guru
              </label>
              <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                Wajib Diisi
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Masukkan kode token yang diberikan oleh guru Anda agar soal sesuai dengan materi pelajaran yang diajarkan:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => handleCheckToken(e.target.value)}
                placeholder="Ketik kode token guru di sini (misal: IPA-7A, MAT-01, dll)"
                className="flex-1 bg-slate-900 border-2 border-amber-500/60 rounded-xl px-4 py-3 text-amber-300 font-mono font-bold text-base focus:outline-none focus:border-amber-400 placeholder:text-slate-500 placeholder:font-normal placeholder:text-xs uppercase tracking-wider"
                required
              />
              <button
                type="button"
                onClick={() => handleCheckToken(tokenInput)}
                className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shrink-0"
              >
                Cek Token
              </button>
            </div>

            {/* Token Status Feedback */}
            {tokenStatus.message && (
              <div
                className={`p-3 rounded-xl text-xs border animate-fadeIn ${
                  tokenStatus.type === 'matched'
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-medium'
                    : 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none">
                    {tokenStatus.type === 'matched' ? '✅' : '💡'}
                  </span>
                  <div className="flex-1 leading-snug">{tokenStatus.message}</div>
                </div>
              </div>
            )}

            {/* Quick Pick from Local Tokens */}
            <div className="pt-2 border-t border-slate-700/60">
              <div className="text-[11px] font-semibold text-slate-400 mb-2">
                Atau pilih kode token yang sudah terdaftar di sekolah ini:
              </div>
              <div className="flex flex-wrap gap-2">
                {activeTokens.map((t) => (
                  <button
                    type="button"
                    key={t.code}
                    onClick={() => handleSelectQuickToken(t)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                      tokenInput === t.code
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>🔑</span>
                    <span>{t.code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Spreadsheet Link Toggle if Student has direct link */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowSheetInput(!showSheetInput)}
                className="text-[11px] text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showSheetInput ? '▼ Tutup Input Link' : '▶ Punya link Google Spreadsheet langsung? Klik di sini'}</span>
              </button>

              {showSheetInput && (
                <div className="mt-2.5 p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2 animate-fadeIn">
                  <label className="block text-[11px] text-slate-300">
                    Tempel Link Google Spreadsheet:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={sheetUrlInput}
                      onChange={(e) => setSheetUrlInput(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      disabled={sheetLoading}
                      onClick={handleImportSheet}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {sheetLoading ? 'Memuat...' : 'Impor'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-base rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>PILIH KARAKTER HEWAN</span>
            <span>→</span>
          </button>
        </form>
      </div>
    </div>
  );
};
