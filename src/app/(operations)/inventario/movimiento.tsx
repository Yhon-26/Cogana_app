import { useLocalSearchParams } from 'expo-router';
import { OperationsReceiptScreen } from '@/features/operations/inventory/OperationsReceiptScreen';

export default function InventoryMovementRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <OperationsReceiptScreen id={id} />;
}
