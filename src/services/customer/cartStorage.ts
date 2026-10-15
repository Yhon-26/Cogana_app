import { parseSavedCart, serializeCart } from './cartPersistence';
import type { CustomerCartLine } from './cart';
type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};
let sequence = 0;
function manifest(raw: string | null) {
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 2)
    return null;
  if (
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !/^\d+-\d+$/.test(value.id) ||
    !('chunks' in value) ||
    typeof value.chunks !== 'number' ||
    !Number.isInteger(value.chunks) ||
    value.chunks < 1 ||
    value.chunks > 20
  )
    throw new Error('No pudimos recuperar el carrito.');
  return { id: value.id, chunks: value.chunks };
}
export async function readStoredCart(storage: Storage, key: string) {
  const raw = await storage.getItem(key);
  const saved = manifest(raw);
  if (!saved) return parseSavedCart(raw);
  const chunks = await Promise.all(
    Array.from({ length: saved.chunks }, (_, index) =>
      storage.getItem(`${key}.${saved.id}.${index}`),
    ),
  );
  if (chunks.some((chunk) => chunk === null))
    throw new Error('El carrito guardado está incompleto.');
  return parseSavedCart(chunks.join(''));
}
export async function writeStoredCart(
  storage: Storage,
  key: string,
  lines: readonly CustomerCartLine[],
) {
  const raw = serializeCart(lines);
  let previous: ReturnType<typeof manifest> = null;
  try {
    previous = manifest(await storage.getItem(key));
  } catch {
    /* A new explicit cart edit replaces a corrupt manifest. */
  }
  const id = `${Date.now()}-${++sequence}`;
  const chunks = Array.from({ length: Math.ceil(raw.length / 1800) }, (_, index) =>
    raw.slice(index * 1800, (index + 1) * 1800),
  );
  try {
    for (const [index, chunk] of chunks.entries())
      await storage.setItem(`${key}.${id}.${index}`, chunk);
    await storage.setItem(key, JSON.stringify({ version: 2, id, chunks: chunks.length }));
  } catch (failure) {
    await Promise.all(
      chunks.map((_, index) => storage.removeItem(`${key}.${id}.${index}`).catch(() => undefined)),
    );
    throw failure;
  }
  if (previous)
    await Promise.all(
      Array.from({ length: previous.chunks }, (_, index) =>
        storage.removeItem(`${key}.${previous.id}.${index}`).catch(() => undefined),
      ),
    );
}
export async function clearStoredCart(storage: Storage, key: string) {
  let saved: ReturnType<typeof manifest> = null;
  try {
    saved = manifest(await storage.getItem(key));
  } catch {
    /* Remove the corrupt pointer on sign-out too. */
  }
  await storage.removeItem(key);
  if (saved)
    await Promise.all(
      Array.from({ length: saved.chunks }, (_, index) =>
        storage.removeItem(`${key}.${saved.id}.${index}`),
      ),
    );
}
