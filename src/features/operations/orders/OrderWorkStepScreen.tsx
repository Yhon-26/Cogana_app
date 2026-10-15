import { OrderPreparationScreen } from './OrderPreparationScreen';
export function OrderWorkStepScreen({ id, step }: { id: string; step: 'result' | 'substitution' }) {
  return <OrderPreparationScreen id={id} step={step} />;
}
