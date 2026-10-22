import { LeaderboardEntry, GameMode } from '../types/game.ts';
import { getAppsScriptUrl, getAppsScriptSecretKey } from './tokenStore.ts';

// Initial in-memory starter scores per token (bukan localStorage)
export const DEFAULT_LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'lb-default-1',
    playerName: 'Budi Juara',
    animalId: 'harimau',
    score: 1250,
    distance: 420,
    coins: 45,
    questionsCorrect: 8,
    questionsTotal: 8,
    mode: 'solo',
    tokenCode: 'IPA-JUARA',
    timestamp: 1774000000000,
    dateStr: '2026-10-18',
  },
  {
    id: 'lb-default-2',
    playerName: 'Siti Cerdas',
    animalId: 'kelinci',
    score: 1080,
    distance: 380,
    coins: 38,
    questionsCorrect: 7,
    questionsTotal: 7,
    mode: 'solo',
    tokenCode: 'MAT-SERU',
    timestamp: 1774050000000,
    dateStr: '2026-10-19',
  },
  {
    id: 'lb-default-3',
    playerName: 'Rian Gesit',
    animalId: 'singa',
    score: 950,
    distance: 310,
    coins: 35,
    questionsCorrect: 6,
    questionsTotal: 7,
    mode: 'solo',
    tokenCode: 'IPA-JUARA',
    timestamp: 1774100000000,
    dateStr: '2026-10-20',
  },
  {
    id: 'lb-default-4',
    playerName: 'Aisyah Pintar',
    animalId: 'jerapah',
    score: 820,
    distance: 290,
    coins: 32,
    questionsCorrect: 5,
    questionsTotal: 6,
    mode: 'battle',
    tokenCode: 'BAHASA-ID',
    timestamp: 1774120000000,
    dateStr: '2026-10-20',
  },
  {
    id: 'lb-default-5',
    playerName: 'Fajar Lincah',
    animalId: 'kuda',
    score: 710,
    distance: 260,
    coins: 21,
    questionsCorrect: 5,
    questionsTotal: 5,
    mode: 'solo',
    tokenCode: 'MAT-SERU',
    timestamp: 1774150000000,
    dateStr: '2026-10-21',
  },
];

// In-memory cache per token (tidak memakai localStorage)
const sessionCacheByToken: Map<string, LeaderboardEntry[]> = new Map();

/**
 * Normalisasi kode token (huruf kapital, default 'UMUM' jika kosong)
 */
export function normalizeTokenCode(code?: string): string {
  const clean = (code || '').trim().toUpperCase();
  return clean || 'UMUM';
}

/**
 * Mengurutkan entri leaderboard berdasarkan skor tertinggi, kemudian koin, lalu jarak lari.
 */
export function sortLeaderboardEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.questionsCorrect !== a.questionsCorrect) {
      return b.questionsCorrect - a.questionsCorrect;
    }
    if (b.coins !== a.coins) {
      return b.coins - a.coins;
    }
    return b.distance - a.distance;
  });
}

/**
 * Mendapatkan entri leaderboard aktif di memori sesi untuk token tertentu.
 */
export function getLeaderboardEntries(
  mode?: GameMode | 'all',
  tokenCode?: string
): LeaderboardEntry[] {
  const normToken = normalizeTokenCode(tokenCode);

  let list = sessionCacheByToken.get(normToken);
  if (!list) {
    if (normToken === 'UMUM') {
      list = [...DEFAULT_LEADERBOARD_ENTRIES];
    } else {
      list = DEFAULT_LEADERBOARD_ENTRIES.filter((e) => e.tokenCode === normToken);
      if (list.length === 0) {
        list = [];
      }
    }
    sessionCacheByToken.set(normToken, list);
  }

  const sorted = sortLeaderboardEntries(list);
  if (!mode || mode === 'all') {
    return sorted;
  }
  return sorted.filter((entry) => entry.mode === mode);
}

export interface SaveScoreResult {
  savedEntry: LeaderboardEntry;
  rank: number;
  totalEntries: number;
  isTopThree: boolean;
  isNewHighScore: boolean;
  isAllTimeBest: boolean;
  syncedOnline: boolean;
  spreadsheetTab: string;
}

/**
 * Mengambil data papan skor dari Spreadsheet secara online melalui Google Apps Script per token soal.
 */
export async function fetchLeaderboardFromSpreadsheet(
  tokenCode?: string
): Promise<LeaderboardEntry[]> {
  const normToken = normalizeTokenCode(tokenCode);
  const scriptUrl = getAppsScriptUrl();

  if (!scriptUrl) {
    return getLeaderboardEntries('all', normToken);
  }

  const secretKey = getAppsScriptSecretKey();

  try {
    const sep = scriptUrl.includes('?') ? '&' : '?';
    let queryUrl = `${scriptUrl}${sep}action=leaderboard&code=${encodeURIComponent(normToken)}`;
    if (secretKey) {
      queryUrl += `&key=${encodeURIComponent(secretKey)}`;
    }

    const resp = await fetch(queryUrl);
    const text = await resp.text();
    const data = JSON.parse(text);

    if (data && data.status === 'success' && Array.isArray(data.entries)) {
      const sorted = sortLeaderboardEntries(data.entries);
      sessionCacheByToken.set(normToken, sorted);
      return sorted;
    }
  } catch (err) {
    console.warn('Gagal memuat papan skor dari Google Spreadsheet:', err);
  }

  return getLeaderboardEntries('all', normToken);
}

