import type { PlayerStats, QuizToken } from '../types/game.ts';

export const INITIAL_LIVES_SOLO = 3;
export const MAX_LIVES_SOLO = 5;
export const INITIAL_LIVES_BATTLE = 3;

/**
 * Handles taking damage from hitting an obstacle.
 * Returns updated lives and whether player has died (gameOver).
 */
export function handlePlayerHit(currentLives: number): {
  newLives: number;
  isDead: boolean;
} {
  const newLives = Math.max(0, currentLives - 1);
  return {
    newLives,
    isDead: newLives <= 0,
  };
}

/**
 * Handles answering a quiz question:
 * If correct: +1 life (up to maxLives), +100 bonus score, increment correct count.
 * If wrong: no extra life, 0 bonus points.
 */
export function handleAnswerQuestion(params: {
  isCorrect: boolean;
  currentLives: number;
  maxLives: number;
  currentScore: number;
  questionsTotal: number;
  questionsCorrect: number;
}): {
  newLives: number;
  newScore: number;
  newTotal: number;
  newCorrect: number;
  lifeAdded: boolean;
} {
  const { isCorrect, currentLives, maxLives, currentScore, questionsTotal, questionsCorrect } = params;

  if (isCorrect) {
    const lifeAdded = currentLives < maxLives;
    const newLives = lifeAdded ? currentLives + 1 : currentLives;
    const newScore = currentScore + 100;
    return {
      newLives,
      newScore,
      newTotal: questionsTotal + 1,
      newCorrect: questionsCorrect + 1,
      lifeAdded,
    };
  }

  return {
    newLives: currentLives,
    newScore: currentScore,
    newTotal: questionsTotal + 1,
    newCorrect: questionsCorrect,
    lifeAdded: false,
  };
}

/**
 * Menghitung Skor Penilaian Permainan berdasarkan:
 * 1. Jumlah soal benar / soal yang sudah dijawab (100 poin per soal benar)
 * 2. Jumlah koin yang didapat (10 poin per koin)
 * Jarak lari (meter) tetap dicatat sebagai metrik performa atletik lari.
 */
export function calculateLiveScore(coins: number, questionsCorrect: number): number {
  return questionsCorrect * 100 + coins * 10;
}

/**
 * Rincian evaluasi skor penilaian edukatif
 */
export function calculateEvaluationScore(
  questionsCorrect: number,
  questionsTotal: number,
  coins: number
): {
  totalScore: number;
  quizScore: number;
  coinsScore: number;
  accuracy: number;
  grade: string;
} {
  const quizScore = questionsCorrect * 100;
  const coinsScore = coins * 10;
  const totalScore = quizScore + coinsScore;
  const accuracy = questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 0;

  let grade = '-';
  if (questionsTotal > 0) {
    if (accuracy >= 90) grade = 'A+ (Istimewa)';
    else if (accuracy >= 80) grade = 'A (Sangat Baik)';
    else if (accuracy >= 70) grade = 'B (Baik)';
    else if (accuracy >= 60) grade = 'C (Cukup)';
    else grade = 'D (Perlu Bimbingan)';
  } else if (coins > 0) {
    grade = 'Latihan';
  }

  return {
    totalScore,
    quizScore,
    coinsScore,
    accuracy,
    grade,
  };
}

/**
 * Generates formatted WhatsApp share message for reporting score to teacher.
 */
export function generateWhatsAppMessage(params: {
  playerName: string;
  token?: QuizToken | null;
  score: number;
  distance: number;
  coins: number;
  questionsTotal: number;
  questionsCorrect: number;
  livesRemaining: number;
  animalName: string;
}): string {
  const {
    playerName,
    token,
    score,
    distance,
    coins,
    questionsTotal,
    questionsCorrect,
    livesRemaining,
    animalName,
  } = params;

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const evalStats = calculateEvaluationScore(questionsCorrect, questionsTotal, coins);
  const quizPoints = evalStats.quizScore;
  const coinPoints = evalStats.coinsScore;
  const accuracy = evalStats.accuracy;
  const grade = evalStats.grade;

  const tokenInfo = token
    ? `🔑 *Kode Soal*: ${token.code} (${token.title})\n👨‍🏫 *Guru*: ${token.teacherName || 'Bapak/Ibu Guru'}`
    : `🔑 *Kode Soal*: Latihan Mandiri`;

  return (
    `🏃‍♂️ *LAPORAN NILAI SUBWAY SURFERS EDUKASI* 🏃‍♀️\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Nama Siswa*: ${playerName}\n` +
    `🐾 *Karakter Hewan*: ${animalName}\n` +
    `${tokenInfo}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🏆 *Total Skor Penilaian*: ${score.toLocaleString('id-ID')} Poin\n` +
    `   • 📝 Poin Kuis: ${quizPoints} Poin (${questionsCorrect}/${questionsTotal} Soal Benar · Akurasi ${accuracy}%)\n` +
    `   • 🪙 Poin Koin: ${coinPoints} Poin (${coins} koin didapat)\n` +
    `🎯 *Predikat Nilai*: ${grade}\n` +
    `📏 *Jarak Lari*: ${Math.floor(distance)} meter\n` +
    `❤️ *Sisa Nyawa*: ${livesRemaining} nyawa\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📝 *Hasil Kuis*: ${questionsCorrect} dari ${questionsTotal} Soal Benar (${accuracy}%)\n` +
    `⏰ *Waktu Bermain*: ${dateStr}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Dikirim via Animal Subway Surfers Edukasi 🚀`
  );
}

