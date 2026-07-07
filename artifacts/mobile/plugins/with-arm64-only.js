const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Expo config plugin: restrict to arm64-v8a to reduce APK size.
 */
function withArm64Only(config) {
  return withAppBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

    // Only add if not already present
    if (contents.includes("abiFilters")) {
      return modConfig;
    }

    // Insert ndk abiFilters inside defaultConfig block
    const marker = "defaultConfig {";
    const idx = contents.indexOf(marker);
    if (idx !== -1) {
      const insertAt = idx + marker.length;
      contents =
        contents.slice(0, insertAt) +
        '\n        ndk { abiFilters "arm64-v8a" }' +
        contents.slice(insertAt);
    }

    modConfig.modResults.contents = contents;
    return modConfig;
  });
}

module.exports = withArm64Only;
