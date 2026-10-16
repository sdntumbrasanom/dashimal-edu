import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnimalId, Question, QuizToken } from '../types/game.ts';
import { ANIMALS } from '../game/animalsData.ts';
import { SubwayRunnerEngine } from '../game/SubwayRunnerEngine.ts';
import { GameHUD } from './GameHUD.tsx';
import { QuestionModal } from './QuestionModal.tsx';
import { GameOverModal } from './GameOverModal.tsx';
import { handleAnswerQuestion } from '../game/gameLogic.ts';

interface SoloRunnerViewProps {
  playerName: string;
  animalId: AnimalId;
  token?: QuizToken | null;
  onExit: () => void;
}

export const SoloRunnerView: React.FC<SoloRunnerViewProps> = ({
  playerName,
  animalId,
  token,
  onExit,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SubwayRunnerEngine | null>(null);

  const [lives, setLives] = useState(3);
  const [maxLives] = useState(5);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [questionsCorrect, setQuestionsCorrect] = useState(0);

  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [isFacingFront, setIsFacingFront] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const animal = ANIMALS.find((a) => a.id === animalId)!;
  const questions = token?.questions && token.questions.length > 0 ? token.questions : [];

  // Setup Three.js Engine
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new SubwayRunnerEngine(mountRef.current, {
      animalId,
      initialLives: 3,
      maxLives: 5,
      questions,
      callbacks: {
        onHit: (newLives, dead) => {
          setLives(newLives);
          if (dead) {
            setIsGameOver(true);
          }
        },
        onQuestionTrigger: (question) => {
          setActiveQuestion(question);
        },
        onCoinCollect: (newCoins) => {
          setCoins(newCoins);
        },
        onStatsUpdate: (stats) => {
          setDistance(stats.distance);
          setScore(stats.score);
        },
      },
    });

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [animalId, questions]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || activeQuestion) return;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        setIsPaused((prev) => {
          if (!prev) {
            engineRef.current?.pause();
          } else {
            engineRef.current?.resume();
          }
          return !prev;
        });
        return;
      }

      if (isPaused) return;

      switch (e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          e.preventDefault();
          engineRef.current?.moveLeft();
          break;
        case 'KeyD':
        case 'ArrowRight':
          e.preventDefault();
          engineRef.current?.moveRight();
          break;
        case 'KeyW':
        case 'ArrowUp':
        case 'Space':
          e.preventDefault();
          engineRef.current?.jump();
          break;
        case 'KeyS':
        case 'ArrowDown':
          e.preventDefault();
          engineRef.current?.slide();
          break;
        case 'KeyV':
          e.preventDefault();
          if (engineRef.current) {
            const next = engineRef.current.toggleFacingDirection();
            setIsFacingFront(next);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, activeQuestion, isPaused]);

  // Touch swipe gestures
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isGameOver || activeQuestion || isPaused) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < 25) return;

      if (absDx > absDy) {
        if (dx > 0) {
          engineRef.current?.moveRight();
        } else {
          engineRef.current?.moveLeft();
        }
      } else {
        if (dy < 0) {
          engineRef.current?.jump();
        } else {
          engineRef.current?.slide();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isGameOver, activeQuestion, isPaused]);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      const outcome = handleAnswerQuestion({
        isCorrect,
        currentLives: lives,
        maxLives,
        currentScore: score,
        questionsTotal,
        questionsCorrect,
      });

      setLives(outcome.newLives);
      setScore(outcome.newScore);
      setQuestionsTotal(outcome.newTotal);
      setQuestionsCorrect(outcome.newCorrect);

      if (outcome.lifeAdded) {
        engineRef.current?.addLife(1);
      }

      setActiveQuestion(null);
      engineRef.current?.resume();
    },
    [lives, maxLives, score, questionsTotal, questionsCorrect]
  );

  const handleRestart = () => {
    setIsGameOver(false);
    setLives(3);
    setScore(0);
    setDistance(0);
    setCoins(0);
    setQuestionsTotal(0);
    setQuestionsCorrect(0);
    setActiveQuestion(null);
    setIsPaused(false);

    if (mountRef.current) {
      engineRef.current?.destroy();
      const engine = new SubwayRunnerEngine(mountRef.current, {
        animalId,
        initialLives: 3,
        maxLives: 5,
        questions,
        callbacks: {
          onHit: (newLives, dead) => {
            setLives(newLives);
            if (dead) setIsGameOver(true);
          },
          onQuestionTrigger: (q) => setActiveQuestion(q),
          onCoinCollect: (c) => setCoins(c),
          onStatsUpdate: (s) => {
            setDistance(s.distance);
            setScore(s.score);
          },
        },
      });
      engineRef.current = engine;
      engine.start();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* In-Game HUD */}
      {!isGameOver && (
        <GameHUD
          playerName={playerName}
          animalEmoji={animal.emoji}
          lives={lives}
          maxLives={maxLives}
          score={score}
          distance={distance}
          coins={coins}
          questionsTotal={questionsTotal}
          questionsCorrect={questionsCorrect}
          onPause={() => {
            setIsPaused(true);
            engineRef.current?.pause();
          }}
          onMoveLeft={() => engineRef.current?.moveLeft()}
          onMoveRight={() => engineRef.current?.moveRight()}
          onJump={() => engineRef.current?.jump()}
          onSlide={() => engineRef.current?.slide()}
          isFacingFront={isFacingFront}
          onToggleView={() => {
            if (engineRef.current) {
              const next = engineRef.current.toggleFacingDirection();
              setIsFacingFront(next);
            }
          }}
        />
      )}

      {/* Paused Modal */}
      {isPaused && !isGameOver && !activeQuestion && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center text-white">
            <h2 className="text-2xl font-black mb-4">PERMAINAN DIJEDA</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsPaused(false);
                  engineRef.current?.resume();
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                Lanjutkan (P / Esc)
              </button>
              <button
                onClick={handleRestart}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
              >
                Mulai Ulang
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl cursor-pointer"
              >
                Keluar ke Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bonus Question Modal */}
      {activeQuestion && (
        <QuestionModal
          question={activeQuestion}
          playerName={playerName}
          onAnswer={handleAnswer}
        />
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <GameOverModal
          mode="solo"
          token={token}
          p1Stats={{
            name: playerName,
            animalId,
            score,
            distance,
            coins,
            questionsTotal,
            questionsCorrect,
            lives,
          }}
          onRestart={handleRestart}
          onExitToMenu={onExit}
        />
      )}
    </div>
  );
};
