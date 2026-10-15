// Copia de la pantalla 01 · Entra a tu tienda (acceso de equipo).
// El correo vive en el estado local; el envío del enlace de acceso requiere
// el contrato de identidad por correo (enlace mágico del owner en Supabase).
export const operationsEntryContent = {
  brand: 'Cogana',
  eyebrow: 'OPERACIÓN DE TIENDA',
  title: 'Entra a tu tienda',
  subtitle: 'Gestiona pedidos, productos y entregas desde un solo lugar.',
  emailLabel: 'CORREO DE TRABAJO',
  emailPlaceholder: 'equipo@santaanita.pe',
  continueCta: 'Continuar',
  caption: 'Usa el correo asociado a tu tienda.',
} as const;

// Copia de la pantalla 02 · Elige tu tienda.
export const storeSelectContent = {
  topBar: 'Elegir tienda',
  title: 'Elige tu tienda',
  subtitle: 'Selecciona el local que va a gestionar.',
  storeName: 'Cogana · Santa Anita',
  storeAddress: 'Av. Los Eucaliptos 315 · Santa Anita',
  roleChip: 'Administrador',
  scopeNote: 'Tus acciones se aplicarán únicamente a esta tienda.',
  panelCta: 'Entrar al panel',
} as const;
