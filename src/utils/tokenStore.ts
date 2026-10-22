import { QuizToken } from '../types/game.ts';

const STORAGE_KEY = 'subway_surfers_edu_tokens_v1';

export const DEFAULT_TOKENS: QuizToken[] = [
  {
    code: 'IPA-JUARA',
    title: 'Kuis IPA: Hewan & Ekosistem',
    teacherName: 'Ibu Guru Wahyuni, S.Pd.',
    teacherPhone: '081234567890',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/demo-ipa-juara/edit',
    createdAt: '2026-10-10',
    questions: [
      {
        id: 'ipa-1',
        question: 'Hewan yang memakan tumbuhan dan daging disebut kelompok...',
        correctAnswer: 'Omnivora',
        options: ['Karnivora', 'Omnivora', 'Herbivora', 'Insektivora'],
      },
      {
        id: 'ipa-2',
        question: 'Katak bernapas saat masih berupa berudu menggunakan...',
        correctAnswer: 'Insang',
        options: ['Paru-paru', 'Kulit basah', 'Insang', 'Trakea'],
      },
      {
        id: 'ipa-3',
        question: 'Proses tumbuhan hijau membuat makanan dengan cahaya matahari adalah...',
        correctAnswer: 'Fotosintesis',
        options: ['Metamorfosis', 'Respirasi', 'Evaporasi', 'Fotosintesis'],
      },
      {
        id: 'ipa-4',
        question: 'Hewan berikut yang mengalami metamorfosis sempurna adalah...',
        correctAnswer: 'Kupu-kupu',
        options: ['Kupu-kupu', 'Belalang', 'Kecoa', 'Ayam'],
      },
      {
        id: 'ipa-5',
        question: 'Kelinci termasuk hewan mamalia karena berkembang biak dengan cara...',
        correctAnswer: 'Melahirkan (Vivipar)',
        options: ['Bertelur (Ovipar)', 'Melahirkan (Vivipar)', 'Ovovivipar', 'Membelah diri'],
      },
      {
        id: 'ipa-6',
        question: 'Organ gerak utama pada burung untuk terbang di udara adalah...',
        correctAnswer: 'Sayap',
        options: ['Kaki', 'Ekor', 'Sayap', 'Paruh'],
      },
    ],
  },
  {
    code: 'MAT-SERU',
    title: 'Kuis Matematika: Cepat & Tepat',
    teacherName: 'Pak Budi Santoso, M.Pd.',
    teacherPhone: '081987654321',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/demo-matematika/edit',
    createdAt: '2026-10-12',
    questions: [
      {
        id: 'mat-1',
        question: 'Berapakah hasil dari 15 x 6 + 10?',
        correctAnswer: '100',
        options: ['90', '100', '110', '95'],
      },
      {
        id: 'mat-2',
        question: 'Bentuk persen (%) dari pecahan 3/4 adalah...',
        correctAnswer: '75%',
        options: ['50%', '60%', '80%', '75%'],
      },
      {
        id: 'mat-3',
        question: 'Sebuah persegi memiliki sisi 8 cm. Berapakah kelilingnya?',
        correctAnswer: '32 cm',
        options: ['64 cm', '32 cm', '16 cm', '24 cm'],
      },
      {
        id: 'mat-4',
        question: 'Berapakah akar kuadrat dari 144?',
        correctAnswer: '12',
        options: ['14', '11', '12', '16'],
      },
      {
        id: 'mat-5',
        question: 'Jika 3 pulpen harganya Rp 9.000, berapakah harga 5 pulpen?',
        correctAnswer: 'Rp 15.000',
        options: ['Rp 12.000', 'Rp 18.000', 'Rp 15.000', 'Rp 20.000'],
      },
    ],
  },
  {
    code: 'BAHASA-ID',
    title: 'Kuis Bahasa Indonesia: Kosakata & Makna',
    teacherName: 'Ibu Ratna Dewi, S.Pd.',
    teacherPhone: '085722228896',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/demo-bahasa/edit',
    createdAt: '2026-10-13',
    questions: [
      {
        id: 'bi-1',
        question: 'Sinonim (persamaan kata) dari "Giat" adalah...',
        correctAnswer: 'Rajin',
        options: ['Malas', 'Rajin', 'Lambat', 'Lengah'],
      },
      {
        id: 'bi-2',
        question: 'Antonim (lawan kata) dari "Maju" adalah...',
        correctAnswer: 'Mundur',
        options: ['Berhenti', 'Naik', 'Jatuh', 'Mundur'],
      },
      {
        id: 'bi-3',
        question: 'Ungkapan "Kutu Buku" bermakna orang yang...',
        correctAnswer: 'Sangat gemar membaca buku',
        options: [
          'Suka merusak buku',
          'Sangat gemar membaca buku',
          'Menjual buku di pasar',
          'Menulis banyak buku',
        ],
      },
      {
        id: 'bi-4',
        question: 'Tanda baca yang tepat untuk mengakhiri kalimat tanya adalah...',
        correctAnswer: 'Tanda tanya (?)',
        options: ['Tanda seru (!)', 'Tanda titik (.)', 'Tanda tanya (?)', 'Tanda koma (,)'],
      },
    ],
  },
];

