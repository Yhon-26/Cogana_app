const { withAndroidManifest } = require('expo/config-plugins');

// Persist across Expo prebuild. Debug's manifest may allow HTTP for Metro;
// release must keep HTTPS-only traffic and must not inherit that exception.
module.exports = function withAndroidSecurity(config) {
  return withAndroidManifest(config, (result) => {
    const application = result.modResults.manifest.application?.[0];
    if (!application) throw new Error('Android application manifest is missing.');
    application.$['android:usesCleartextTraffic'] = 'false';
    application.$['android:allowBackup'] = 'false';
    const activity = application.activity?.find(
      (entry) => entry.$['android:name'] === '.MainActivity',
    );
    // Retain Expo's singleTask routing; do not share an affinity with other apps.
    if (activity) activity.$['android:taskAffinity'] = '';
    return result;
  });
};
