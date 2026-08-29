import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundSynth } from '../utils/soundSynth';

interface SoundContextType {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  toggleSound: () => void;
  toggleHaptics: () => void;
  playDartHit: () => void;
  playDoubleHit: () => void;
  playTripleHit: () => void;
  playBullseye: () => void;
  playBust: () => void;
  playKingCrowned: () => void;
  playLifeLost: () => void;
  playEliminated: () => void;
  play180: () => void;
  playVictory: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('dartmaster_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('dartmaster_haptics_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    soundSynth.setEnabled(soundEnabled);
    localStorage.setItem('dartmaster_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('dartmaster_haptics_enabled', String(hapticsEnabled));
  }, [hapticsEnabled]);

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const toggleHaptics = () => {
    setHapticsEnabled((prev) => !prev);
  };

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        hapticsEnabled,
        toggleSound,
        toggleHaptics,
        playDartHit: () => soundSynth.playDartHit(),
        playDoubleHit: () => soundSynth.playDoubleHit(),
        playTripleHit: () => soundSynth.playTripleHit(),
        playBullseye: () => soundSynth.playBullseye(),
        playBust: () => soundSynth.playBust(),
        playKingCrowned: () => soundSynth.playKingCrowned(),
        playLifeLost: () => soundSynth.playLifeLost(),
        playEliminated: () => soundSynth.playEliminated(),
        play180: () => soundSynth.play180(),
        playVictory: () => soundSynth.playVictory(),
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export function useSound(): SoundContextType {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within SoundProvider');
  return ctx;
}
