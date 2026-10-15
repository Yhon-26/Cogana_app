import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  listAuthorizedStores,
  subscribeOperationsAuth,
  type AuthorizedStore,
} from '@/services/operations/access';

type ContextValue = {
  stores: AuthorizedStore[];
  store: AuthorizedStore | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  select: (store: AuthorizedStore) => void;
};
const StoreContext = createContext<ContextValue | null>(null);

export function OperationsStoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<AuthorizedStore[]>([]);
  const [store, setStore] = useState<AuthorizedStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const authorized = await listAuthorizedStores();
      setStores(authorized);
      setStore((previous) => authorized.find((item) => item.id === previous?.id) ?? null);
    } catch {
      setStores([]);
      setStore(null);
      setError('No se pudo verificar el acceso a tus tiendas.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
    return subscribeOperationsAuth(() => {
      void refresh();
    });
  }, []);
  return (
    <StoreContext.Provider value={{ stores, store, loading, error, refresh, select: setStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useOperationsStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('OperationsStoreProvider no está disponible.');
  return context;
}
