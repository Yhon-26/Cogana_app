-- Política explícita de denegación: operation_log sólo se usa desde funciones
-- privadas SECURITY DEFINER y no admite acceso directo de roles de API.
create policy operation_log_no_direct_access
on private.operation_log
as restrictive
for all
to anon, authenticated, service_role
using (false)
with check (false);
