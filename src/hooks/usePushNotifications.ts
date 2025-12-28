import { useState, useEffect, useCallback } from 'react';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: number;
  tag: string;
  timeoutId?: NodeJS.Timeout;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);

  // Check if notifications are supported
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission as NotificationPermission);
    }
  }, []);

  // Register service worker
  useEffect(() => {
    if (!isSupported) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setSwRegistration(registration);
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerSW();
  }, [isSupported]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Show immediate notification
  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions & { data?: Record<string, unknown> }
  ) => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      if (swRegistration) {
        await swRegistration.showNotification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      } else {
        // Fallback to regular notification
        new Notification(title, options);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [permission, swRegistration]);

  // Schedule notification for a specific time
  const scheduleNotification = useCallback((
    id: string,
    title: string,
    body: string,
    scheduledTime: Date,
    tag: string = 'scheduled'
  ) => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const now = Date.now();
    const delay = scheduledTime.getTime() - now;

    if (delay <= 0) {
      console.warn('Scheduled time is in the past');
      return;
    }

    // Cancel existing notification with same id
    cancelNotification(id);

    const timeoutId = setTimeout(() => {
      showNotification(title, { body, tag, data: { id } });
      
      // Remove from scheduled list
      setScheduledNotifications(prev => prev.filter(n => n.id !== id));
    }, delay);

    const notification: ScheduledNotification = {
      id,
      title,
      body,
      scheduledTime: scheduledTime.getTime(),
      tag,
      timeoutId,
    };

    setScheduledNotifications(prev => [...prev, notification]);
  }, [permission, showNotification]);

  // Cancel scheduled notification
  const cancelNotification = useCallback((id: string) => {
    setScheduledNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification?.timeoutId) {
        clearTimeout(notification.timeoutId);
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  // Cancel all scheduled notifications
  const cancelAllNotifications = useCallback(() => {
    scheduledNotifications.forEach(n => {
      if (n.timeoutId) {
        clearTimeout(n.timeoutId);
      }
    });
    setScheduledNotifications([]);
  }, [scheduledNotifications]);

  // Schedule hydration reminder (repeating)
  const scheduleHydrationReminder = useCallback((intervalMinutes: number) => {
    if (permission !== 'granted') return;

    const scheduleNext = () => {
      const nextTime = new Date(Date.now() + intervalMinutes * 60 * 1000);
      scheduleNotification(
        `hydration-${Date.now()}`,
        '💧 Hora de beber água!',
        'Mantém-te hidratado para um melhor desempenho no treino.',
        nextTime,
        'hydration'
      );
    };

    scheduleNext();
    
    // Return interval ID for cleanup
    const intervalId = setInterval(scheduleNext, intervalMinutes * 60 * 1000);
    return intervalId;
  }, [permission, scheduleNotification]);

  // Schedule supplement reminder
  const scheduleSupplementReminder = useCallback((
    name: string,
    time: string, // HH:MM format
    days: number[]
  ) => {
    if (permission !== 'granted') return;

    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const today = now.getDay();

    // Find next occurrence
    let daysUntil = 0;
    for (let i = 0; i < 7; i++) {
      const checkDay = (today + i) % 7;
      if (days.includes(checkDay)) {
        const scheduledDate = new Date(now);
        scheduledDate.setDate(scheduledDate.getDate() + i);
        scheduledDate.setHours(hours, minutes, 0, 0);
        
        if (scheduledDate > now) {
          scheduleNotification(
            `supplement-${name}-${scheduledDate.getTime()}`,
            `💊 ${name}`,
            `Não te esqueças de tomar ${name}!`,
            scheduledDate,
            'supplement'
          );
          break;
        }
      }
    }
  }, [permission, scheduleNotification]);

  // Schedule workout reminder
  const scheduleWorkoutReminder = useCallback((
    workoutTime: Date,
    minutesBefore: number,
    motivationalMessage: boolean
  ) => {
    if (permission !== 'granted') return;

    const reminderTime = new Date(workoutTime.getTime() - minutesBefore * 60 * 1000);
    
    if (reminderTime <= new Date()) return;

    const messages = [
      'A dor de hoje é a vitória de amanhã! 💪',
      'Cada repetição conta. Bora treinar!',
      'O único treino mau é o que não fizeste!',
      'Levanta, treina, repete. 🔥',
    ];

    const body = motivationalMessage 
      ? messages[Math.floor(Math.random() * messages.length)]
      : `O teu treino começa em ${minutesBefore} minutos.`;

    scheduleNotification(
      `workout-${workoutTime.getTime()}`,
      '🏋️ Hora de Treinar!',
      body,
      reminderTime,
      'workout'
    );
  }, [permission, scheduleNotification]);

  // Schedule sleep reminder
  const scheduleSleepReminder = useCallback((
    bedtime: string, // HH:MM format
    minutesBefore: number
  ) => {
    if (permission !== 'granted') return;

    const [hours, minutes] = bedtime.split(':').map(Number);
    const now = new Date();
    const scheduledDate = new Date(now);
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    // If bedtime already passed today, schedule for tomorrow
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const reminderTime = new Date(scheduledDate.getTime() - minutesBefore * 60 * 1000);

    if (reminderTime <= now) return;

    scheduleNotification(
      `sleep-${scheduledDate.getTime()}`,
      '😴 Hora de Descansar',
      'Dormir bem = mais ganhos! Prepara-te para ir para a cama.',
      reminderTime,
      'sleep'
    );
  }, [permission, scheduleNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    scheduleHydrationReminder,
    scheduleSupplementReminder,
    scheduleWorkoutReminder,
    scheduleSleepReminder,
    scheduledNotifications,
  };
};
