import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handlePlayerHit,
  handleAnswerQuestion,
  calculateLiveScore,
  generateWhatsAppMessage,
  buildWhatsAppUrl,
} from './gameLogic.ts';

test('handlePlayerHit decreases life by 1 and detects death at 0', () => {
  const hit1 = handlePlayerHit(3);
  assert.equal(hit1.newLives, 2);
  assert.equal(hit1.isDead, false);

  const hit2 = handlePlayerHit(1);
  assert.equal(hit2.newLives, 0);
  assert.equal(hit2.isDead, true);

  const hit3 = handlePlayerHit(0);
  assert.equal(hit3.newLives, 0);
  assert.equal(hit3.isDead, true);
});

test('handleAnswerQuestion grants life and 100 points when correct', () => {
  const resCorrect = handleAnswerQuestion({
    isCorrect: true,
    currentLives: 2,
    maxLives: 5,
    currentScore: 250,
    questionsTotal: 1,
    questionsCorrect: 1,
  });

  assert.equal(resCorrect.newLives, 3);
  assert.equal(resCorrect.lifeAdded, true);
  assert.equal(resCorrect.newScore, 350);
  assert.equal(resCorrect.newTotal, 2);
  assert.equal(resCorrect.newCorrect, 2);

  // When already at max lives
  const resMax = handleAnswerQuestion({
    isCorrect: true,
    currentLives: 5,
    maxLives: 5,
    currentScore: 100,
    questionsTotal: 0,
    questionsCorrect: 0,
  });
  assert.equal(resMax.newLives, 5);
  assert.equal(resMax.lifeAdded, false);
  assert.equal(resMax.newScore, 200);

  // When wrong
  const resWrong = handleAnswerQuestion({
    isCorrect: false,
    currentLives: 2,
    maxLives: 5,
    currentScore: 250,
    questionsTotal: 1,
    questionsCorrect: 1,
  });
  assert.equal(resWrong.newLives, 2);
  assert.equal(resWrong.lifeAdded, false);
  assert.equal(resWrong.newScore, 250);
  assert.equal(resWrong.newTotal, 2);
  assert.equal(resWrong.newCorrect, 1);
});

test('calculateLiveScore computes live total', () => {
  const score = calculateLiveScore(150.7, 12, 200);
  assert.equal(score, 150 + 120 + 200);
});

test('generateWhatsAppMessage and buildWhatsAppUrl generate valid output', () => {
  const msg = generateWhatsAppMessage({
    playerName: 'Budi Santoso',
    token: {
      code: 'IPA123',
      title: 'Kuis IPA Bab 3',
      teacherName: 'Pak Anton',
      sheetUrl: 'https://...',
      questions: [],
      createdAt: '2026-10-14',
    },
    score: 850,
    distance: 420.5,
    coins: 25,
    questionsTotal: 4,
    questionsCorrect: 3,
    livesRemaining: 2,
    animalName: 'Kelinci Cepat',
  });

  assert.ok(msg.includes('Budi Santoso'));
  assert.ok(msg.includes('IPA123'));
  assert.ok(msg.includes('850 Poin'));
  assert.ok(msg.includes('3 dari 4 Soal Benar'));

  const urlWithPhone = buildWhatsAppUrl('08123456789', msg);
  assert.ok(urlWithPhone.startsWith('https://api.whatsapp.com/send?phone=628123456789'));

  const urlNoPhone = buildWhatsAppUrl(undefined, msg);
  assert.ok(urlNoPhone.startsWith('https://api.whatsapp.com/send?text='));
});
