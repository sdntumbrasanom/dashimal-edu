import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAllTokens,
  getTokenByCode,
  saveToken,
  deleteToken,
  updateTokenPhone,
  getAppsScriptUrl,
  setAppsScriptUrl,
  setManualAppsScriptUrl,
  getAppsScriptSecretKey,
  setAppsScriptSecretKey,
  clearAppsScriptConfig,
  maskAppsScriptUrl,
  saveTokenOnline,
  fetchTokenOnline,
  syncAllTokensFromOnline,
  GOOGLE_APPS_SCRIPT_TEMPLATE_CODE,
  APPS_SCRIPT_URL_KEY,
} from './tokenStore.ts';
import type { QuizToken } from '../types/game.ts';

// Mock localStorage for Node test runner
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

test('maskAppsScriptUrl properly masks sensitive Google Apps Script URLs', () => {
  const rawUrl = 'https://script.google.com/macros/s/AKfycbySecretDeploymentId123456/exec';
  const masked = maskAppsScriptUrl(rawUrl);
  assert.ok(!masked.includes('SecretDeploymentId'));
  assert.ok(masked.includes('••••••••••••'));
  assert.ok(masked.startsWith('https://script.google.com/macros/s/'));
  assert.ok(masked.endsWith('/exec'));

  assert.equal(maskAppsScriptUrl(''), '(Belum dikonfigurasi)');
});

test('getAppsScriptUrl and setAppsScriptUrl obfuscate storage so raw URL is never stored plain', () => {
  const sampleUrl = 'https://script.google.com/macros/s/AKfycbySecret123/exec';
  setAppsScriptUrl(sampleUrl);

  // Stored value in localStorage should NOT contain raw URL in plain text
  const rawStored = localStorage.getItem(APPS_SCRIPT_URL_KEY) || '';
  assert.ok(!rawStored.includes('https://script.google.com'));
  assert.ok(rawStored.startsWith('enc_v1:'));

  // Decoded accessor should correctly restore the URL
  assert.equal(getAppsScriptUrl(), sampleUrl);

  // Secret Key test
  setAppsScriptSecretKey('PIN12345');
  assert.equal(getAppsScriptSecretKey(), 'PIN12345');
  const storedKey = localStorage.getItem('subway_apps_script_secret_key') || '';
  assert.ok(!storedKey.includes('PIN12345'));

  // Clear config
  clearAppsScriptConfig();
  assert.equal(getAppsScriptUrl(), '');
  assert.equal(getAppsScriptSecretKey(), '');
});

test('setManualAppsScriptUrl configures runtime manual Apps Script URL without touching storage', () => {
  setManualAppsScriptUrl('https://script.google.com/macros/s/AKmanualCodeUrl/exec');
  assert.equal(getAppsScriptUrl(), 'https://script.google.com/macros/s/AKmanualCodeUrl/exec');
  setManualAppsScriptUrl('');
});

test('saveToken and getTokenByCode handle case-insensitive token lookups', () => {
  const sampleToken: QuizToken = {
    code: 'TEST-IPA',
    title: 'Kuis IPA Uji',
    teacherName: 'Pak Guru',
    teacherPhone: '081234567890',
    sheetUrl: '',
    questions: [
      {
        id: 'q1',
        question: 'Apakah bumi bulat?',
        correctAnswer: 'Ya',
        options: ['Ya', 'Tidak', 'Kotak', 'Segitiga'],
      },
    ],
    createdAt: '2026-10-21',
  };

  saveToken(sampleToken);
  const fetchedLower = getTokenByCode('test-ipa');
  assert.ok(fetchedLower);
  assert.equal(fetchedLower.code, 'TEST-IPA');
  assert.equal(fetchedLower.title, 'Kuis IPA Uji');

  const fetchedUpper = getTokenByCode('TEST-IPA');
  assert.ok(fetchedUpper);
  assert.equal(fetchedUpper.title, 'Kuis IPA Uji');
});

test('saveTokenOnline saves locally when Apps Script URL is empty', async () => {
  setAppsScriptUrl('');
  const sampleToken: QuizToken = {
    code: 'OFFLINE-01',
    title: 'Kuis Offline',
    teacherName: 'Bu Guru',
    sheetUrl: '',
    questions: [],
    createdAt: '2026-10-21',
  };

  const res = await saveTokenOnline(sampleToken);
  assert.equal(res.success, true);
  assert.equal(res.syncedOnline, false);

  const found = getTokenByCode('OFFLINE-01');
  assert.ok(found);
  assert.equal(found.title, 'Kuis Offline');
});

test('GOOGLE_APPS_SCRIPT_TEMPLATE_CODE contains valid Apps Script handlers and security checks', () => {
  assert.ok(GOOGLE_APPS_SCRIPT_TEMPLATE_CODE.includes('function doGet(e)'));
  assert.ok(GOOGLE_APPS_SCRIPT_TEMPLATE_CODE.includes('function doPost(e)'));
  assert.ok(GOOGLE_APPS_SCRIPT_TEMPLATE_CODE.includes('findTokenByCode'));
  assert.ok(GOOGLE_APPS_SCRIPT_TEMPLATE_CODE.includes('saveTokenToSheet'));
  assert.ok(GOOGLE_APPS_SCRIPT_TEMPLATE_CODE.includes('getAllTokensFromSheet'));
  assert.ok(GOOGLE_APPS_SCRIPT_TEMPLATE_CODE.includes('var API_SECRET_KEY = "";'));
  assert.ok(GOOGLE_APPS_SCRIPT_TEMPLATE_CODE.includes('function isAuthorized(e, data)'));
});
