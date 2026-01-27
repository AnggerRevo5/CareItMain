import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.careit.app',
  appName: 'CareIt',
  webDir: 'out',
  server: {
    url: process.env.NEXT_PUBLIC_API_URL || "http://10.0.2.2:3000",
    cleartext: true
  },
  // iOS and Android specific configuration
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;
