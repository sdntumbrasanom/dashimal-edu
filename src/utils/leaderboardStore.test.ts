import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sortLeaderboardEntries,
  getLeaderboardEntries,
  saveScoreToLeaderboard,
  resetLeaderboardToDefault,
  clearLeaderboard,
  DEFAULT_LEADERBOARD_ENTRIES,
} from './leaderboardStore.ts';
import type { LeaderboardEntry } from '../types/game.ts';

// Mock localStorage for node test runner
const mockStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = String(value);
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    },
    key: (index: number) => Object.keys(mockStorage)[index] ?? null,
    length: 0,
  } as unknown as Storage;
}

test('sortLeaderboardEntries orders entries by score descending', () => {
  const sample: LeaderboardEntry[] = [
    {
      id: '1',
      playerName: 'Player A',
      animalId: 'kelinci',
      score: 500,
      distance: 200,
      coins: 10,
      questionsCorrect: 3,
      questionsTotal: 5,
      mode: 'solo',
      timestamp: 1000,
      dateStr: '2026-10-22',
    },
    {
      id: '2',
      playerName: 'Player B',
      animalId: 'harimau',
      score: 1500,
      distance: 400,
      coins: 30,
      questionsCorrect: 8,
      questionsTotal: 8,
      mode: 'solo',
      timestamp: 2000,
      dateStr: '2026-10-22',
    },
    {
      id: '3',
      playerName: 'Player C',
      animalId: 'singa',
      score: 1000,
      distance: 300,
      coins: 20,
      questionsCorrect: 5,
      questionsTotal: 6,
      mode: 'solo',
      timestamp: 3000,
      dateStr: '2026-10-22',
    },
  ];

  const sorted = sortLeaderboardEntries(sample);
  assert.equal(sorted[0].playerName, 'Player B');
  assert.equal(sorted[1].playerName, 'Player C');
  assert.equal(sorted[2].playerName, 'Player A');
});

test('getLeaderboardEntries initializes with defaults and filters by mode', () => {
  clearLeaderboard();
  const all = getLeaderboardEntries('all');
  assert.ok(all.length >= DEFAULT_LEADERBOARD_ENTRIES.length);

  const solo = getLeaderboardEntries('solo');
  assert.ok(solo.every((item) => item.mode === 'solo'));

  const battle = getLeaderboardEntries('battle');
  assert.ok(battle.every((item) => item.mode === 'battle'));
});

test('saveScoreToLeaderboard inserts new run and calculates accurate rank', () => {
  resetLeaderboardToDefault();

  // Test saving an ultra-high score (Rank #1)
  const resultRank1 = saveScoreToLeaderboard({
    playerName: 'Siswa Jenius',
    animalId: 'singa',
    score: 9999,
    distance: 1000,
    coins: 150,
    questionsCorrect: 20,
    questionsTotal: 20,
    mode: 'solo',
    tokenCode: 'IPA-JUARA',
  });

  assert.equal(resultRank1.rank, 1);
  assert.equal(resultRank1.isNewHighScore, true);
  assert.equal(resultRank1.isTopThree, true);
  assert.equal(resultRank1.isAllTimeBest, true);

  // Test saving an intermediate score
  const resultIntermediate = saveScoreToLeaderboard({
    playerName: 'Siswa Pemula',
    animalId: 'katak',
    score: 100,
    distance: 50,
    coins: 5,
    questionsCorrect: 1,
    questionsTotal: 3,
    mode: 'solo',
  });

  assert.ok(resultIntermediate.rank > 1);
  assert.equal(resultIntermediate.isNewHighScore, false);
});

test('saveScoreToLeaderboard organizes scores per token and provides correct spreadsheet tab', () => {
  resetLeaderboardToDefault();

  const resIpa = saveScoreToLeaderboard({
    playerName: 'Pelari IPA',
    animalId: 'harimau',
    score: 800,
    distance: 300,
    coins: 20,
    questionsCorrect: 6,
    questionsTotal: 6,
    mode: 'solo',
    tokenCode: 'IPA-JUARA',
  });

  assert.equal(resIpa.spreadsheetTab, 'Skor_IPA-JUARA');

  const resMat = saveScoreToLeaderboard({
    playerName: 'Pelari Matematika',
    animalId: 'kelinci',
    score: 850,
    distance: 320,
    coins: 25,
    questionsCorrect: 6,
    questionsTotal: 6,
    mode: 'solo',
    tokenCode: 'MAT-SERU',
  });

  assert.equal(resMat.spreadsheetTab, 'Skor_MAT-SERU');

  // Verify that querying leaderboard for MAT-SERU isolates entries for MAT-SERU
  const matEntries = getLeaderboardEntries('all', 'MAT-SERU');
  assert.ok(matEntries.every((e) => e.tokenCode === 'MAT-SERU'));
});
