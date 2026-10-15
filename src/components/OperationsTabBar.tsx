import { AppTabBar, type AppTabBarProps } from './AppTabBar';

// Destinos de operación; no mezclar con las rutas del cliente.
const tabs = {
  panel: { label: 'Inicio', icon: require('../assets/navigation/home.svg') },
  pedidos: { label: 'Pedidos', icon: require('../assets/operations/receipt.svg') },
  inventario: { label: 'Inventario', icon: require('../assets/operations/box.svg') },
  gestion: { label: 'Gestión', icon: require('../assets/operations/sliders.svg') },
} as const;

export function OperationsTabBar(props: AppTabBarProps) {
  return <AppTabBar {...props} tabs={tabs} />;
}