/**
 * Generates formatted WhatsApp share message for reporting battle results to teacher.
 */
export function generateBattleWhatsAppMessage(params: {
  p1Name: string;
  p1Animal: string;
  p1Score: number;
  p1Distance: number;
  p1Correct: number;
  p1Total: number;
  p1Coins?: number;
  p2Name: string;
  p2Animal: string;
  p2Score: number;
  p2Distance: number;
  p2Correct: number;
  p2Total: number;
  p2Coins?: number;
  token?: QuizToken | null;
}): string {
  const {
    p1Name,
    p1Animal,
    p1Score,
    p1Distance,
    p1Correct,
    p1Total,
    p1Coins = 0,
    p2Name,
    p2Animal,
    p2Score,
    p2Distance,
    p2Correct,
    p2Total,
    p2Coins = 0,
    token,
  } = params;

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const p1Eval = calculateEvaluationScore(p1Correct, p1Total, p1Coins);
  const p2Eval = calculateEvaluationScore(p2Correct, p2Total, p2Coins);

  const winnerStr =
    p1Score > p2Score
      ? `👑 Pemenang: *${p1Name}*`
      : p2Score > p1Score
      ? `👑 Pemenang: *${p2Name}*`
      : `🤝 Hasil: *SERI (Imbang)*`;

  const tokenInfo = token
    ? `🔑 *Kode Soal*: ${token.code} (${token.title})\n👨‍🏫 *Guru*: ${token.teacherName || 'Bapak/Ibu Guru'}`
    : `🔑 *Kode Soal*: Latihan Battle`;

  return (
    `⚔️ *LAPORAN HASIL BATTLE 2 PEMAIN - SUBWAY SURFERS EDUKASI* ⚔️\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${tokenInfo}\n` +
    `🏆 ${winnerStr}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Pemain 1*: ${p1Name} (${p1Animal})\n` +
    `   • Skor Penilaian: ${Math.floor(p1Score).toLocaleString('id-ID')} Poin\n` +
    `   • Kuis: ${p1Correct}/${p1Total} Soal Benar (+${p1Eval.quizScore} Poin · Akurasi ${p1Eval.accuracy}%)\n` +
    `   • Koin: ${p1Coins} Koin (+${p1Eval.coinsScore} Poin)\n` +
    `   • Predikat: ${p1Eval.grade}\n` +
    `   • Jarak Lari: ${Math.floor(p1Distance)}m\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Pemain 2*: ${p2Name} (${p2Animal})\n` +
    `   • Skor Penilaian: ${Math.floor(p2Score).toLocaleString('id-ID')} Poin\n` +
    `   • Kuis: ${p2Correct}/${p2Total} Soal Benar (+${p2Eval.quizScore} Poin · Akurasi ${p2Eval.accuracy}%)\n` +
    `   • Koin: ${p2Coins} Koin (+${p2Eval.coinsScore} Poin)\n` +
    `   • Predikat: ${p2Eval.grade}\n` +
    `   • Jarak Lari: ${Math.floor(p2Distance)}m\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⏰ *Waktu*: ${dateStr}\n` +
    `Dikirim via Animal Subway Surfers Edukasi 🚀`
  );
}

/**
 * Constructs the WhatsApp Web / App intent URL.
 * Automatically formats Indonesian numbers: 08xxx or 8xxx -> 628xxx
 */
export function buildWhatsAppUrl(phone: string | undefined, message: string): string {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const encodedText = encodeURIComponent(message);

  if (cleanPhone) {
    let finalPhone = cleanPhone;
    if (finalPhone.startsWith('0')) {
      finalPhone = '62' + finalPhone.slice(1);
    } else if (finalPhone.startsWith('8')) {
      finalPhone = '62' + finalPhone;
    }
    return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedText}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedText}`;
}
