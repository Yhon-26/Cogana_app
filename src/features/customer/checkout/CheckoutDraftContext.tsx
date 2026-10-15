import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  addPresentation,
  setBulkLine,
  type BulkRequest,
  type CustomerCartLine,
} from '@/services/customer/cart';
import { listCustomerCatalog } from '@/services/customer/catalog';
import type { SelectedCheckoutSlot } from '@/services/customer/checkoutSchedule';
import { customerStoreSlug } from '@/services/customer/checkoutSchedule';
import { getCustomerAuthClient } from '@/services/customer/auth';
import { sessionStorage } from '@/services/supabase/storage';
import { readStoredCart, writeStoredCart, clearStoredCart } from '@/services/customer/cartStorage';
import { mergeSavedCart } from '@/services/customer/cartPersistence';

type DeliveryDraft = {
  zoneId: string;
  district: string;
  address: string;
  reference: string;
  phone: string;
};

export type PaymentMethod = 'yape' | 'plin' | 'cash';

type CheckoutDraftValue = {
  fulfillmentMode: 'delivery' | 'pickup';
  setFulfillmentMode: (mode: 'delivery' | 'pickup') => void;
  selectedSlot: SelectedCheckoutSlot | null;
  setSelectedSlot: (slot: SelectedCheckoutSlot | null) => void;
  delivery: DeliveryDraft;
  setDeliveryField: (field: keyof DeliveryDraft, value: string) => void;
  cartLines: readonly CustomerCartLine[] | null;
  setCartLines: Dispatch<SetStateAction<readonly CustomerCartLine[] | null>>;
  cartError: boolean;
  addToCart: (presentationId: string, quantity: number) => Promise<void>;
  addBulkToCart: (presentationId: string, request: BulkRequest) => Promise<void>;
  reloadCart: () => void;
  paymentMethod: PaymentMethod | null;
  setPaymentMethod: (method: PaymentMethod | null) => void;
  resetCheckoutDraft: () => void;
  flushCartPersistence: () => Promise<void>;
};

const CheckoutDraftContext = createContext<CheckoutDraftValue | null>(null);

const emptyDelivery: DeliveryDraft = {
  zoneId: '',
  district: '',
  address: '',
  reference: '',
  phone: '',
};