/**
 * Menyimpan skor pemain ke Google Spreadsheet per token soal melalui Google Apps Script.
 * Data disimpan di tab "Skor_{KODE_TOKEN}" pada spreadsheet.
 */
export async function saveScoreToSpreadsheetOnline(
  data: Omit<LeaderboardEntry, 'id' | 'timestamp' | 'dateStr'>
): Promise<SaveScoreResult> {
  const normToken = normalizeTokenCode(data.tokenCode);
  const currentList = getLeaderboardEntries('all', normToken);
  const highestCurrentScore = currentList.length > 0 ? currentList[0].score : 0;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const newEntry: LeaderboardEntry = {
    ...data,
    tokenCode: normToken,
    id: `lb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    dateStr,
  };

  // Update in-memory session cache immediately
  const updatedList = sortLeaderboardEntries([newEntry, ...currentList]);
  sessionCacheByToken.set(normToken, updatedList);

  const rank = updatedList.findIndex((item) => item.id === newEntry.id) + 1;
  const isTopThree = rank >= 1 && rank <= 3;
  const isAllTimeBest = newEntry.score > highestCurrentScore;
  const isNewHighScore = rank === 1 || isAllTimeBest;
  const spreadsheetTab = `Skor_${normToken}`;

  let syncedOnline = false;
  const scriptUrl = getAppsScriptUrl();

  if (scriptUrl) {
    const secretKey = getAppsScriptSecretKey();
    try {
      const payload = JSON.stringify({
        action: 'save_score',
        tokenCode: normToken,
        entry: newEntry,
        key: secretKey || undefined,
      });

      const resp = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload,
      });

      const text = await resp.text();
      const parsed = JSON.parse(text);
      if (parsed && parsed.status === 'success') {
        syncedOnline = true;
        if (Array.isArray(parsed.entries) && parsed.entries.length > 0) {
          sessionCacheByToken.set(normToken, sortLeaderboardEntries(parsed.entries));
        }
      }
    } catch {
      // Fallback via GET
      try {
        const sep = scriptUrl.includes('?') ? '&' : '?';
        let getUrl = `${scriptUrl}${sep}action=save_score&code=${encodeURIComponent(normToken)}&payload=${encodeURIComponent(JSON.stringify(newEntry))}`;
        if (secretKey) {
          getUrl += `&key=${encodeURIComponent(secretKey)}`;
        }
        const getResp = await fetch(getUrl);
        const getText = await getResp.text();
        const getParsed = JSON.parse(getText);
        if (getParsed && getParsed.status === 'success') {
          syncedOnline = true;
          if (Array.isArray(getParsed.entries) && getParsed.entries.length > 0) {
            sessionCacheByToken.set(normToken, sortLeaderboardEntries(getParsed.entries));
          }
        }
      } catch (err) {
        console.warn('Gagal sinkron skor ke spreadsheet online:', err);
      }
    }
  }

  return {
    savedEntry: newEntry,
    rank: rank > 0 ? rank : updatedList.length,
    totalEntries: updatedList.length,
    isTopThree,
    isNewHighScore,
    isAllTimeBest,
    syncedOnline,
    spreadsheetTab,
  };
}

/**
 * Menyimpan skor pemain dan memicu sinkronisasi ke spreadsheet per token.
 * Kompatibel dengan pemanggilan sinkron pada Game Over.
 */
export function saveScoreToLeaderboard(
  data: Omit<LeaderboardEntry, 'id' | 'timestamp' | 'dateStr'>
): SaveScoreResult {
  const normToken = normalizeTokenCode(data.tokenCode);
  const currentList = getLeaderboardEntries('all', normToken);
  const highestCurrentScore = currentList.length > 0 ? currentList[0].score : 0;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const newEntry: LeaderboardEntry = {
    ...data,
    tokenCode: normToken,
    id: `lb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    dateStr,
  };

  const updatedList = sortLeaderboardEntries([newEntry, ...currentList]);
  sessionCacheByToken.set(normToken, updatedList);

  const rank = updatedList.findIndex((item) => item.id === newEntry.id) + 1;
  const isTopThree = rank >= 1 && rank <= 3;
  const isAllTimeBest = newEntry.score > highestCurrentScore;
  const isNewHighScore = rank === 1 || isAllTimeBest;
  const spreadsheetTab = `Skor_${normToken}`;

  // Kirim ke Google Spreadsheet di background
  saveScoreToSpreadsheetOnline(data).catch(() => {});

  return {
    savedEntry: newEntry,
    rank: rank > 0 ? rank : updatedList.length,
    totalEntries: updatedList.length,
    isTopThree,
    isNewHighScore,
    isAllTimeBest,
    syncedOnline: Boolean(getAppsScriptUrl()),
    spreadsheetTab,
  };
}

/**
 * Mengembalikan cache memori ke default
 */
export function resetLeaderboardToDefault(): void {
  sessionCacheByToken.clear();
}

export function clearLeaderboard(): void {
  sessionCacheByToken.clear();
}
