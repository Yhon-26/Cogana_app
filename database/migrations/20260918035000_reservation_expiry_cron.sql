-- Liberación automática. La vigencia concreta la decide checkout; este trabajo
-- sólo reclama en lotes pequeños las reservas cuyo expires_at ya venció.
create extension if not exists pg_cron;

select cron.schedule(
  'cogana-release-expired-reservations',
  '* * * * *',
  $cron$select private.release_expired_reservations(200);$cron$
);
