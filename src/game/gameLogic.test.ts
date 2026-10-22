import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handlePlayerHit,
  handleAnswerQuestion,
  handleBattleAnswerQuestion,
  calculateLiveScore,
  calculateEvaluationScore,
  generateWhatsAppMessage,
  generateBattleWhatsAppMessage,
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

test('calculateLiveScore computes evaluation score based on questions correct and coins', () => {
  // 3 correct answers (+300) and 15 coins (+150) = 450
  const score = calculateLiveScore(15, 3);
  assert.equal(score, 450);

  // 0 coins and 5 correct answers = 500
  assert.equal(calculateLiveScore(0, 5), 500);

  // 20 coins and 0 correct answers = 200
  assert.equal(calculateLiveScore(20, 0), 200);

  const evalStats = calculateEvaluationScore(4, 5, 12);
  assert.equal(evalStats.totalScore, 400 + 120);
  assert.equal(evalStats.quizScore, 400);
  assert.equal(evalStats.coinsScore, 120);
  assert.equal(evalStats.accuracy, 80);
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

  // Test starting with 8...
  const urlWith8 = buildWhatsAppUrl('85722228896', msg);
  assert.ok(urlWith8.startsWith('https://api.whatsapp.com/send?phone=6285722228896'));

  // Test with +62 formatted string
  const urlWith62 = buildWhatsAppUrl('+62 812-3456-7890', msg);
  assert.ok(urlWith62.startsWith('https://api.whatsapp.com/send?phone=6281234567890'));

  const urlNoPhone = buildWhatsAppUrl(undefined, msg);
  assert.ok(urlNoPhone.startsWith('https://api.whatsapp.com/send?text='));
});

test('generateBattleWhatsAppMessage formats battle summary correctly', () => {
  const battleMsg = generateBattleWhatsAppMessage({
    p1Name: 'Ahmad',
    p1Animal: 'Kelinci',
    p1Score: 1200,
    p1Distance: 600,
    p1Correct: 5,
    p1Total: 5,
    p2Name: 'Budi',
    p2Animal: 'Harimau',
    p2Score: 900,
    p2Distance: 450,
    p2Correct: 3,
    p2Total: 5,
    token: {
      code: 'BAT-01',
      title: 'Kuis IPA',
      teacherName: 'Pak Wahyu',
      teacherPhone: '081234567890',
      sheetUrl: '',
      questions: [],
      createdAt: '2026-10-15',
    },
  });

  assert.ok(battleMsg.includes('LAPORAN HASIL BATTLE 2 PEMAIN'));
  assert.ok(battleMsg.includes('Pak Wahyu'));
  assert.ok(battleMsg.includes('BAT-01'));
  assert.ok(battleMsg.includes('Ahmad'));
  assert.ok(battleMsg.includes('Budi'));
  assert.ok(battleMsg.includes('👑 Pemenang: *Ahmad*'));
});

test('handleBattleAnswerQuestion: 3 consecutive correct answers grant +1 life and resets on wrong', () => {
  // Question 1: correct -> streak = 1, no life added yet
  const q1 = handleBattleAnswerQuestion({
    isCorrect: true,
    currentLives: 2,
    maxLives: 5,
    currentStreak: 0,
    currentScore: 0,
    questionsTotal: 0,
    questionsCorrect: 0,
  });
  assert.equal(q1.newStreak, 1);
  assert.equal(q1.lifeAdded, false);
  assert.equal(q1.newLives, 2);

  // Question 2: correct -> streak = 2, no life added yet
  const q2 = handleBattleAnswerQuestion({
    isCorrect: true,
    currentLives: q1.newLives,
    maxLives: 5,
    currentStreak: q1.newStreak,
    currentScore: q1.newScore,
    questionsTotal: q1.newTotal,
    questionsCorrect: q1.newCorrect,
  });
  assert.equal(q2.newStreak, 2);
  assert.equal(q2.lifeAdded, false);
  assert.equal(q2.newLives, 2);

  // Question 3: correct -> streak = 3, +1 LIFE AWARDED!
  const q3 = handleBattleAnswerQuestion({
    isCorrect: true,
    currentLives: q2.newLives,
    maxLives: 5,
    currentStreak: q2.newStreak,
    currentScore: q2.newScore,
    questionsTotal: q2.newTotal,
    questionsCorrect: q2.newCorrect,
  });
  assert.equal(q3.newStreak, 3);
  assert.equal(q3.streakAwarded, true);
  assert.equal(q3.lifeAdded, true);
  assert.equal(q3.newLives, 3); // 2 -> 3 lives!

  // Question 4: incorrect -> streak resets to 0, no life added
  const q4 = handleBattleAnswerQuestion({
    isCorrect: false,
    currentLives: q3.newLives,
    maxLives: 5,
    currentStreak: q3.newStreak,
    currentScore: q3.newScore,
    questionsTotal: q3.newTotal,
    questionsCorrect: q3.newCorrect,
  });
  assert.equal(q4.newStreak, 0);
  assert.equal(q4.lifeAdded, false);
  assert.equal(q4.newLives, 3);
});

