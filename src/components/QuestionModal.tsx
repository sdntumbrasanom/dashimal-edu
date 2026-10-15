import React, { useState, useEffect } from 'react';
import { Question } from '../types/game.ts';
import { playCorrectSound, playWrongSound } from '../utils/sound.ts';
import confetti from 'canvas-confetti';

interface QuestionModalProps {
  question: Question;
  playerName: string;
  onAnswer: (isCorrect: boolean) => void;
  isCompact?: boolean; // For split screen battle view
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  playerName,
  onAnswer,
  isCompact = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (isAnswered) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSelect('__timeout__');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswered]);

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(option);

    const isCorrect = option === question.correctAnswer;
    if (isCorrect) {
      playCorrectSound();
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
    } else {
      playWrongSound();
    }

    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1400);
  };

  const timerPercent = (timeLeft / 15) * 100;

  return (
    <div
      className={`${
        isCompact ? 'absolute inset-0 z-40' : 'fixed inset-0 z-50'
      } flex items-center justify-center p-2 sm:p-4 bg-black/80 animate-fadeIn`}
    >
      <div
        className={`w-full ${
          isCompact ? 'max-w-xs sm:max-w-md p-3 sm:p-5' : 'max-w-xl p-4 sm:p-6'
        } bg-slate-900 border-2 border-purple-500/80 rounded-2xl shadow-2xl text-white relative`}
      >
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🎁</span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Bonus Soal Edukasi
              </div>
              <div className="text-sm font-semibold text-slate-200">
                Pemain: <span className="text-amber-400">{playerName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-400">Waktu:</div>
            <div
              className={`text-lg font-black font-mono px-2 py-0.5 rounded ${
                timeLeft <= 4 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-amber-300'
              }`}
            >
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft <= 4 ? 'bg-red-500' : 'bg-purple-500'
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Question Text */}
        <div className="mb-3 sm:mb-4 bg-slate-800/80 p-2.5 sm:p-4 rounded-xl border border-slate-700/60">
          <p className={`${isCompact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-semibold text-slate-100 leading-snug`}>
            {question.question}
          </p>
        </div>

        {/* Options Grid */}
        <div className={`grid grid-cols-1 ${isCompact ? 'gap-1.5 sm:gap-2 mb-3' : 'gap-2.5 mb-4'}`}>
          {question.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isChosen = selectedOption === opt;
            const isCorrect = opt === question.correctAnswer;

            let btnStyle =
              'bg-slate-800 hover:bg-slate-700/90 text-slate-200 border-slate-700 hover:border-purple-400';

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-600 border-emerald-400 text-white font-bold ring-2 ring-emerald-300';
              } else if (isChosen) {
                btnStyle = 'bg-rose-600 border-rose-400 text-white font-bold';
              } else {
                btnStyle = 'bg-slate-800/50 text-slate-500 border-slate-800';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelect(opt)}
                className={`w-full text-left ${isCompact ? 'p-2 sm:p-2.5 text-xs sm:text-sm' : 'p-3 text-sm sm:text-base'} rounded-xl border transition-all flex items-center gap-2 sm:gap-3 cursor-pointer ${btnStyle}`}
              >
                <span className={`${isCompact ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs'} rounded-lg bg-slate-900/60 flex items-center justify-center font-bold shrink-0`}>
                  {letter}
                </span>
                <span className="font-medium flex-1 truncate">{opt}</span>
                {isAnswered && isCorrect && <span className="text-base sm:text-lg shrink-0">✅</span>}
                {isAnswered && isChosen && !isCorrect && <span className="text-base sm:text-lg shrink-0">❌</span>}
              </button>
            );
          })}
        </div>

        {/* Status Hint */}
        <div className="text-center text-xs text-slate-400">
          {isAnswered ? (
            selectedOption === question.correctAnswer ? (
              <span className="text-emerald-400 font-bold">
                🎉 Benar! Nyawa bertambah (+1 ❤️) & +100 Poin!
              </span>
            ) : (
              <span className="text-rose-400 font-bold">
                ❌ Belum tepat! Tetap semangat, lanjutkan lari!
              </span>
            )
          ) : (
            'Jawab dengan benar untuk mendapatkan tambahan nyawa!'
          )}
        </div>
      </div>
    </div>
  );
};
