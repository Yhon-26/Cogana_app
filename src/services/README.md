# Límite de datos

`supabase/client.ts`: cliente tipado único con clave pública, almacenamiento nativo seguro y bloqueo de renovación.
`auth/session.ts`: ciclo de vida; no registra usuarios ni inicia sesiones automáticamente.
`config.ts`: configuración pública. Sin variables, la estructura visual puede arrancar sin backend.

Cuando se implemente un dominio, añadir su servicio aquí y consumirlo desde hooks en features.
Los tipos generados describen el esquema, no conceden permisos. Antes de conectar datos, verificar RLS,
contratos de lectura y rol owner/admin por tienda. Drivers no equivalen a administradores.
Nunca colocar claves secretas/service_role en variables EXPO_PUBLIC ni en el cliente móvil.
La vista web de desarrollo conserva sesiones solo en memoria. La estrategia web de producción está pendiente.
