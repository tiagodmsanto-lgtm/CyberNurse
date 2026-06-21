const { withProjectBuildGradle } = require('@expo/config-plugins');

const withNotifeeRepo = (config) => {
  return withProjectBuildGradle(config, async (config) => {
    if (config.modResults.language === 'groovy') {
      const buildGradle = config.modResults.contents;
      const notifeeRepo = `
        maven {
            // Repositório local do Notifee adicionado via plugin customizado
            url("$rootDir/../node_modules/@notifee/react-native/android/libs")
        }
      `;
      // Adiciona o repositório dentro do bloco allprojects { repositories { ... } }
      if (!buildGradle.includes('url("$rootDir/../node_modules/@notifee/react-native/android/libs")')) {
        config.modResults.contents = buildGradle.replace(
          /allprojects\s*\{\s*repositories\s*\{/,
          `allprojects {\n    repositories {${notifeeRepo}`
        );
      }
    }
    return config;
  });
};

module.exports = withNotifeeRepo;