// El carrito se guarda por cuenta; contacto, horario y modalidad son preferencias en memoria.
// El servidor confirma precios, stock, tarifas y disponibilidad al crear el pedido.
export function CheckoutDraftProvider({ children }: { children: ReactNode }) {
  const [delivery, setDelivery] = useState<DeliveryDraft>(emptyDelivery);
  const [cartLines, setCartState] = useState<readonly CustomerCartLine[] | null>(null);
  const cartRef = useRef<readonly CustomerCartLine[] | null>(null);
  const scope = useRef<string | null>(null);
  const pendingStorage = useRef(Promise.resolve());
  const storageFailure = useRef<Error | null>(null);
  const [cartError, setCartError] = useState(false);
  const setCartLines: Dispatch<SetStateAction<readonly CustomerCartLine[] | null>> = useCallback(
    (action) => {
      const next = typeof action === 'function' ? action(cartRef.current) : action;
      cartRef.current = next;
      setCartState(next);
      const key = scope.current;
      if (key && next) {
        pendingStorage.current = pendingStorage.current
          .then(async () => {
            await writeStoredCart(sessionStorage, key, next);
            storageFailure.current = null;
          })
          .catch(() => {
            storageFailure.current = new Error(
              'No pudimos guardar el carrito en este dispositivo.',
            );
            setCartError(true);
          });
      }
    },
    [],
  );
  const [fulfillmentMode, setMode] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  // Only a preference. The order transaction must reserve and revalidate it.
  const [selectedSlot, setSelectedSlot] = useState<SelectedCheckoutSlot | null>(null);
  const setFulfillmentMode = useCallback((mode: 'delivery' | 'pickup') => {
    setMode(mode);
    setSelectedSlot((current) => (current?.mode === mode ? current : null));
    setPaymentMethod((current) => (mode === 'delivery' && current === 'cash' ? null : current));
  }, []);
  useEffect(() => {
    let active = true;
    const guestKey = `cart.${customerStoreSlug}.guest`;
    const {
      data: { subscription },
    } = getCustomerAuthClient().auth.onAuthStateChange((event, session) => {
      const userId = session?.user.is_anonymous ? null : session?.user.id;
      const key = userId ? `cart.${customerStoreSlug}.${userId}` : guestKey;
      if (scope.current === key && event !== 'SIGNED_OUT') return;
      const previous = scope.current;
      const guestIntent = previous === guestKey && userId ? cartRef.current : null;
      scope.current = key;
      cartRef.current = null;
      setCartState(null);
      setDelivery({ ...emptyDelivery });
      setPaymentMethod(null);
      setSelectedSlot(null);
      pendingStorage.current = pendingStorage.current
        .then(async () => {
          if (event === 'SIGNED_OUT') {
            setMode('delivery');
            if (previous) await clearStoredCart(sessionStorage, previous);
            await clearStoredCart(sessionStorage, guestKey);
          }
          let lines = await readStoredCart(sessionStorage, key);
          if (guestIntent?.length) {
            lines = mergeSavedCart(lines, guestIntent);
            await writeStoredCart(sessionStorage, key, lines);
            await clearStoredCart(sessionStorage, guestKey);
          }
          if (active && scope.current === key) {
            cartRef.current = lines;
            setCartState(lines);
            setCartError(false);
          }
        })
        .catch(() => {
          if (active && scope.current === key) {
            cartRef.current = [];
            setCartState([]);
            setCartError(true);
          }
        });
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const setDeliveryField = useCallback((field: keyof DeliveryDraft, value: string) => {
    setDelivery((current) => ({ ...current, [field]: value }));
  }, []);
  const addToCart = useCallback(
    async (presentationId: string, quantity: number) => {
      if (cartRef.current === null) throw new Error('Espera a que termine de cargar tu carrito.');
      const catalog = await listCustomerCatalog();
      const product = catalog.find((item) => item.id === presentationId);
      if (!product) throw new Error('Este producto ya no esta disponible.');
      // Revalidate the latest price/availability before accepting local intent.
      if (quantity > product.maxPresentations) throw new Error('Stock insuficiente.');
      const next = addPresentation(cartRef.current ?? [], product, quantity);
      cartRef.current = next;
      setCartLines(next);
    },
    [setCartLines],
  );
  const reloadCart = useCallback(() => setCartError(false), []);
  const addBulkToCart = useCallback(
    async (presentationId: string, request: BulkRequest) => {
      if (cartRef.current === null) throw new Error('Espera a que termine de cargar tu carrito.');
      const product = (await listCustomerCatalog()).find((item) => item.id === presentationId);
      if (!product) throw new Error('Este producto ya no está disponible.');
      setCartLines(setBulkLine(cartRef.current ?? [], product, request));
    },
    [setCartLines],
  );
  const resetCheckoutDraft = useCallback(() => {
    setMode('delivery');
    setDelivery({ ...emptyDelivery });
    setCartLines([]);
    setCartError(false);
    setPaymentMethod(null);
    setSelectedSlot(null);
  }, [setCartLines]);
  const flushCartPersistence = useCallback(async () => {
    await pendingStorage.current;
    if (storageFailure.current) throw storageFailure.current;
  }, []);
  const value = useMemo(
    () => ({
      fulfillmentMode,
      setFulfillmentMode,
      delivery,
      selectedSlot,
      setSelectedSlot,
      setDeliveryField,
      cartLines,
      setCartLines,
      addToCart,
      addBulkToCart,
      cartError,
      reloadCart,
      paymentMethod,
      setPaymentMethod,
      resetCheckoutDraft,
      flushCartPersistence,
    }),
    [
      fulfillmentMode,
      setFulfillmentMode,
      delivery,
      selectedSlot,
      setDeliveryField,
      cartLines,
      setCartLines,
      addToCart,
      addBulkToCart,
      cartError,
      reloadCart,
      paymentMethod,
      resetCheckoutDraft,
      flushCartPersistence,
    ],
  );

  return <CheckoutDraftContext.Provider value={value}>{children}</CheckoutDraftContext.Provider>;
}

export function useCheckoutDraft() {
  const value = useContext(CheckoutDraftContext);
  if (!value) throw new Error('useCheckoutDraft debe usarse dentro de CheckoutDraftProvider');
  return value;
}
