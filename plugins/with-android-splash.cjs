const { withAndroidStyles } = require('expo/config-plugins');

// A cream-only launch screen needs no generated logo. Expo's current template
// references splashscreen_logo even when no splash image has been configured.
// Register BEFORE expo-splash-screen: Expo's mod composition then applies this
// correction after that plugin creates the theme.
module.exports = function withAndroidSplash(config) {
  const splash = config.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen',
  )?.[1];
  if (
    splash?.image ||
    splash?.android?.image ||
    config.splash?.image ||
    config.android?.splash?.image
  ) {
    return config;
  }
  return withAndroidStyles(config, (result) => {
    const theme = result.modResults.resources.style?.find(
      (style) => style.$.name === 'Theme.App.SplashScreen',
    );
    const icon = theme?.item?.find((item) => item.$.name === 'windowSplashScreenAnimatedIcon');
    if (icon) icon._ = '@android:color/transparent';
    return result;
  });
};