export function getAllTokens(): QuizToken[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TOKENS));
      return DEFAULT_TOKENS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Synchronize default tokens with latest questions distribution and phone
      const merged = parsed.map((item: QuizToken) => {
        const match = DEFAULT_TOKENS.find(
          (d) => d.code.toUpperCase() === item.code?.toUpperCase()
        );
        if (match) {
          return {
            ...match,
            teacherPhone: item.teacherPhone || match.teacherPhone,
          };
        }
        return item;
      });
      return merged;
    }
    return DEFAULT_TOKENS;
  } catch (err) {
    console.error('Error loading tokens from storage', err);
    return DEFAULT_TOKENS;
  }
}

export function getTokenByCode(code: string): QuizToken | null {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  const all = getAllTokens();
  return all.find((t) => t.code.trim().toUpperCase() === cleanCode) || null;
}

export function saveToken(token: QuizToken): boolean {
  try {
    const all = getAllTokens();
    const existingIndex = all.findIndex(
      (t) => t.code.trim().toUpperCase() === token.code.trim().toUpperCase()
    );

    if (existingIndex >= 0) {
      all[existingIndex] = token;
    } else {
      all.unshift(token);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch (err) {
    console.error('Failed to save token', err);
    return false;
  }
}

export function deleteToken(code: string): boolean {
  try {
    const all = getAllTokens();
    const filtered = all.filter(
      (t) => t.code.trim().toUpperCase() !== code.trim().toUpperCase()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Failed to delete token', err);
    return false;
  }
}

export function updateTokenPhone(code: string, teacherPhone: string): boolean {
  try {
    const all = getAllTokens();
    const target = all.find(
      (t) => t.code.trim().toUpperCase() === code.trim().toUpperCase()
    );
    if (target) {
      target.teacherPhone = teacherPhone.trim();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to update token phone', err);
    return false;
  }
}

const SECRET_PREFIX = 'enc_v1:';

function obfuscateSecret(val: string): string {
  if (!val) return '';
  try {
    if (val.startsWith(SECRET_PREFIX)) return val;
    const bytes = new TextEncoder().encode(val);
    const shifted = Array.from(bytes).map((b, i) => b ^ (0x5a + (i % 7)));
    let binStr = '';
    for (let i = 0; i < shifted.length; i++) {
      binStr += String.fromCharCode(shifted[i]);
    }
    return `${SECRET_PREFIX}${btoa(binStr)}`;
  } catch {
    return val;
  }
}

function deobfuscateSecret(stored: string): string {
  if (!stored) return '';
  if (!stored.startsWith(SECRET_PREFIX)) {
    return stored;
  }
  try {
    const b64 = stored.slice(SECRET_PREFIX.length);
    const binStr = atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i) ^ (0x5a + (i % 7));
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

export function maskAppsScriptUrl(url: string): string {
  if (!url || !url.trim()) return '(Belum dikonfigurasi)';
  const clean = url.trim();
  const match = clean.match(/^(https?:\/\/script\.google\.com\/macros\/s\/)([^/]+)(\/exec.*)?$/i);
  if (match) {
    const prefix = match[1];
    const key = match[2];
    const suffix = match[3] || '/exec';
    const visiblePrefix = key.slice(0, 4);
    const visibleSuffix = key.slice(-4);
    return `${prefix}${visiblePrefix}••••••••••••${visibleSuffix}${suffix}`;
  }
  if (clean.length > 20) {
    return `${clean.slice(0, 12)}••••••••••••${clean.slice(-6)}`;
  }
  return '•••••••••••• (Tersembunyi)';
}

export const APPS_SCRIPT_URL_KEY = 'subway_apps_script_url';
export const APPS_SCRIPT_KEY_STORAGE = 'subway_apps_script_secret_key';

let runtimeManualUrl = '';

/**
 * Mengatur URL Apps Script yang dimasukkan secara manual di kode TeacherPortal.tsx
 */
export function setManualAppsScriptUrl(url: string): void {
  runtimeManualUrl = url ? url.trim() : '';
}

export function getAppsScriptUrl(): string {
  if (runtimeManualUrl) {
    return runtimeManualUrl;
  }
  try {
    const raw = localStorage.getItem(APPS_SCRIPT_URL_KEY);
    if (!raw) return '';
    const decoded = deobfuscateSecret(raw);
    if (raw && !raw.startsWith(SECRET_PREFIX)) {
      try {
        localStorage.setItem(APPS_SCRIPT_URL_KEY, obfuscateSecret(raw));
      } catch {}
    }
    return decoded;
  } catch {
    return '';
  }
}

export function setAppsScriptUrl(url: string): void {
  try {
    const clean = url.trim();
    if (!clean) {
      localStorage.removeItem(APPS_SCRIPT_URL_KEY);
    } else {
      localStorage.setItem(APPS_SCRIPT_URL_KEY, obfuscateSecret(clean));
    }
  } catch (err) {
    console.error('Gagal menyimpan URL database', err);
  }
}

export function getAppsScriptSecretKey(): string {
  try {
    const raw = localStorage.getItem(APPS_SCRIPT_KEY_STORAGE);
    if (!raw) return '';
    return deobfuscateSecret(raw);
  } catch {
    return '';
  }
}

export function setAppsScriptSecretKey(key: string): void {
  try {
    const clean = key.trim();
    if (!clean) {
      localStorage.removeItem(APPS_SCRIPT_KEY_STORAGE);
    } else {
      localStorage.setItem(APPS_SCRIPT_KEY_STORAGE, obfuscateSecret(clean));
    }
  } catch (err) {
    console.error('Gagal menyimpan PIN database', err);
  }
}

export function clearAppsScriptConfig(): void {
  try {
    localStorage.removeItem(APPS_SCRIPT_URL_KEY);
    localStorage.removeItem(APPS_SCRIPT_KEY_STORAGE);
  } catch {}
}

/**
 * Menyimpan token kuis secara online ke Spreadsheet melalui Google Apps Script Web App
 * sekaligus menyimpannya ke memori lokal browser.
 */
export async function saveTokenOnline(token: QuizToken): Promise<{
  success: boolean;
  syncedOnline: boolean;
  message?: string;
}> {
  // Selalu simpan di lokal terlebih dahulu
  saveToken(token);

  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) {
    return {
      success: true,
      syncedOnline: false,
      message: 'Token tersimpan di memori perangkat ini. Hubungkan URL Google Apps Script di menu Portal Guru agar siswa di HP atau laptop lain dapat langsung membuka kuis dengan kode token ini.',
    };
  }

  const secretKey = getAppsScriptSecretKey();

  try {
    // Kirim POST dengan header text/plain agar tidak terkena pembatasan CORS preflight browser
    const payload = JSON.stringify({
      action: 'save',
      token,
      key: secretKey || undefined,
    });

    let syncSuccess = false;
    let syncErrorReason = '';

    try {
      const resp = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload,
      });
      const text = await resp.text();
      try {
        const data = JSON.parse(text);
        if (data && data.status === 'success') {
          syncSuccess = true;
        } else if (data && data.message) {
          syncErrorReason = data.message;
        }
      } catch {
        if (text.includes('You need permission') || text.includes('accounts.google.com') || text.includes('You need access')) {
          syncErrorReason = 'Akses Google Apps Script Terkunci: Pada saat Deploy Web App, opsi "Siapa yang memiliki akses (Who has access)" harus disetel ke "Siapa saja (Anyone)". Saat ini masih terkunci untuk akun Anda saja.';
        }
      }
    } catch {
      // Fallback via GET jika POST diblokir oleh ekstensi atau lingkungan jaringan
      try {
        const sep = scriptUrl.includes('?') ? '&' : '?';
        let getUrl = `${scriptUrl}${sep}action=save&payload=${encodeURIComponent(JSON.stringify(token))}`;
        if (secretKey) {
          getUrl += `&key=${encodeURIComponent(secretKey)}`;
        }
        const getResp = await fetch(getUrl, { method: 'GET' });
        const getText = await getResp.text();
        try {
          const getData = JSON.parse(getText);
          if (getData && getData.status === 'success') {
            syncSuccess = true;
          } else if (getData && getData.message) {
            syncErrorReason = getData.message;
          }
        } catch {
          if (getText.includes('You need permission') || getText.includes('accounts.google.com') || getText.includes('You need access')) {
            syncErrorReason = 'Akses Google Apps Script Terkunci: Pada saat Deploy Web App, opsi "Siapa yang memiliki akses (Who has access)" harus disetel ke "Siapa saja (Anyone)".';
          }
        }
      } catch {}
    }

    return {
      success: true,
      syncedOnline: syncSuccess,
      message: syncSuccess
        ? `Token "${token.code}" berhasil disimpan ke Google Spreadsheet online! Siswa di HP atau perangkat lain dapat langsung membukanya.`
        : (syncErrorReason || `Token "${token.code}" tersimpan di lokal (Peringatan: Gagal disinkronkan ke spreadsheet online).`),
    };
  } catch (err) {
    console.warn('Gagal sinkronisasi ke Database Spreadsheet online (koneksi terganggu)');
    return {
      success: true,
      syncedOnline: false,
      message: `Token tersimpan di lokal (Peringatan koneksi online: ${err instanceof Error ? err.message : 'Jaringan terputus'}).`,
    };
  }
}

/**
 * Mencari token kuis di Database Google Spreadsheet online jika belum ada di lokal,
 * atau mengambil versi terbaru dari spreadsheet.
 */
export async function fetchTokenOnline(code: string): Promise<QuizToken | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  // Cek lokal terlebih dahulu
  const localMatch = getTokenByCode(cleanCode);

  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) {
    return localMatch;
  }

  const secretKey = getAppsScriptSecretKey();

  try {
    const sep = scriptUrl.includes('?') ? '&' : '?';
    let queryUrl = `${scriptUrl}${sep}action=get&code=${encodeURIComponent(cleanCode)}`;
    if (secretKey) {
      queryUrl += `&key=${encodeURIComponent(secretKey)}`;
    }
    const resp = await fetch(queryUrl);
    const text = await resp.text();
    try {
      const data = JSON.parse(text);
      if (data && data.status === 'success' && data.found && data.token) {
        const onlineToken = data.token as QuizToken;
        // Simpan ke cache lokal agar bisa dimainkan offline berikutnya
        saveToken(onlineToken);
        return onlineToken;
      }
    } catch {
      // Respons bukan JSON (misal Google login page jika akses belum dibuka publik)
    }
  } catch {
    // Abaikan kegagalan jaringan agar siswa tetap bisa main offline jika ada
  }

  return localMatch;
}

