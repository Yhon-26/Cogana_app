import { useLocalSearchParams } from 'expo-router';
import { OrderWorkStepScreen } from '@/features/operations/orders/OrderWorkStepScreen';

export default function ResultRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrderWorkStepScreen id={id} step="result" />;
}
