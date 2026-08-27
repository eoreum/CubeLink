import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kr.eoreum.cubelink.tablet',
  appName: 'CubeLink Studio Tablet',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
