# Pedidos

Las pantallas 04 y 05, el resultado y la sustitución leen pedidos y artículos de Supabase a través de `src/services/operations/data.ts`, después de verificar la membresía owner/admin activa de la tienda. La cola permite buscar por número y abre el detalle en la misma pestaña de operaciones.

No hay pedidos reales aún en el proyecto, así que se muestra un estado vacío. La cola limita la lectura a los 100 más recientes; la paginación queda pendiente antes de una operación con volumen. Preparar, guardar resultados o proponer sustituciones requiere revalidar pago, artículos, alternativas y reservas en operaciones de servidor transaccionales e idempotentes; esas acciones permanecen inactivas. No usar rutas como autorización.
