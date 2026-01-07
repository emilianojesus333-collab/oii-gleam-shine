/**
 * Haptic feedback utility for web and native apps
 * Uses the Vibration API (supported in browsers and Capacitor)
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20, 50, 10], // celebratory pattern
  warning: [30, 50, 30],
  error: [50, 100, 50],
};

/**
 * Trigger haptic feedback if available
 */
export function hapticFeedback(pattern: HapticPattern = 'light'): void {
  try {
    // Check if Vibration API is available
    if ('vibrate' in navigator) {
      navigator.vibrate(patterns[pattern]);
    }
  } catch (error) {
    // Silently fail - haptics are optional
    console.debug('[Haptics] Not available:', error);
  }
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticsSupported(): boolean {
  return 'vibrate' in navigator;
}
