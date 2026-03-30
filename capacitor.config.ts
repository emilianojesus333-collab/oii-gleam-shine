import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.liftmate.app',
  appName: 'LiftMate',
  webDir: 'dist',
  // Only use live-reload server in development
  // In production builds, Capacitor serves from the local dist/ folder
  ...(isDev && {
    server: {
      url: 'http://localhost:8080',
      cleartext: true,
    },
  }),
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
