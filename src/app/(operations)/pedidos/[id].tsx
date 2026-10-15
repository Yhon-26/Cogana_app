import { useLocalSearchParams } from 'expo-router';
import { OrderPreparationScreen } from '@/features/operations/orders/OrderPreparationScreen';

export default function OperationsOrderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrderPreparationScreen id={id} />;
}
