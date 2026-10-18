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


