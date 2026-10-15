begin;
-- Explicit business settings, distinct from the store's general contact phone.
alter table public.store_settings
  add column manual_payment_window_minutes integer check (manual_payment_window_minutes between 1 and 120),
  add column yape_recipient_name text,
  add column yape_recipient_phone text,
  add column plin_recipient_name text,
  add column plin_recipient_phone text;
update public.store_settings set manual_payment_window_minutes=15,
  yape_recipient_name='COMERCIAL GAEL Y NATALY S.A.C', yape_recipient_phone='969789624',
  plin_recipient_name='COMERCIAL GAEL Y NATALY S.A.C', plin_recipient_phone='969789624'
where store_id=(select id from public.stores where slug='cogana-santa-anita');
create function private.get_customer_payment_settings(p_store_slug text)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('window_minutes',ss.manual_payment_window_minutes,
    'yape',case when ss.accepts_yape then jsonb_build_object('name',ss.yape_recipient_name,'phone',ss.yape_recipient_phone) end,
    'plin',case when ss.accepts_plin then jsonb_build_object('name',ss.plin_recipient_name,'phone',ss.plin_recipient_phone) end,
    'cash_pickup',ss.accepts_cash_pickup)
  from public.store_settings ss join public.stores s on s.id=ss.store_id
  where s.slug=p_store_slug and s.status='active';
$$;
revoke all on function private.get_customer_payment_settings(text) from public;
grant execute on function private.get_customer_payment_settings(text) to anon,authenticated;
create function public.get_customer_payment_settings(p_store_slug text)
returns jsonb language sql stable security invoker set search_path=''
begin atomic
  select private.get_customer_payment_settings(p_store_slug);
end;
revoke all on function public.get_customer_payment_settings(text) from public;
grant execute on function public.get_customer_payment_settings(text) to anon,authenticated;
commit;