/**
 * Mengambil semua daftar token kuis yang terdaftar di Google Spreadsheet
 * dan menggabungkannya ke penyimpanan lokal perangkat.
 */
export async function syncAllTokensFromOnline(): Promise<QuizToken[]> {
  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) {
    return getAllTokens();
  }

  const secretKey = getAppsScriptSecretKey();

  try {
    const sep = scriptUrl.includes('?') ? '&' : '?';
    let queryUrl = `${scriptUrl}${sep}action=list`;
    if (secretKey) {
      queryUrl += `&key=${encodeURIComponent(secretKey)}`;
    }
    const resp = await fetch(queryUrl);
    const text = await resp.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      if (text.includes('You need permission') || text.includes('accounts.google.com') || text.includes('You need access')) {
        throw new Error('Akses Google Apps Script Terkunci! Opsi "Siapa yang memiliki akses (Who has access)" pada New Deployment di Apps Script harus diubah menjadi "Siapa saja (Anyone)".');
      }
      throw parseErr;
    }

    if (data && data.status === 'success' && Array.isArray(data.tokens) && data.tokens.length > 0) {
      const onlineTokens: QuizToken[] = data.tokens;
      const currentLocal = getAllTokens();

      // Gabungkan token online dengan default lokal
      const mergedMap = new Map<string, QuizToken>();
      currentLocal.forEach((t) => mergedMap.set(t.code.toUpperCase(), t));
      onlineTokens.forEach((t) => mergedMap.set(t.code.toUpperCase(), t));

      const mergedList = Array.from(mergedMap.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedList));
      return mergedList;
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Akses Google Apps Script Terkunci')) {
      throw err;
    }
  }

  return getAllTokens();
}

