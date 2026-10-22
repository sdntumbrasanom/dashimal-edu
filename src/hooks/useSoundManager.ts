import { useCallback, useState, useEffect } from 'react';
import {
  startBGM,
  stopBGM,
  getCurrentBGMTrack,
  playJumpSound,
  playSlideSound,
  playCoinSound,
  playHitSound,
  playQuestionBonusSound,
  playCorrectSound,
  playWrongSound,
  playGameOverSound,
  getMuted,
  setMuted,
} from '../utils/sound.ts';

export function useSoundManager(autoBGMTrack?: 'title' | 'game') {
  const [isMuted, setIsMutedState] = useState<boolean>(getMuted());

  useEffect(() => {
    const handleSoundToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.muted === 'boolean') {
        setIsMutedState(customEvent.detail.muted);
      } else {
        setIsMutedState(getMuted());
      }
    };
    window.addEventListener('subway_sound_toggle', handleSoundToggle);
    return () => window.removeEventListener('subway_sound_toggle', handleSoundToggle);
  }, []);

  // Optionally auto-play BGM on mount and cleanup on unmount
  useEffect(() => {
    if (autoBGMTrack) {
      startBGM(autoBGMTrack);
    }
  }, [autoBGMTrack]);

  const playBGM = useCallback((track: 'title' | 'game' = 'title') => {
    startBGM(track);
  }, []);

  const pauseBGM = useCallback(() => {
    stopBGM();
  }, []);

  const toggleMute = useCallback(() => {
    const next = !getMuted();
    setMuted(next);
    setIsMutedState(next);
    return next;
  }, []);

  return {
    isMuted,
    toggleMute,
    playBGM,
    stopBGM: pauseBGM,
    currentBGM: getCurrentBGMTrack(),
    playJump: playJumpSound,
    playSlide: playSlideSound,
    playCoin: playCoinSound,
    playHit: playHitSound,
    playBonus: playQuestionBonusSound,
    playCorrect: playCorrectSound,
    playWrong: playWrongSound,
    playGameOver: playGameOverSound,
  };
}
