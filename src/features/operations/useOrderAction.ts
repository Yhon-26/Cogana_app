import { useRef, useState } from 'react';
import { randomUUID } from 'expo-crypto';

export function useOrderAction(onSaved: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const attempts = useRef(new Map<string, string>());
  const run = async (key: string, action: (operationId: string) => Promise<unknown>) => {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError('');
    const operationId = attempts.current.get(key) ?? randomUUID();
    attempts.current.set(key, operationId);
    try {
      await action(operationId);
      attempts.current.delete(key);
      onSaved();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No pudimos guardar el cambio.');
    } finally {
      active.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error };
}