/**
 * Menghapus token secara lokal dan di Spreadsheet online.
 */
export async function deleteTokenOnline(code: string): Promise<boolean> {
  deleteToken(code);
  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) return true;

  const secretKey = getAppsScriptSecretKey();

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete', code, key: secretKey || undefined }),
    });
  } catch {}
  return true;
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE_CODE = `/**
 * GOOGLE APPS SCRIPT DATABASE DASHIMAL EDU (SUBWAY SURFERS EDUKASI)
 * Skrip ini bertindak sebagai Database Web API untuk menyimpan & membaca token soal kuis
 * agar dapat diakses oleh siswa di HP, tablet, dan komputer yang berbeda!
 *
 * FITUR KEAMANAN:
 * - URL & Akses Web App disembunyikan/dienkripsi dari antarmuka siswa.
 * - Anda dapat mengisi API_SECRET_KEY di bawah ini jika ingin mengunci database dengan PIN/Password.
 *
 * CARA PASANG (1 MENIT):
 * 1. Buka spreadsheet baru di https://sheets.new (atau gunakan spreadsheet Anda).
 * 2. Klik menu: Ekstensi (Extensions) > Apps Script.
 * 3. Hapus kode bawaan (myFunction), lalu paste seluruh kode di bawah ini.
 * 4. (Opsional): Atur API_SECRET_KEY di baris 20 jika ingin membatasi akses dengan PIN rahasia.
 * 5. Klik ikon Simpan (Disket).
 * 6. Klik tombol biru: Terapkan (Deploy) > Penerapan baru (New deployment).
 * 7. Pilih jenis: Aplikasi web (Web app).
 * 8. Konfigurasi:
 *    - Deskripsi: Database Soal Dashimal Edu
 *    - Jalankan sebagai: Saya (email Anda)
 *    - Siapa yang memiliki akses: Siapa saja (Anyone)  <-- WAJIB PILIH INI!
 * 9. Klik Terapkan (Deploy), berikan izin (Authorize access), lalu salin URL Aplikasi Web (/exec).
 * 10. Tempelkan URL tersebut ke Portal Guru di Dashimal Edu!
 */

// =========================================================================
// KUNCI KEAMANAN RAHASIA / PIN DATABASE (OPSIONAL)
// Kosongkan ("") jika tidak ingin membatasi dengan PIN tambahan.
// Atau isi misal: "GURU2026" jika ingin hanya yang tahu PIN ini yang bisa akses.
// =========================================================================
var API_SECRET_KEY = "";

function isAuthorized(e, data) {
  if (!API_SECRET_KEY || API_SECRET_KEY.toString().trim() === '') {
    return true; // Mode publik/terbuka (akses diamankan oleh kerahasiaan URL)
  }
  var incomingKey = (e && e.parameter && e.parameter.key) || (data && data.key) || '';
  return String(incomingKey).trim() === API_SECRET_KEY.toString().trim();
}

function doGet(e) {
  if (!isAuthorized(e, null)) {
    return createJsonResponse({
      status: 'error',
      message: 'Akses ditolak: Kunci PIN keamanan database tidak cocok atau belum diatur.'
    });
  }

  var action = (e && e.parameter && e.parameter.action) || 'list';
  var code = e && e.parameter && e.parameter.code;
  var sheet = getOrCreateSheet();

  if (action === 'get' && code) {
    var token = findTokenByCode(sheet, code);
    if (token) {
      return createJsonResponse({ status: 'success', found: true, token: token });
    } else {
      return createJsonResponse({ status: 'success', found: false, message: 'Token tidak ditemukan' });
    }
  }

  if (action === 'list') {
    var tokens = getAllTokensFromSheet(sheet);
    return createJsonResponse({ status: 'success', tokens: tokens });
  }

  if (action === 'save' && e.parameter.payload) {
    try {
      var parsed = JSON.parse(decodeURIComponent(e.parameter.payload));
      var saved = saveTokenToSheet(sheet, parsed);
      return createJsonResponse({ status: 'success', message: 'Token berhasil disimpan', token: saved });
    } catch(err) {
      return createJsonResponse({ status: 'error', message: err.toString() });
    }
  }

  return createJsonResponse({ status: 'success', message: 'API Dashimal Edu Aktif' });
}

function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    if (!isAuthorized(e, data)) {
      return createJsonResponse({
        status: 'error',
        message: 'Akses ditolak: Kunci PIN keamanan database tidak cocok.'
      });
    }

    if (data.action === 'save' && data.token) {
      var saved = saveTokenToSheet(sheet, data.token);
      return createJsonResponse({ status: 'success', message: 'Token berhasil disimpan ke spreadsheet', token: saved });
    }

    if (data.action === 'delete' && data.code) {
      deleteTokenFromSheet(sheet, data.code);
      return createJsonResponse({ status: 'success', message: 'Token berhasil dihapus' });
    }

    return createJsonResponse({ status: 'error', message: 'Aksi tidak dikenali' });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tokens');
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName('Tokens');
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Kode Token', 'Judul Kuis', 'Nama Guru', 'No WA Guru', 'URL Spreadsheet', 'Daftar Soal (JSON)', 'Waktu Dibuat']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3f4f6');
  }
  return sheet;
}

function getAllTokensFromSheet(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var tokens = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var code = String(row[0] || '').trim();
    if (!code) continue;
    var questions = [];
    try {
      questions = JSON.parse(row[5] || '[]');
    } catch(e) {
      questions = [];
    }
    tokens.push({
      code: code,
      title: String(row[1] || ''),
      teacherName: String(row[2] || ''),
      teacherPhone: String(row[3] || ''),
      sheetUrl: String(row[4] || ''),
      questions: questions,
      createdAt: String(row[6] || '')
    });
  }
  return tokens;
}

function findTokenByCode(sheet, code) {
  var search = String(code).trim().toUpperCase();
  var tokens = getAllTokensFromSheet(sheet);
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i].code.toUpperCase() === search) {
      return tokens[i];
    }
  }
  return null;
}

function saveTokenToSheet(sheet, token) {
  var searchCode = String(token.code).trim().toUpperCase();
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === searchCode) {
      rowIndex = i + 1;
      break;
    }
  }

  var questionsJson = JSON.stringify(token.questions || []);
  var dateStr = token.createdAt || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');

  var rowValues = [
    searchCode,
    token.title || 'Kuis ' + searchCode,
    token.teacherName || 'Guru',
    token.teacherPhone || '',
    token.sheetUrl || '',
    questionsJson,
    dateStr
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, 7).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return token;
}

function deleteTokenFromSheet(sheet, code) {
  var searchCode = String(code).trim().toUpperCase();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === searchCode) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;



