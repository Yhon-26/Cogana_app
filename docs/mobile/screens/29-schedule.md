# 29 · Horario de entrega

Referencia: [Figma `625:39`](https://www.figma.com/design/PMCmmZNLY9A8kqcG7IVsHA/Cogana?node-id=625-39),
página 65, sin fotografía decorativa. La pantalla usa ahora el horario publicado de Cogana Santa Anita.

## Implementación

- Ruta `/schedule`: `src/app/schedule.tsx` → `src/features/customer/checkout/ScheduleScreen.tsx`.
- `src/services/customer/checkoutSchedule.ts` usa un cliente público sin sesión y consulta únicamente las columnas publicadas de tienda, horario semanal, excepciones y estado operativo. La selección de tienda usa el slug `EXPO_PUBLIC_CUSTOMER_STORE_SLUG`, con Cogana Santa Anita como valor inicial.
- La pantalla muestra 07:00–20:00 de lunes a domingo, zona `America/Lima` y el estado real de tienda cerrada. Los cambios próximos se mostrarán si el owner publica excepciones.
- Consulta `get_checkout_slots` y muestra fechas/franjas reales para siete días. Permite guardar una preferencia disponible, previa segunda consulta, y la muestra en Datos de entrega y Revisión. No reserva al elegir; la creación del pedido valida y consume capacidad atómicamente. Con la tienda cerrada no publica franjas y el CTA queda deshabilitado.

## Revisión

Captura actual: `tmp/mobile-qa/cogana-slot-screen.png`; se verificó en Expo Go con lecturas reales y estado cerrado. Disponibilidad abierta y cupos comprobados en SQL con tienda aislada; su interacción visual aún requiere revisión cuando haya un entorno de compra habilitado. Pendiente: escala 1.3, lector de pantalla y aprobación visual del usuario. No abrir la tienda real solo para una captura.
