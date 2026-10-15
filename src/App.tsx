import React, { useState, useEffect } from 'react';
import { GameView, GameMode, AnimalId, QuizToken } from './types/game.ts';
import { TitleScreen } from './components/TitleScreen.tsx';
import { ModeSelect } from './components/ModeSelect.tsx';
import { LobbyScreen } from './components/LobbyScreen.tsx';
import { CharacterSelect } from './components/CharacterSelect.tsx';
import { SoloRunnerView } from './components/SoloRunnerView.tsx';
import { BattleRunnerView } from './components/BattleRunnerView.tsx';
import { TeacherPortal } from './components/TeacherPortal.tsx';
import { getAllTokens } from './utils/tokenStore.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<GameView>('title');
  const [selectedMode, setSelectedMode] = useState<GameMode>('solo');

  // Player and Session state
  const [player1Name, setPlayer1Name] = useState('Budi');
  const [player2Name, setPlayer2Name] = useState('Siti');
  const [player1Animal, setPlayer1Animal] = useState<AnimalId>('kelinci');
  const [player2Animal, setPlayer2Animal] = useState<AnimalId>('harimau');
  const [activeToken, setActiveToken] = useState<QuizToken | null>(null);

  // Initialize with default token if available
  useEffect(() => {
    const tokens = getAllTokens();
    if (tokens.length > 0) {
      setActiveToken(tokens[0]);
    }
  }, []);

  // Sync state to body attribute for accessibility & automated tests
  useEffect(() => {
    if (currentView === 'playing') {
      document.body.dataset.state = 'playing';
    } else if (currentView === 'title') {
      document.body.dataset.state = 'title';
    } else {
      document.body.dataset.state = currentView;
    }
  }, [currentView]);

  // Support ?autostart=1 to jump straight into gameplay for verification tests
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        const modeParam = params.get('mode') === 'battle' ? 'battle' : 'solo';
        setSelectedMode(modeParam);
        setPlayer1Name('Pemain Uji');
        setPlayer2Name('Pemain Lawan');
        setPlayer1Animal('kelinci');
        setPlayer2Animal('harimau');
        setCurrentView('playing');
      }
    }
  }, []);

  const handleStartFromTitle = () => {
    setCurrentView('mode-select');
  };

  const handleSelectMode = (mode: GameMode) => {
    setSelectedMode(mode);
    setCurrentView('lobby');
  };

  const handleLobbyProceed = (data: {
    player1Name: string;
    player2Name?: string;
    token: QuizToken | null;
  }) => {
    setPlayer1Name(data.player1Name);
    if (data.player2Name) setPlayer2Name(data.player2Name);
    if (data.token) setActiveToken(data.token);
    setCurrentView('character-select');
  };

  const handleSelectAnimals = (p1Animal: AnimalId, p2Animal?: AnimalId) => {
    setPlayer1Animal(p1Animal);
    if (p2Animal) setPlayer2Animal(p2Animal);
    setCurrentView('playing');
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 font-sans antialiased text-slate-100">
      {currentView === 'title' && (
        <TitleScreen
          onStartGame={handleStartFromTitle}
          onOpenTeacherPortal={() => setCurrentView('teacher-portal')}
        />
      )}

      {currentView === 'mode-select' && (
        <ModeSelect
          onSelectMode={handleSelectMode}
          onBack={() => setCurrentView('title')}
        />
      )}

      {currentView === 'lobby' && (
        <LobbyScreen
          mode={selectedMode}
          onProceed={handleLobbyProceed}
          onBack={() => setCurrentView('mode-select')}
        />
      )}

      {currentView === 'character-select' && (
        <CharacterSelect
          mode={selectedMode}
          player1Name={player1Name}
          player2Name={selectedMode === 'battle' ? player2Name : undefined}
          onSelectAnimals={handleSelectAnimals}
          onBack={() => setCurrentView('lobby')}
        />
      )}

      {currentView === 'playing' && selectedMode === 'solo' && (
        <SoloRunnerView
          playerName={player1Name}
          animalId={player1Animal}
          token={activeToken}
          onExit={() => setCurrentView('title')}
        />
      )}

      {currentView === 'playing' && selectedMode === 'battle' && (
        <BattleRunnerView
          player1Name={player1Name}
          player1Animal={player1Animal}
          player2Name={player2Name}
          player2Animal={player2Animal}
          token={activeToken}
          onExit={() => setCurrentView('title')}
        />
      )}

      {currentView === 'teacher-portal' && (
        <TeacherPortal onBack={() => setCurrentView('title')} />
      )}
    </div>
  );
}
