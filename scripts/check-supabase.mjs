const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key?.startsWith('sb_publishable_')) {
  console.error('Falta la URL o la clave pública de Supabase en .env.local.');
  process.exit(1);
}
try {
  // Auth settings verifies the project and public key without reading customer data or creating users.
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const settings = await response.json();
  if (!settings.external) throw new Error('Respuesta inesperada de Auth');
  console.log(
    `Supabase conectado: ${new URL(url).hostname} (HTTP ${response.status}). Sin escrituras ni lectura de datos de negocio.`,
  );
} catch (error) {
  console.error(`No se pudo verificar Supabase: ${error.message}`);
  process.exit(1);
}
