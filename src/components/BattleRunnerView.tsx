import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AnimalId, Question, QuizToken } from '../types/game.ts';
import { ANIMALS } from '../game/animalsData.ts';
import { SubwayRunnerEngine } from '../game/SubwayRunnerEngine.ts';
import { GameHUD } from './GameHUD.tsx';
import { QuestionModal } from './QuestionModal.tsx';
import { GameOverModal } from './GameOverModal.tsx';
import { FullscreenButton } from './FullscreenButton.tsx';
import { SoundToggleButton } from './SoundToggleButton.tsx';
import { handleBattleAnswerQuestion, calculateLiveScore } from '../game/gameLogic.ts';
import { useSoundManager } from '../hooks/useSoundManager.ts';
import { randomizeQuizQuestions } from '../game/quizParser.ts';

interface BattleRunnerViewProps {
  player1Name: string;
  player1Animal: AnimalId;
  player2Name: string;
  player2Animal: AnimalId;
  token?: QuizToken | null;
  onExit: () => void;
}

export const BattleRunnerView: React.FC<BattleRunnerViewProps> = ({
  player1Name,
  player1Animal,
  player2Name,
  player2Animal,
  token,
  onExit,
}) => {
  const mount1Ref = useRef<HTMLDivElement>(null);
  const mount2Ref = useRef<HTMLDivElement>(null);
  const engine1Ref = useRef<SubwayRunnerEngine | null>(null);
  const engine2Ref = useRef<SubwayRunnerEngine | null>(null);

  const {
    playBGM,
    stopBGM,
    playJump,
    playSlide,
    playCoin,
    playHit,
    playBonus,
    playCorrect,
    playWrong,
    playGameOver,
  } = useSoundManager('game');

  // Player 1 state
  const [p1Lives, setP1Lives] = useState(3);
  const [p1Distance, setP1Distance] = useState(0);
  const [p1Coins, setP1Coins] = useState(0);
  const [p1QTotal, setP1QTotal] = useState(0);
  const [p1QCorrect, setP1QCorrect] = useState(0);
  const [p1Streak, setP1Streak] = useState(0);
  const [p1BonusMsg, setP1BonusMsg] = useState<string | null>(null);
  const [p1Dead, setP1Dead] = useState(false);
  const [p1ActiveQuestion, setP1ActiveQuestion] = useState<Question | null>(null);

  // Player 2 state
  const [p2Lives, setP2Lives] = useState(3);
  const [p2Distance, setP2Distance] = useState(0);
  const [p2Coins, setP2Coins] = useState(0);
  const [p2QTotal, setP2QTotal] = useState(0);
  const [p2QCorrect, setP2QCorrect] = useState(0);
  const [p2Streak, setP2Streak] = useState(0);
  const [p2BonusMsg, setP2BonusMsg] = useState<string | null>(null);
  const [p2Dead, setP2Dead] = useState(false);
  const [p2ActiveQuestion, setP2ActiveQuestion] = useState<Question | null>(null);

  // Skor Penilaian P1 & P2 murni dihitung berdasar jumlah soal benar dan koin yang didapat
  const p1Score = calculateLiveScore(p1Coins, p1QCorrect);
  const p2Score = calculateLiveScore(p2Coins, p2QCorrect);

  // Default false: animals face forward down the track
  const [isFacingFront, setIsFacingFront] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const handleToggleView = () => {
    if (engine1Ref.current && engine2Ref.current) {
      const next = engine1Ref.current.toggleFacingDirection();
      engine2Ref.current.toggleFacingDirection();
      setIsFacingFront(next);
    }
  };

  const p1AnimalObj = ANIMALS.find((a) => a.id === player1Animal)!;
  const p2AnimalObj = ANIMALS.find((a) => a.id === player2Animal)!;
  // Acak soal dan jawaban saat battle untuk Player 1 dan Player 2
  const p1Questions = useMemo(() => {
    const raw = token?.questions && token.questions.length > 0 ? token.questions : [];
    return randomizeQuizQuestions(raw);
  }, [token]);

  const p2Questions = useMemo(() => {
    const raw = token?.questions && token.questions.length > 0 ? token.questions : [];
    return randomizeQuizQuestions(raw);
  }, [token]);

  // Check Game Over condition (when both die)
  useEffect(() => {
    if (p1Dead && p2Dead) {
      setIsGameOver(true);
      playGameOver();
      stopBGM();
    }
  }, [p1Dead, p2Dead, playGameOver, stopBGM]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __testTriggerP1Question?: () => void }).__testTriggerP1Question = () => {
        if (p1Questions.length > 0) {
          setP1ActiveQuestion(p1Questions[0]);
          playBonus();
        }
      };
    }
  }, [p1Questions, playBonus]);

  // Setup Engine for Player 1
  useEffect(() => {
    if (!mount1Ref.current) return;

    playBGM('game');

    const engine1 = new SubwayRunnerEngine(mount1Ref.current, {
      animalId: player1Animal,
      initialLives: 3,
      maxLives: 5, // up to 5 lives through 3-correct streaks
      questions: p1Questions,
      facingFront: false, // face forward down the track
      callbacks: {
        onHit: (newLives, dead) => {
          setP1Lives(newLives);
          if (dead) {
            setP1Dead(true);
            playHit();
          } else {
            playHit();
          }
        },
        onQuestionTrigger: (q) => {
          setP1ActiveQuestion(q);
          playBonus();
        },
        onCoinCollect: (c) => {
          setP1Coins(c);
          playCoin();
        },
        onStatsUpdate: (s) => {
          setP1Distance(s.distance);
        },
      },
    });

    engine1Ref.current = engine1;
    engine1.start();

    return () => {
      engine1.destroy();
      engine1Ref.current = null;
    };
  }, [player1Animal, p1Questions, playBGM, playHit, playBonus, playCoin]);

  // Setup Engine for Player 2
  useEffect(() => {
    if (!mount2Ref.current) return;

    const engine2 = new SubwayRunnerEngine(mount2Ref.current, {
      animalId: player2Animal,
      initialLives: 3,
      maxLives: 5, // up to 5 lives through 3-correct streaks
      questions: p2Questions,
      facingFront: false, // face forward down the track
      callbacks: {
        onHit: (newLives, dead) => {
          setP2Lives(newLives);
          if (dead) {
            setP2Dead(true);
            playHit();
          } else {
            playHit();
          }
        },
        onQuestionTrigger: (q) => {
          setP2ActiveQuestion(q);
          playBonus();
        },
        onCoinCollect: (c) => {
          setP2Coins(c);
          playCoin();
        },
        onStatsUpdate: (s) => {
          setP2Distance(s.distance);
        },
      },
    });

    engine2Ref.current = engine2;
    engine2.start();

    return () => {
      engine2.destroy();
      engine2Ref.current = null;
    };
  }, [player2Animal, p2Questions, playHit, playBonus, playCoin]);

  // Unified Keyboard Controls: P1 (WASD) and P2 (Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        setIsPaused((prev) => {
          if (!prev) {
            engine1Ref.current?.pause();
            engine2Ref.current?.pause();
          } else {
            engine1Ref.current?.resume();
            engine2Ref.current?.resume();
          }
          return !prev;
        });
        return;
      }

      if (isPaused) return;

      // Player 1: WASD
      if (!p1Dead && !p1ActiveQuestion) {
        if (e.code === 'KeyA') {
          e.preventDefault();
          engine1Ref.current?.moveLeft();
        } else if (e.code === 'KeyD') {
          e.preventDefault();
          engine1Ref.current?.moveRight();
        } else if (e.code === 'KeyW') {
          e.preventDefault();
          engine1Ref.current?.jump();
          playJump();
        } else if (e.code === 'KeyS') {
          e.preventDefault();
          engine1Ref.current?.slide();
          playSlide();
        }
      }

      // Player 2: Arrow Keys
      if (!p2Dead && !p2ActiveQuestion) {
        if (e.code === 'ArrowLeft') {
          e.preventDefault();
          engine2Ref.current?.moveLeft();
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          engine2Ref.current?.moveRight();
        } else if (e.code === 'ArrowUp') {
          e.preventDefault();
          engine2Ref.current?.jump();
          playJump();
        } else if (e.code === 'ArrowDown') {
          e.preventDefault();
          engine2Ref.current?.slide();
          playSlide();
        }
      }

      if (e.code === 'KeyV') {
        e.preventDefault();
        handleToggleView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, isPaused, p1Dead, p2Dead, p1ActiveQuestion, p2ActiveQuestion, playJump, playSlide]);

  const handleP1Answer = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) {
        playCorrect();
      } else {
        playWrong();
      }

      const outcome = handleBattleAnswerQuestion({
        isCorrect,
        currentLives: p1Lives,
        maxLives: 5,
        currentStreak: p1Streak,
        currentScore: p1Score,
        questionsTotal: p1QTotal,
        questionsCorrect: p1QCorrect,
      });

      setP1Lives(outcome.newLives);
      setP1Streak(outcome.newStreak);
      setP1QTotal(outcome.newTotal);
      setP1QCorrect(outcome.newCorrect);

      if (outcome.lifeAdded) {
        engine1Ref.current?.addLife(1);
        playBonus();
        setP1BonusMsg('🔥 3 BENAR BERUNTUN! +1 NYAWA ❤️');
        setTimeout(() => setP1BonusMsg(null), 3000);
      } else if (isCorrect) {
        setP1BonusMsg(`🔥 Streak: ${outcome.newStreak}/3 Benar`);
        setTimeout(() => setP1BonusMsg(null), 2000);
      }

      setP1ActiveQuestion(null);
      engine1Ref.current?.resume();
    },
    [p1Lives, p1Streak, p1Score, p1QTotal, p1QCorrect, playCorrect, playWrong, playBonus]
  );

  const handleP2Answer = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) {
        playCorrect();
      } else {
        playWrong();
      }

      const outcome = handleBattleAnswerQuestion({
        isCorrect,
        currentLives: p2Lives,
        maxLives: 5,
        currentStreak: p2Streak,
        currentScore: p2Score,
        questionsTotal: p2QTotal,
        questionsCorrect: p2QCorrect,
      });

      setP2Lives(outcome.newLives);
      setP2Streak(outcome.newStreak);
      setP2QTotal(outcome.newTotal);
      setP2QCorrect(outcome.newCorrect);

      if (outcome.lifeAdded) {
        engine2Ref.current?.addLife(1);
        playBonus();
        setP2BonusMsg('🔥 3 BENAR BERUNTUN! +1 NYAWA ❤️');
        setTimeout(() => setP2BonusMsg(null), 3000);
      } else if (isCorrect) {
        setP2BonusMsg(`🔥 Streak: ${outcome.newStreak}/3 Benar`);
        setTimeout(() => setP2BonusMsg(null), 2000);
      }

      setP2ActiveQuestion(null);
      engine2Ref.current?.resume();
    },
    [p2Lives, p2Streak, p2Score, p2QTotal, p2QCorrect, playCorrect, playWrong, playBonus]
  );

  const handleRestart = () => {
    setIsGameOver(false);
    setP1Lives(3);
    setP2Lives(3);
    setP1Streak(0);
    setP2Streak(0);
    setP1BonusMsg(null);
    setP2BonusMsg(null);
    setP1Distance(0);
    setP2Distance(0);
    setP1Coins(0);
    setP2Coins(0);
    setP1QTotal(0);
    setP2QTotal(0);
    setP1QCorrect(0);
    setP2QCorrect(0);
    setP1Dead(false);
    setP2Dead(false);
    setP1ActiveQuestion(null);
    setP2ActiveQuestion(null);
    setIsPaused(false);

    const freshP1Questions = randomizeQuizQuestions(token?.questions && token.questions.length > 0 ? token.questions : []);
    const freshP2Questions = randomizeQuizQuestions(token?.questions && token.questions.length > 0 ? token.questions : []);

    // Restart P1 Engine
    if (mount1Ref.current) {
      engine1Ref.current?.destroy();
      const e1 = new SubwayRunnerEngine(mount1Ref.current, {
        animalId: player1Animal,
        initialLives: 3,
        maxLives: 5,
        questions: freshP1Questions,
        callbacks: {
          onHit: (newLives, dead) => {
            setP1Lives(newLives);
            if (dead) setP1Dead(true);
          },
          onQuestionTrigger: (q) => setP1ActiveQuestion(q),
          onCoinCollect: (c) => setP1Coins(c),
          onStatsUpdate: (s) => {
            setP1Distance(s.distance);
          },
        },
      });
      engine1Ref.current = e1;
      e1.start();
    }

    // Restart P2 Engine
    if (mount2Ref.current) {
      engine2Ref.current?.destroy();
      const e2 = new SubwayRunnerEngine(mount2Ref.current, {
        animalId: player2Animal,
        initialLives: 3,
        maxLives: 5,
        questions: freshP2Questions,
        callbacks: {
          onHit: (newLives, dead) => {
            setP2Lives(newLives);
            if (dead) setP2Dead(true);
          },
          onQuestionTrigger: (q) => setP2ActiveQuestion(q),
          onCoinCollect: (c) => setP2Coins(c),
          onStatsUpdate: (s) => {
            setP2Distance(s.distance);
          },
        },
      });
      engine2Ref.current = e2;
      e2.start();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col md:flex-row select-none">
      {/* Central Splitter Line */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 via-purple-500 to-amber-500 z-20 pointer-events-none transform -translate-x-1/2 shadow-[0_0_15px_rgba(168,85,247,0.6)]" />

      {/* Top Banner Indicator for Battle */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 border border-slate-700 px-4 py-1 rounded-full text-xs font-black tracking-wider text-amber-300 shadow-xl pointer-events-none flex items-center gap-2">
        <span>⚔️ BATTLE MODE</span>
        <span className="text-slate-500">|</span>
        <span className="text-emerald-400 font-bold">3 Soal Benar Beruntun = +1 Nyawa ❤️</span>
      </div>

      {/* PLAYER 1: Left Split View */}
      <div className="relative overflow-hidden w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-800">
        <div ref={mount1Ref} className="w-full h-full" />

        {/* P1 Streak Bonus Animated Toast */}
        {p1BonusMsg && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white font-black text-xs shadow-2xl animate-bounce pointer-events-none border border-amber-300 flex items-center gap-1.5">
            <span>{p1BonusMsg}</span>
          </div>
        )}

        {/* P1 Dead Overlay */}
        {p1Dead && (
          <div className="absolute inset-0 bg-red-950/40 z-30 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900/90 border border-red-500/60 px-4 py-2 rounded-2xl text-center">
              <div className="text-2xl font-black text-red-400">P1 GAME OVER</div>
              <div className="text-xs text-slate-300 mt-0.5">Menunggu Pemain 2...</div>
            </div>
          </div>
        )}

        {/* P1 In-Game HUD */}
        <GameHUD
          playerName={`P1: ${player1Name}`}
          animalEmoji={p1AnimalObj.emoji}
          lives={p1Lives}
          maxLives={5}
          score={p1Score}
          distance={p1Distance}
          coins={p1Coins}
          questionsTotal={p1QTotal}
          questionsCorrect={p1QCorrect}
          onPause={() => {
            setIsPaused(true);
            engine1Ref.current?.pause();
            engine2Ref.current?.pause();
            stopBGM();
          }}
          onMoveLeft={() => engine1Ref.current?.moveLeft()}
          onMoveRight={() => engine1Ref.current?.moveRight()}
          onJump={() => {
            engine1Ref.current?.jump();
            playJump();
          }}
          onSlide={() => {
            engine1Ref.current?.slide();
            playSlide();
          }}
          isFacingFront={isFacingFront}
          onToggleView={handleToggleView}
          isBattle={true}
          playerSide="left"
        />

        {p1ActiveQuestion && (
          <QuestionModal
            question={p1ActiveQuestion}
            playerName={player1Name}
            onAnswer={handleP1Answer}
            isCompact={true}
          />
        )}
      </div>

      {/* PLAYER 2: Right Split View */}
      <div className="relative overflow-hidden w-full md:w-1/2 h-1/2 md:h-full">
        <div ref={mount2Ref} className="w-full h-full" />

        {/* P2 Streak Bonus Animated Toast */}
        {p2BonusMsg && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-600 text-white font-black text-xs shadow-2xl animate-bounce pointer-events-none border border-purple-300 flex items-center gap-1.5">
            <span>{p2BonusMsg}</span>
          </div>
        )}

        {/* P2 Dead Overlay */}
        {p2Dead && (
          <div className="absolute inset-0 bg-red-950/40 z-30 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900/90 border border-red-500/60 px-4 py-2 rounded-2xl text-center">
              <div className="text-2xl font-black text-red-400">P2 GAME OVER</div>
              <div className="text-xs text-slate-300 mt-0.5">Menunggu Pemain 1...</div>
            </div>
          </div>
        )}

        {/* P2 In-Game HUD */}
        <GameHUD
          playerName={`P2: ${player2Name}`}
          animalEmoji={p2AnimalObj.emoji}
          lives={p2Lives}
          maxLives={5}
          score={p2Score}
          distance={p2Distance}
          coins={p2Coins}
          questionsTotal={p2QTotal}
          questionsCorrect={p2QCorrect}
          onPause={() => {
            setIsPaused(true);
            engine1Ref.current?.pause();
            engine2Ref.current?.pause();
            stopBGM();
          }}
          onMoveLeft={() => engine2Ref.current?.moveLeft()}
          onMoveRight={() => engine2Ref.current?.moveRight()}
          onJump={() => {
            engine2Ref.current?.jump();
            playJump();
          }}
          onSlide={() => {
            engine2Ref.current?.slide();
            playSlide();
          }}
          isFacingFront={isFacingFront}
          onToggleView={handleToggleView}
          isBattle={true}
          playerSide="right"
        />

        {p2ActiveQuestion && (
          <QuestionModal
            question={p2ActiveQuestion}
            playerName={player2Name}
            onAnswer={handleP2Answer}
            isCompact={true}
          />
        )}
      </div>

      {/* Paused Modal */}
      {isPaused && !isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center text-white">
            <h2 className="text-2xl font-black mb-4">PERTANDINGAN DIJEDA</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsPaused(false);
                  engine1Ref.current?.resume();
                  engine2Ref.current?.resume();
                  playBGM('game');
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer"
              >
                Lanjutkan (P / Esc)
              </button>

              {/* Fullscreen Toggle in Pause Menu */}
              <FullscreenButton variant="menu" />

              {/* Sound Toggle in Pause Menu */}
              <div className="flex justify-center">
                <SoundToggleButton variant="hud" className="w-full justify-center py-2.5 h-auto text-sm" />
              </div>

              <button
                onClick={handleRestart}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
              >
                Mulai Ulang Pertandingan
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

      {/* Battle Game Over Outcome */}
      {isGameOver && (
        <GameOverModal
          mode="battle"
          token={token}
          p1Stats={{
            name: player1Name,
            animalId: player1Animal,
            score: p1Score,
            distance: p1Distance,
            coins: p1Coins,
            questionsTotal: p1QTotal,
            questionsCorrect: p1QCorrect,
            lives: p1Lives,
          }}
          p2Stats={{
            name: player2Name,
            animalId: player2Animal,
            score: p2Score,
            distance: p2Distance,
            coins: p2Coins,
            questionsTotal: p2QTotal,
            questionsCorrect: p2QCorrect,
            lives: p2Lives,
          }}
          onRestart={handleRestart}
          onExitToMenu={onExit}
        />
      )}
    </div>
  );
};
