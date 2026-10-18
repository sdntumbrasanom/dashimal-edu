import type { Question } from '../types/game.ts';

/**
 * Extracts Google Sheets ID and gid from various Google Sheets URL formats.
 */
export function extractGoogleSheetInfo(url: string): { sheetId: string | null; gid: string } {
  if (!url || typeof url !== 'string') {
    return { sheetId: null, gid: '0' };
  }

  // Matches /spreadsheets/d/([a-zA-Z0-9-_]+)
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = idMatch ? idMatch[1] : null;

  // Matches gid=([0-9]+)
  const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return { sheetId, gid };
}

/**
 * Constructs the CSV export URL for a public Google Sheet.
 */
export function buildGoogleSheetCsvUrl(url: string): string | null {
  const { sheetId, gid } = extractGoogleSheetInfo(url);
  if (!sheetId) return null;
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Robust CSV Line Parser that handles quotes, escaped quotes, and commas.
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Shuffles an array with a deterministic or random seed
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const arr = [...array];
  let s = seed !== undefined ? seed : Math.random() * 10000;
  for (let i = arr.length - 1; i > 0; i--) {
    // simple pseudo-random when seed provided, or Math.random
    const rand = seed !== undefined ? ((s = (s * 9301 + 49297) % 233280) / 233280) : Math.random();
    const j = Math.floor(rand * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Parses raw CSV text into an array of Questions according to the specification:
 * - Kolom A: Pertanyaan
 * - Kolom B: Jawaban yang benar
 * - Kolom C, D, E: Jawaban opsional
 */
export function parseQuestionsCsv(csvText: string): Question[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const questions: Question[] = [];

  let startIndex = 0;
  // Check if first row is a header
  if (lines.length > 0) {
    const firstRow = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
    const isHeader =
      firstRow.some((col) => col.includes('soal') || col.includes('pertanyaan') || col.includes('question')) ||
      firstRow.some((col) => col.includes('jawaban') || col.includes('kunci') || col.includes('opsi'));
    if (isHeader) {
      startIndex = 1;
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 2) continue;

    const questionText = row[0]?.trim();
    const correctAnswer = row[1]?.trim();

    if (!questionText || !correctAnswer) continue;

    // Collect optional wrong answers from columns C, D, E, etc.
    const wrongOptions: string[] = [];
    for (let c = 2; c < row.length; c++) {
      const opt = row[c]?.trim();
      if (opt && opt !== correctAnswer && !wrongOptions.includes(opt)) {
        wrongOptions.push(opt);
      }
    }

    // Ensure we have at least 1 wrong option, up to 3 for standard 4 choices
    const allOptions = [correctAnswer, ...wrongOptions];
    // If fewer than 2 total choices, create generic educational fallbacks
    if (allOptions.length < 2) {
      allOptions.push('Pilihan B');
    }
    while (allOptions.length < 4 && wrongOptions.length < 3) {
      const fallback = `Pilihan ${String.fromCharCode(65 + allOptions.length)}`;
      if (!allOptions.includes(fallback)) {
        allOptions.push(fallback);
      } else {
        break;
      }
    }

    const shuffled = shuffleArray(allOptions);

    questions.push({
      id: `q-${i + 1}-${Date.now().toString(36)}`,
      question: questionText,
      correctAnswer: correctAnswer,
      options: shuffled,
    });
  }

  return questions;
}

/**
 * Shuffles only the answer options of a single question while keeping correctAnswer intact.
 */
export function shuffleQuestionOptions(question: Question): Question {
  if (!question || !question.options || question.options.length <= 1) {
    return question;
  }
  return {
    ...question,
    options: shuffleArray(question.options),
  };
}

/**
 * Randomizes the order of questions AND randomizes the order of answer options
 * for each question so that the correct answer is randomly distributed across
 * all positions (A, B, C, D) and not locked to position A.
 */
export function randomizeQuizQuestions(questions: Question[]): Question[] {
  if (!questions || questions.length === 0) return [];

  // 1. Acak urutan soal (Shuffle questions order)
  const shuffledQuestions = shuffleArray(questions);

  // 2. Acak urutan pilihan jawaban untuk setiap soal (Shuffle answers options)
  return shuffledQuestions.map((q) => {
    const rawOptions = Array.isArray(q.options) && q.options.length > 0 ? q.options : [q.correctAnswer];
    // Pastikan kunci jawaban ada dalam opsi
    const opts = rawOptions.includes(q.correctAnswer) ? [...rawOptions] : [...rawOptions, q.correctAnswer];
    return {
      ...q,
      options: shuffleArray(opts),
    };
  });
}

