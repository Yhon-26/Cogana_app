// Copia de las pantallas 22 · Mis direcciones y 23 · Nueva dirección.
// No existen direcciones reales: la lista nace vacía y el guardado queda
// deshabilitado hasta que exista una cuenta de cliente (customers en Supabase).
export const addressesContent = {
  listTitle: 'Mis direcciones',
  listSubtitle: 'Elige dónde recibir tus compras.',
  emptyTitle: 'Sin direcciones guardadas',
  emptyBody: 'Tus direcciones aparecerán aquí cuando crees tu cuenta.',
  emptyChip: 'ACCESO PENDIENTE',
  newCta: 'Nueva dirección',
  formTopBar: 'Direcciones',
  formTitle: 'Nueva dirección',
  formSubtitle: 'Para recibir tus compras en casa.',
  labelTag: 'ETIQUETA',
  placeholderTag: 'Casa, trabajo…',
  labelAddress: 'DIRECCIÓN',
  placeholderAddress: 'Calle, número y complemento',
  labelDistrict: 'DISTRITO',
  placeholderDistrict: 'Selecciona un distrito',
  labelReference: 'REFERENCIA (OPCIONAL)',
  placeholderReference: 'Ayuda a encontrar el lugar',
  primaryCheckbox: 'Usar como principal',
  saveCta: 'Guardar dirección',
  saveNote: 'Se guardará cuando tengas una cuenta.',
} as const;
