import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Configure only this process; leave the user's global PATH and Android setup intact.
const sdk =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.platform === 'win32' && process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, 'Android', 'Sdk')
    : '');
const exe = process.platform === 'win32' ? '.exe' : '';
const adb = sdk && join(sdk, 'platform-tools', `adb${exe}`);
const emulator = sdk && join(sdk, 'emulator', `emulator${exe}`);
if (!adb || !emulator || !existsSync(adb) || !existsSync(emulator)) {
  console.error(
    'Instala Android SDK desde Android Studio y configura ANDROID_HOME. Consulta docs/mobile/setup.md.',
  );
  process.exit(1);
}
const devices = spawnSync(adb, ['devices'], { encoding: 'utf8' });
const avds = spawnSync(emulator, ['-list-avds'], { encoding: 'utf8' });
if (!/\tdevice\b/.test(devices.stdout ?? '') && !(avds.stdout ?? '').trim()) {
  console.error(
    'No hay un Android conectado ni un AVD creado. En Android Studio abre Device Manager > Create Virtual Device, inicia el dispositivo y repite npm.cmd run android.',
  );
  const images = join(sdk, 'system-images');
  if (existsSync(images)) console.error(`Imágenes instaladas: ${readdirSync(images).join(', ')}`);
  process.exit(1);
}
const separator = process.platform === 'win32' ? ';' : ':';
const result = spawnSync(
  process.execPath,
  [join('node_modules', 'expo', 'bin', 'cli'), 'start', '--go', '--android'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      ANDROID_HOME: sdk,
      ANDROID_SDK_ROOT: sdk,
      PATH: [join(sdk, 'platform-tools'), join(sdk, 'emulator'), process.env.PATH].join(separator),
    },
  },
);
process.exit(result.status ?? 1);
