# Eliminación definitiva de cuentas de clientes

Pendiente de autorización explícita. Actualmente la app solo registrará una solicitud; no eliminará al usuario ni afirmará que sus datos fueron eliminados.

La implementación propuesta tendría este recorrido concreto:

1. El cliente inicia sesión y confirma desde Privacidad que quiere eliminar su propia cuenta.
2. Una función de servidor valida el token con Supabase Auth. No acepta un identificador de otra cuenta enviado por el cliente.
3. Rechaza cuentas vinculadas al equipo de cualquier tienda o a la auditoría administrativa, y cuentas con pedidos abiertos o diferencias de pago pendientes.
4. Bloquea nuevas compras durante la operación. Retira direcciones, preferencias y datos personales del cliente y de sus pedidos cerrados, conservando importes y cantidades del registro de ventas.
5. El servidor elimina el usuario de Auth. La app limpia sesión y carrito solo tras una respuesta confirmada. Los fallos deben permitir recuperar la operación.

Se comprobaría primero con cuentas aisladas de prueba. Implementar este servicio no autoriza a borrar ninguna cuenta real desde esta sesión. El borrado efectivo ocurriría únicamente al solicitarlo el titular dentro de la app.

La revisión automática rechazó agregar el servicio porque la anonimización y la eliminación de usuarios son irreversibles y no estaban autorizadas explícitamente.
