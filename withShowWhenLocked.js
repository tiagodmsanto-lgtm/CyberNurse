const { withMainActivity } = require('@expo/config-plugins');

module.exports = function withShowWhenLocked(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    // We need to add imports
    if (!contents.includes('import android.os.Build;')) {
      contents = contents.replace(
        'import android.os.Bundle;',
        'import android.os.Bundle;\nimport android.os.Build;\nimport android.view.WindowManager;'
      );
    }

    // Inside onCreate, before super.onCreate(null)
    const injection = `
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true);
      setTurnScreenOn(true);
    } else {
      getWindow().addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      );
    }
    `;

    if (!contents.includes('setShowWhenLocked(true);')) {
      contents = contents.replace(
        'super.onCreate(null);',
        `${injection}\n    super.onCreate(null);`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};
