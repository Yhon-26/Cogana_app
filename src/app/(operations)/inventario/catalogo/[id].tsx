import { useLocalSearchParams } from 'expo-router';
import { OperationsInventoryWorkScreen } from '@/features/operations/inventory/OperationsInventoryWorkScreen';

export default function OperationsProductRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OperationsInventoryWorkScreen mode="product" id={id} />;
}
