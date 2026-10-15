// Validate untrusted links before Expo Router parses their query parameters.
// This mitigates malformed-encoding DoS in its current query-string dependency.
// Do not decode the returned value: Router must receive the original encoding.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  if (typeof path !== 'string' || path.length > 2048) return '/';
  try {
    decodeURIComponent(path);
    return path;
  } catch {
    return '/';
  }
}
