import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listDeliveryZones, type DeliveryZone } from '@/services/customer/deliveryZones';

// Refresh prices on focus. A failed refresh must never reuse an old tariff.
export function useDeliveryZones() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(false);
      setZones([]);
      void listDeliveryZones()
        .then((items) => {
          if (active) setZones(items);
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
      // Revision intentionally restarts this focused request when the user retries.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revision]),
  );
  return { zones, loading, error, retry: () => setRevision((value) => value + 1) };
}
