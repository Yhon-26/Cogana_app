import { ManagementScreen } from '@/features/operations/management/ManagementScreen';
import { useLocalSearchParams } from 'expo-router';
export default function ReviewPayment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ManagementScreen mode="payment-review" id={id} />;
}
