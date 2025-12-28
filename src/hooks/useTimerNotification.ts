import { useCallback, useRef } from 'react';

export const useTimerNotification = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Create audio context on demand (required for mobile)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (needed for mobile browsers)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Create a pleasant notification sound (two-tone chime)
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)
      
      frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now + index * 0.15);
        
        // Envelope for pleasant sound
        gainNode.gain.setValueAtTime(0, now + index * 0.15);
        gainNode.gain.linearRampToValueAtTime(0.3, now + index * 0.15 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.15 + 0.5);
        
        oscillator.start(now + index * 0.15);
        oscillator.stop(now + index * 0.15 + 0.6);
      });

      // Second chime after a brief pause
      setTimeout(() => {
        frequencies.forEach((freq, index) => {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
          
          gainNode.gain.setValueAtTime(0, ctx.currentTime + index * 0.1);
          gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + index * 0.1 + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.1 + 0.4);
          
          oscillator.start(ctx.currentTime + index * 0.1);
          oscillator.stop(ctx.currentTime + index * 0.1 + 0.5);
        });
      }, 600);

    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  const vibrate = useCallback(() => {
    try {
      if ('vibrate' in navigator) {
        // Vibration pattern: vibrate, pause, vibrate, pause, vibrate
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    } catch (error) {
      console.error('Vibration not supported:', error);
    }
  }, []);

  const notifyTimerEnd = useCallback(() => {
    playNotificationSound();
    vibrate();
  }, [playNotificationSound, vibrate]);

  return { notifyTimerEnd, playNotificationSound, vibrate };
};
