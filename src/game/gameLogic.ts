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
 * Calculates score from distance and coins.
 */
export function calculateLiveScore(distanceMeters: number, coins: number, bonusQuizScore: number): number {
  return Math.floor(distanceMeters) + coins * 10 + bonusQuizScore;
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

  const accuracy =
    questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 0;

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
    `🏆 *Total Skor*: ${score.toLocaleString('id-ID')} Poin\n` +
    `📏 *Jarak Lari*: ${Math.floor(distance)} meter\n` +
    `🪙 *Koin Terkumpul*: ${coins} koin\n` +
    `❤️ *Sisa Nyawa*: ${livesRemaining} nyawa\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📝 *Hasil Kuis*: ${questionsCorrect} dari ${questionsTotal} Soal Benar (${accuracy}%)\n` +
    `⏰ *Waktu Bermain*: ${dateStr}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Dikirim via Animal Subway Surfers Edukasi 🚀`
  );
}

/**
 * Constructs the WhatsApp Web / App intent URL.
 */
export function buildWhatsAppUrl(phone: string | undefined, message: string): string {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const encodedText = encodeURIComponent(message);

  if (cleanPhone) {
    // If Indonesian phone starts with 08..., convert to 628...
    let finalPhone = cleanPhone;
    if (finalPhone.startsWith('0')) {
      finalPhone = '62' + finalPhone.slice(1);
    }
    return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedText}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedText}`;
}
