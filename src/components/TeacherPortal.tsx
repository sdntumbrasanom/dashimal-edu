import React, { useState } from 'react';
import { QuizToken, Question } from '../types/game.ts';
import {
  getAllTokens,
  saveToken,
  deleteToken,
  DEFAULT_TOKENS,
} from '../utils/tokenStore.ts';
import {
  buildGoogleSheetCsvUrl,
  parseQuestionsCsv,
} from '../game/quizParser.ts';
import { FullscreenButton } from './FullscreenButton.tsx';

interface TeacherPortalProps {
  onBack: () => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Form states
  const [tokens, setTokens] = useState<QuizToken[]>(getAllTokens());
  const [title, setTitle] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [customTokenCode, setCustomTokenCode] = useState('');
  const [csvDirectInput, setCsvDirectInput] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchMessage, setFetchMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savedSuccessToken, setSavedSuccessToken] = useState<string | null>(null);

  // Authentication check
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'guru' && password.trim() === 'guruhebat') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Username atau Password salah! (Hubungi 085722228896)');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleFetchSpreadsheet = async () => {
    setFetchMessage(null);
    setFetchLoading(true);

    try {
      if (!sheetUrl.trim()) {
        throw new Error('Masukkan tautan Google Spreadsheet terlebih dahulu!');
      }

      const csvUrl = buildGoogleSheetCsvUrl(sheetUrl);
      if (!csvUrl) {
        throw new Error('Format tautan Google Spreadsheet tidak valid! Pastikan link mengandung /spreadsheets/d/...');
      }

      // Try fetching public CSV
      let csvText = '';
      try {
        const resp = await fetch(csvUrl);
        if (!resp.ok) {
          throw new Error(`HTTP status: ${resp.status}`);
        }
        csvText = await resp.text();
      } catch (netErr) {
        // If direct fetch is blocked by CORS, ask user or fallback to gviz
        const gvizUrl = csvUrl.replace('/export?format=csv', '/gviz/tq?tqx=out:csv');
        const resp2 = await fetch(gvizUrl);
        if (!resp2.ok) throw netErr;
        csvText = await resp2.text();
      }

      const parsed = parseQuestionsCsv(csvText);
      if (parsed.length === 0) {
        throw new Error('Tidak ada soal yang ditemukan dalam spreadsheet. Pastikan kolom A (soal) dan kolom B (jawaban) terisi.');
      }

      setPreviewQuestions(parsed);
      setFetchMessage({
        type: 'success',
        text: `Berhasil mengambil ${parsed.length} soal dari Google Spreadsheet!`,
      });
      if (!customTokenCode) {
        setCustomTokenCode(generateRandomCode());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengakses spreadsheet';
      setFetchMessage({
        type: 'error',
        text: `${msg}. Pastikan spreadsheet telah diatur "Siapa saja yang memiliki link dapat melihat" (Akses Publik), atau gunakan fitur Tempel CSV di bawah.`,
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const handleParseCsvDirect = () => {
    if (!csvDirectInput.trim()) {
      setFetchMessage({ type: 'error', text: 'Teks CSV kosong!' });
      return;
    }
    const parsed = parseQuestionsCsv(csvDirectInput);
    if (parsed.length === 0) {
      setFetchMessage({ type: 'error', text: 'Gagal memproses baris CSV. Pastikan format sesuai.' });
      return;
    }
    setPreviewQuestions(parsed);
    setFetchMessage({
      type: 'success',
      text: `Berhasil memuat ${parsed.length} soal dari teks CSV!`,
    });
    if (!customTokenCode) {
      setCustomTokenCode(generateRandomCode());
    }
  };

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewQuestions.length === 0) {
      setFetchMessage({ type: 'error', text: 'Harap ambil atau masukkan soal terlebih dahulu sebelum menyimpan!' });
      return;
    }

    const code = (customTokenCode || generateRandomCode()).toUpperCase().trim();
    const newToken: QuizToken = {
      code,
      title: title.trim() || 'Kuis Latihan Soal',
      teacherName: teacherName.trim() || 'Bapak/Ibu Guru',
      teacherPhone: teacherPhone.trim(),
      sheetUrl: sheetUrl.trim() || 'Input Manual CSV',
      questions: previewQuestions,
      createdAt: new Date().toISOString().split('T')[0],
    };

    saveToken(newToken);
    setTokens(getAllTokens());
    setSavedSuccessToken(code);

    // Reset form
    setTitle('');
    setTeacherName('');
    setSheetUrl('');
    setCsvDirectInput('');
    setCustomTokenCode('');
    setPreviewQuestions([]);
  };

  const handleDelete = (code: string) => {
    if (confirm(`Hapus token "${code}"?`)) {
      deleteToken(code);
      setTokens(getAllTokens());
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Token "${text}" disalin ke clipboard!`);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-white">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 border border-blue-500/30">
              👨‍🏫
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Portal Khusus Guru</h1>
            <p className="text-sm text-slate-400 mt-1">
              Kelola soal kuis Google Spreadsheet & buat token game murid
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Username Guru
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan Username"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan Password"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all text-sm cursor-pointer"
            >
              Masuk ke Dashboard Guru
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Petunjuk: Masukkan Username dan Password</span>
            <button
              onClick={onBack}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              ← Kembali ke Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Teacher Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👨‍🏫</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Dashboard Manajemen Guru
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Tambahkan link Google Spreadsheet untuk membuat token soal bagi para pemain/murid
            </p>
          </div>
          <div className="flex items-center gap-3">
            <FullscreenButton variant="header" />
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              Keluar
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
            >
              🎮 Mainkan Game
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {savedSuccessToken && (
          <div className="mb-6 p-4 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div>
              <div className="font-bold text-emerald-300 text-base">
                🎉 Token Soal Berhasil Dibuat:
              </div>
              <div className="text-sm text-slate-200 mt-0.5">
                Bagikan kode <span className="font-mono font-black text-xl text-amber-300 px-2 py-0.5 bg-slate-900 rounded">{savedSuccessToken}</span> kepada murid untuk mulai bermain!
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(savedSuccessToken)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Salin Kode Token
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form to create token */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>➕</span> Buat Token Kuis Baru dari Google Spreadsheet
              </h2>

              {/* Instructions Box */}
              <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-4 mb-5 text-xs text-blue-200 space-y-2">
                <div className="font-bold text-blue-100 flex items-center gap-1.5">
                  <span>📋</span> Format Kolom Google Spreadsheet yang didukung:
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 font-mono text-[11px] text-center pt-1">
                  <div className="p-1.5 bg-blue-900/60 rounded border border-blue-700/50">
                    <span className="font-bold block text-amber-300">Kolom A</span>
                    Pertanyaan
                  </div>
                  <div className="p-1.5 bg-emerald-900/60 rounded border border-emerald-700/50">
                    <span className="font-bold block text-emerald-300">Kolom B</span>
                    Jawaban Benar
                  </div>
                  <div className="p-1.5 bg-slate-800/80 rounded border border-slate-700">
                    <span className="font-bold block text-slate-400">Kolom C</span>
                    Opsi Lain 1
                  </div>
                  <div className="p-1.5 bg-slate-800/80 rounded border border-slate-700">
                    <span className="font-bold block text-slate-400">Kolom D</span>
                    Opsi Lain 2
                  </div>
                  <div className="p-1.5 bg-slate-800/80 rounded border border-slate-700">
                    <span className="font-bold block text-slate-400">Kolom E</span>
                    Opsi Lain 3
                  </div>
                </div>
                <p className="text-[11px] text-blue-300/80 pt-1">
                  *Pastikan Google Spreadsheet diatur aksesnya ke <strong>"Siapa saja yang memiliki link dapat melihat"</strong>.
                </p>
              </div>

              <form onSubmit={handleSaveToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Link Google Spreadsheet
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      disabled={fetchLoading}
                      onClick={handleFetchSpreadsheet}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer"
                    >
                      {fetchLoading ? 'Mengambil...' : 'Ambil Soal'}
                    </button>
                  </div>
                </div>

                {/* Alternative Direct CSV Input accordion */}
                <details className="text-xs text-slate-400 group">
                  <summary className="cursor-pointer text-blue-400 hover:underline list-none flex items-center gap-1">
                    <span>▶ Atau tempel teks CSV langsung secara manual</span>
                  </summary>
                  <div className="mt-2 space-y-2">
                    <textarea
                      rows={4}
                      value={csvDirectInput}
                      onChange={(e) => setCsvDirectInput(e.target.value)}
                      placeholder={`Pertanyaan,Jawaban Benar,Opsi 1,Opsi 2,Opsi 3\nApa ibukota Indonesia?,Nusantara,Jakarta,Surabaya,Bandung`}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs font-mono placeholder-slate-600"
                    />
                    <button
                      type="button"
                      onClick={handleParseCsvDirect}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Proses Teks CSV
                    </button>
                  </div>
                </details>

                {fetchMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs border ${
                      fetchMessage.type === 'success'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {fetchMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Judul / Topik Kuis
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: IPA Bab 4 Hewan"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Guru
                    </label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="Contoh: {Pak Misbah}, S.PdI."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kode Token Kuis (Opsi Kustom)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTokenCode}
                        onChange={(e) => setCustomTokenCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: IPA-7A"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomTokenCode(generateRandomCode())}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 cursor-pointer"
                        title="Acak Kode"
                      >
                        🎲 Acak
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      No. WhatsApp Guru (Opsional)
                    </label>
                    <input
                      type="tel"
                      value={teacherPhone}
                      onChange={(e) => setTeacherPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Questions Preview Accordion */}
                {previewQuestions.length > 0 && (
                  <div className="border border-slate-800 rounded-xl p-3 bg-slate-800/40">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                      <span>Pratinjau Soal ({previewQuestions.length} Soal Terdeteksi):</span>
                      <span className="text-emerald-400">Siap Disimpan</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {previewQuestions.map((q, idx) => (
                        <div key={idx} className="bg-slate-800 p-2 rounded text-xs">
                          <div className="font-semibold text-slate-200">
                            {idx + 1}. {q.question}
                          </div>
                          <div className="text-emerald-400 mt-0.5">
                            ✔ Kunci: {q.correctAnswer}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Opsi: {q.options.join(' | ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={previewQuestions.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold rounded-xl shadow-lg transition-all text-sm cursor-pointer"
                >
                  💾 Simpan & Terbitkan Token Game
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: List of Tokens */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>🔑</span> Daftar Token Aktif
                </span>
                <span className="text-xs font-normal text-slate-400">
                  {tokens.length} Token Tersedia
                </span>
              </h2>

              <p className="text-xs text-slate-400 mb-4">
                Setiap guru dapat membuat token tersendiri tanpa mengganggu game atau token guru lain.
              </p>

              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {tokens.map((token) => (
                  <div
                    key={token.code}
                    className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-xl transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-black text-amber-300 text-lg px-2.5 py-0.5 bg-slate-900 border border-amber-500/30 rounded-lg">
                        {token.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyToClipboard(token.code)}
                          className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Salin
                        </button>
                        <button
                          onClick={() => handleDelete(token.code)}
                          className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs cursor-pointer"
                          title="Hapus"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="font-bold text-sm text-slate-100">{token.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Guru: <span className="text-slate-300">{token.teacherName}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50 text-[11px] text-slate-400">
                      <span>{token.questions.length} Butir Soal</span>
                      <span>Dibuat: {token.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
