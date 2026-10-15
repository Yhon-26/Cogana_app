# Pruebas de base de datos

## Suite transaccional

`database/transactional_operations_test.sql` contiene 27 aserciones pgTAP para:

- RLS y privilegios de RPC;
- separación entre `anon`, `authenticated` y `service_role`;
- checkout por importe e idempotencia;
- asignación FEFO;
- apertura idempotente de paquete sellado;
- preparación por peso y consumo de lotes;
- recojo con código y confirmación de efectivo.

La suite crea sus fixtures dentro de `BEGIN` y termina con `ROLLBACK`. También
crea pgTAP dentro de esa misma transacción, por lo que no deja la extensión ni
datos de prueba instalados en el proyecto remoto.

Con Supabase CLI instalado y el proyecto enlazado:

```text
supabase test db --linked supabase/tests/database/transactional_operations_test.sql
```

Antes de usar ese comando, consultar `supabase test db --help` porque la CLI de
Supabase cambia con frecuencia.

## Concurrencia

La sobreventa se comprueba en dos sesiones independientes, porque una sola
transacción pgTAP no puede reproducir dos bloqueos simultáneos. La verificación
ejecutada usó un lote de 1,000 g y dos checkouts concurrentes de 750 g: uno creó
la reserva y el otro recibió `Stock a granel insuficiente`. Después se eliminaron
todas las filas de prueba y se confirmó que los contadores regresaron a cero.
