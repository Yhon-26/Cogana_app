import { useLocalSearchParams } from 'expo-router';
import { OperationsInventoryWorkScreen } from '@/features/operations/inventory/OperationsInventoryWorkScreen';

export default function OperationsPriceRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <OperationsInventoryWorkScreen mode="price" id={id} />;
}
