import { useCallback, useMemo } from 'react';

type SoundType = 'workout' | 'meal' | 'water' | 'supplement' | 'sleep' | 'streak' | 'default';

// Web Audio API sound generator for different notification types
export const useNotificationSounds = () => {
  const audioContext = useMemo(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      return new AudioContext();
    }
    return null;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!audioContext) return;

    // Resume audio context if suspended (required by browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const now = audioContext.currentTime;

    switch (type) {
      case 'workout':
        // Energetic double beep - motivating
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.setValueAtTime(1100, now + 0.1);
        oscillator.frequency.setValueAtTime(880, now + 0.2);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.35);
        break;

      case 'meal':
        // Pleasant chime - like a bell
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, now); // C5
        oscillator.frequency.setValueAtTime(659, now + 0.15); // E5
        oscillator.frequency.setValueAtTime(784, now + 0.3); // G5
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.3);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;

      case 'water':
        // Water drop sound - bubble effect
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;

      case 'supplement':
        // Pill/capsule sound - soft click
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.setValueAtTime(800, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;

      case 'sleep':
        // Calm lullaby-like tone
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(392, now); // G4
        oscillator.frequency.linearRampToValueAtTime(330, now + 0.3); // E4
        oscillator.frequency.linearRampToValueAtTime(262, now + 0.6); // C4
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.linearRampToValueAtTime(0.08, now + 0.4);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.7);
        oscillator.start(now);
        oscillator.stop(now + 0.7);
        break;

      case 'streak':
        // Victory fanfare - celebration
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(523, now); // C5
        oscillator.frequency.setValueAtTime(659, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, now + 0.2); // G5
        oscillator.frequency.setValueAtTime(1047, now + 0.3); // C6
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.2);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;

      default:
        // Default notification beep
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }
  }, [audioContext]);

  const playWorkoutSound = useCallback(() => playSound('workout'), [playSound]);
  const playMealSound = useCallback(() => playSound('meal'), [playSound]);
  const playWaterSound = useCallback(() => playSound('water'), [playSound]);
  const playSupplementSound = useCallback(() => playSound('supplement'), [playSound]);
  const playSleepSound = useCallback(() => playSound('sleep'), [playSound]);
  const playStreakSound = useCallback(() => playSound('streak'), [playSound]);
  const playDefaultSound = useCallback(() => playSound('default'), [playSound]);

  return {
    playSound,
    playWorkoutSound,
    playMealSound,
    playWaterSound,
    playSupplementSound,
    playSleepSound,
    playStreakSound,
    playDefaultSound,
  };
};
