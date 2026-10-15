export type AnimalId =
  | 'kelinci'
  | 'jerapah'
  | 'kuda'
  | 'katak'
  | 'harimau'
  | 'singa'
  | 'burung'
  | 'monyet'
  | 'babi'
  | 'anjing'
  | 'kucing';

export interface AnimalInfo {
  id: AnimalId;
  name: string;
  species: string;
  emoji: string;
  color: string;
  accentColor: string;
  description: string;
  trait: string;
}

export interface Question {
  id: string;
  question: string;
  correctAnswer: string;
  options: string[]; // 4 shuffled options
}

export interface QuizToken {
  code: string;
  title: string;
  teacherName: string;
  teacherPhone?: string;
  sheetUrl: string;
  questions: Question[];
  createdAt: string;
}

export type GameMode = 'solo' | 'battle';

export type GameView =
  | 'title'
  | 'mode-select'
  | 'lobby'
  | 'character-select'
  | 'playing'
  | 'paused'
  | 'gameover'
  | 'teacher-portal';

export interface PlayerStats {
  id: 'p1' | 'p2';
  name: string;
  animal: AnimalId;
  lives: number;
  maxLives: number;
  score: number;
  distance: number;
  coins: number;
  questionsTotal: number;
  questionsCorrect: number;
  isGameOver: boolean;
}
