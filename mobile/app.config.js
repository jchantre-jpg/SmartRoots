/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json').expo;

module.exports = {
  ...base,
  extra: {
    ...base.extra,
    /** API en la nube (PythonAnywhere) — usada en el APK instalable. */
    apiBase: 'https://jchantre.pythonanywhere.com',
    /** Misma UI que GitHub Pages. */
    webUrl: 'https://jchantre-jpg.github.io/SmartRoots/',
    eas: {
      projectId: '0eebefa0-4c85-45b2-be8a-626356cb49bd',
    },
  },
  android: {
    ...base.android,
    package: 'com.jchantre.smartroots',
    versionCode: 1,
  },
};
