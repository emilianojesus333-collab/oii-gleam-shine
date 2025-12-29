import { useEffect, useState, useCallback } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface PushNotificationState {
  token: string | null;
  notifications: PushNotificationSchema[];
  isRegistered: boolean;
  permissionStatus: string | null;
}

export const useNativePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    notifications: [],
    isRegistered: false,
    permissionStatus: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const checkPermissions = useCallback(async () => {
    if (!isNative) return null;

    try {
      const status = await PushNotifications.checkPermissions();
      setState(prev => ({ ...prev, permissionStatus: status.receive }));
      return status.receive;
    } catch (err) {
      console.error('Push permission check error:', err);
      return null;
    }
  }, [isNative]);

  const requestPermissions = useCallback(async () => {
    if (!isNative) return null;

    try {
      const status = await PushNotifications.requestPermissions();
      setState(prev => ({ ...prev, permissionStatus: status.receive }));
      return status.receive;
    } catch (err) {
      console.error('Push permission request error:', err);
      return null;
    }
  }, [isNative]);

  const register = useCallback(async () => {
    if (!isNative) {
      setError('Push notifications only work on native platforms');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const permissionStatus = await requestPermissions();
      
      if (permissionStatus !== 'granted') {
        setError('Push notification permission denied');
        setLoading(false);
        return false;
      }

      await PushNotifications.register();
      setState(prev => ({ ...prev, isRegistered: true }));
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao registar notificações push';
      setError(errorMessage);
      console.error('Push registration error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isNative, requestPermissions]);

  const unregister = useCallback(async () => {
    if (!isNative) return;

    try {
      await PushNotifications.removeAllListeners();
      setState(prev => ({ 
        ...prev, 
        isRegistered: false, 
        token: null,
        notifications: [] 
      }));
    } catch (err) {
      console.error('Push unregister error:', err);
    }
  }, [isNative]);

  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, []);

  useEffect(() => {
    if (!isNative) return;

    // Registration success handler
    const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      setState(prev => ({ ...prev, token: token.value }));
    });

    // Registration error handler
    const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      setError('Erro no registo de notificações push');
    });

    // Notification received while app is in foreground
    const notificationReceivedListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        setState(prev => ({
          ...prev,
          notifications: [...prev.notifications, notification],
        }));
      }
    );

    // Notification action performed (user tapped notification)
    const notificationActionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('Push notification action performed:', action);
        // Handle notification tap - navigate to specific screen, etc.
      }
    );

    // Check initial permission status
    checkPermissions();

    return () => {
      registrationListener.then(l => l.remove());
      registrationErrorListener.then(l => l.remove());
      notificationReceivedListener.then(l => l.remove());
      notificationActionListener.then(l => l.remove());
    };
  }, [isNative, checkPermissions]);

  return {
    ...state,
    loading,
    error,
    isNative,
    register,
    unregister,
    checkPermissions,
    requestPermissions,
    clearNotifications,
  };
};
