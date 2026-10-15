import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Supply Gradle's merged RELEASE manifest, never the source or debug manifest.
// This gate complements MobSF; signing and native-code findings need the APK.
const file = process.argv[2];
assert.ok(file, 'Pass the path to the merged release AndroidManifest.xml.');
const xml = readFileSync(file, 'utf8');
assert.ok(!xml.includes('tools:node="remove"'), 'Use the merged manifest, not source.');
assert.match(xml, /android:allowBackup="false"/);
assert.match(xml, /android:usesCleartextTraffic="false"/);
assert.doesNotMatch(
  xml,
  /android:networkSecurityConfig=/,
  'Review a custom network security XML before relying on the cleartext flag.',
);
assert.doesNotMatch(xml, /android:debuggable="true"/);
for (const permission of [
  'READ_EXTERNAL_STORAGE',
  'WRITE_EXTERNAL_STORAGE',
  'SYSTEM_ALERT_WINDOW',
]) {
  assert.ok(
    !xml.includes(`android.permission.${permission}`),
    `Unexpected permission: ${permission}`,
  );
}
const target = xml.match(/android:targetSdkVersion="(\d+)"/);
assert.ok(target && Number(target[1]) >= 36, 'Missing or downgraded target SDK.');
console.log('Merged release manifest security checks passed.');
