import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.crispstrobe.crispfxr',
  appName: 'CrispFXR',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    App: {
      allowMixedContent: true
    }
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;