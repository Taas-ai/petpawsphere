import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.petpawsphere.app',
  appName: 'PetPawSphere',
  webDir: 'dist',
  server: {
    // For dev: proxy to local API
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : undefined,
    cleartext: true,
  },
  ios: {
    scheme: 'PetPawSphere',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#f59e0b',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
