import { router } from 'expo-router';
import { PreparationScreen } from '@/components/PreparationScreen';
import { Button } from '@/components/Button';

export default function NotFoundScreen() {
  return (
    <PreparationScreen
      title="No encontramos esta página"
      description="Puedes volver al inicio para continuar."
    >
      <Button label="Ir al inicio" onPress={() => router.replace('/store')} />
    </PreparationScreen>
  );
}
