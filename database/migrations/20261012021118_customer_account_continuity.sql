create or replace function private.get_customer_account(p_store_slug text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); store_uuid uuid; customer public.customers%rowtype;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception using errcode='42501',message='Inicia sesión para consultar tu cuenta'; end if;
  select id into store_uuid from public.stores where slug=p_store_slug and status='active';
  if store_uuid is null then raise exception using errcode='P0001',message='Tienda no disponible'; end if;
  select * into customer from public.customers where store_id=store_uuid and auth_user_id=actor;
  return jsonb_build_object('store_id',store_uuid,'customer',case when customer.id is null then null else jsonb_build_object('id',customer.id,'name',customer.name,'phone',customer.phone) end,
    'addresses',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'label',a.label,'address_line',a.address_line,'district',a.district,'reference',a.reference,'is_default',a.is_default) order by a.is_default desc,a.created_at desc) from public.customer_addresses a where a.store_id=store_uuid and a.customer_id=customer.id),'[]'::jsonb),
    'preferences',(select to_jsonb(p)-'store_id'-'customer_id' from public.customer_preferences p where p.store_id=store_uuid and p.customer_id=customer.id));
end; $$;
create or replace function public.get_customer_account(p_store_slug text) returns jsonb language sql security invoker set search_path='' as $$ select private.get_customer_account($1); $$;
revoke all on function public.get_customer_account(text),private.get_customer_account(text) from public,anon;
grant execute on function public.get_customer_account(text),private.get_customer_account(text) to authenticated;

create or replace function private.get_customer_notifications(p_store_slug text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); store_uuid uuid;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception using errcode='42501',message='Inicia sesión para consultar tus avisos'; end if;
  select id into store_uuid from public.stores where slug=p_store_slug and status='active';
  return coalesce((select jsonb_agg(to_jsonb(events) order by events.at desc) from (
    select h.id,o.id order_id,o.order_number,h.to_status status,h.created_at at
    from public.orders o join public.order_status_history h on h.store_id=o.store_id and h.order_id=o.id
    where o.store_id=store_uuid and o.requester_user_id=actor and not exists (
      select 1 from public.customer_preferences p where p.store_id=o.store_id and p.customer_id=o.customer_id and not p.order_notifications)
    order by h.created_at desc,h.id desc limit 50
  ) events),'[]'::jsonb);
end; $$;
create or replace function public.get_customer_notifications(p_store_slug text) returns jsonb language sql security invoker set search_path='' as $$ select private.get_customer_notifications($1); $$;
revoke all on function public.get_customer_notifications(text),private.get_customer_notifications(text) from public,anon;
grant execute on function public.get_customer_notifications(text),private.get_customer_notifications(text) to authenticated;
