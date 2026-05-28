/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: 'SmartRootsMOVIL',
  slug: 'SmartRootsMOVIL',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.jchantre.smartroots',
    versionCode: 1,
  },
  assetBundlePatterns: ['assets/web/**/*'],
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    apiBase: 'https://jchantre.pythonanywhere.com',
    webUrl: 'https://jchantre-jpg.github.io/SmartRoots/',
    eas: {
      projectId: '0eebefa0-4c85-45b2-be8a-626356cb49bd',
    },
  },
};
