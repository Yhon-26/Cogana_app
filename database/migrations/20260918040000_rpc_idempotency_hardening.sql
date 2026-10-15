-- Serializa reintentos con el mismo operation_id y nombra argumentos RPC.

create or replace function public.create_checkout_order(
  p_payload jsonb,p_operation_id uuid,p_reservation_expires_at timestamptz
)
returns jsonb language plpgsql security invoker set search_path=''
as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  return private.create_checkout_order(p_payload,p_operation_id,p_reservation_expires_at);
end; $$;

create or replace function public.open_inventory_package(
  p_store_id uuid,p_lot_id uuid,p_presentation_id uuid,p_units bigint,
  p_operation_id uuid,p_reason text default null
)
returns jsonb language plpgsql security invoker set search_path=''
as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  return private.open_inventory_package(p_store_id,p_lot_id,p_presentation_id,p_units,p_operation_id,p_reason);
end; $$;

create or replace function public.transition_order(
  p_store_id uuid,p_order_id uuid,p_to_status text,p_operation_id uuid,
  p_reason_code text default null,p_note text default null
)
returns jsonb language plpgsql security invoker set search_path=''
as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  return private.transition_order(p_store_id,p_order_id,p_to_status,p_operation_id,p_reason_code,p_note);
end; $$;

create or replace function public.confirm_manual_payment(
  p_store_id uuid,p_order_id uuid,p_transaction_id uuid,p_operation_id uuid,
  p_provider_reference text,p_proof_storage_path text default null
)
returns jsonb language plpgsql security invoker set search_path=''
as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  return private.confirm_manual_payment(p_store_id,p_order_id,p_transaction_id,p_operation_id,p_provider_reference,p_proof_storage_path);
end; $$;

create or replace function public.finalize_weighted_order(
  p_store_id uuid,p_order_id uuid,p_items jsonb,p_operation_id uuid
)
returns jsonb language plpgsql security invoker set search_path=''
as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  return private.finalize_weighted_order(p_store_id,p_order_id,p_items,p_operation_id);
end; $$;

drop function public.propose_substitution(uuid,uuid,uuid,uuid,bigint,timestamptz,uuid);
drop function public.decide_substitution(uuid,uuid,text,uuid);
drop function public.assign_delivery(uuid,uuid,uuid,uuid);
drop function public.complete_pickup(uuid,uuid,text,uuid);
drop function public.complete_delivery(uuid,uuid,text,text,text,uuid);

create function public.propose_substitution(
  p_store_id uuid,p_order_id uuid,p_order_item_id uuid,
  p_replacement_presentation_id uuid,p_proposed_quantity bigint,
  p_expires_at timestamptz,p_operation_id uuid
)
returns jsonb language plpgsql security invoker set search_path=''
as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  return private.propose_substitution(p_store_id,p_order_id,p_order_item_id,
    p_replacement_presentation_id,p_proposed_quantity,p_expires_at,p_operation_id);
end; $$;

create function public.decide_substitution(
  p_store_id uuid,p_substitution_id uuid,p_decision text,p_operation_id uuid
)
returns jsonb language plpgsql security invoker set search_path=''
as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  return private.decide_substitution(p_store_id,p_substitution_id,p_decision,p_operation_id);
end; $$;

create function public.assign_delivery(
  p_store_id uuid,p_order_id uuid,p_driver_user_id uuid,p_operation_id uuid
)
returns jsonb language plpgsql security invoker set search_path=''
as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  return private.assign_delivery(p_store_id,p_order_id,p_driver_user_id,p_operation_id);
end; $$;

create function public.complete_pickup(
  p_store_id uuid,p_order_id uuid,p_confirmation_code text,p_operation_id uuid
)
returns jsonb language plpgsql security invoker set search_path=''
as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  return private.complete_pickup(p_store_id,p_order_id,p_confirmation_code,p_operation_id);
end; $$;

create function public.complete_delivery(
  p_store_id uuid,p_assignment_id uuid,p_confirmation_code text,
  p_evidence_storage_path text,p_recipient_name text,p_operation_id uuid
)
returns jsonb language plpgsql security invoker set search_path=''
as $$ begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_operation_id::text,0));
  return private.complete_delivery(p_store_id,p_assignment_id,p_confirmation_code,
    p_evidence_storage_path,p_recipient_name,p_operation_id);
end; $$;

revoke all on function public.propose_substitution(uuid,uuid,uuid,uuid,bigint,timestamptz,uuid) from public,anon;
revoke all on function public.decide_substitution(uuid,uuid,text,uuid) from public,anon;
revoke all on function public.assign_delivery(uuid,uuid,uuid,uuid) from public,anon;
revoke all on function public.complete_pickup(uuid,uuid,text,uuid) from public,anon;
revoke all on function public.complete_delivery(uuid,uuid,text,text,text,uuid) from public,anon;
grant execute on function public.propose_substitution(uuid,uuid,uuid,uuid,bigint,timestamptz,uuid) to authenticated;
grant execute on function public.decide_substitution(uuid,uuid,text,uuid) to authenticated;
grant execute on function public.assign_delivery(uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.complete_pickup(uuid,uuid,text,uuid) to authenticated;
grant execute on function public.complete_delivery(uuid,uuid,text,text,text,uuid) to authenticated;

create or replace function private.record_payment_event(
  p_provider text,p_provider_event_id text,p_event_type text,p_payload jsonb,
  p_signature_valid boolean,p_transaction_id uuid default null,
  p_new_status text default null,p_provider_reference text default null
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_event_id uuid;
  v_tx public.payment_transactions%rowtype;
  v_order_status text;
begin
  if btrim(coalesce(p_provider,''))='' or btrim(coalesce(p_provider_event_id,''))='' then
    raise exception using errcode='22023',message='Proveedor y event_id son obligatorios';
  end if;
  insert into public.payment_events(provider,provider_event_id,event_type,payload,signature_valid)
  values(p_provider,p_provider_event_id,p_event_type,coalesce(p_payload,'{}'::jsonb),p_signature_valid)
  on conflict(provider,provider_event_id) do nothing returning id into v_event_id;
  if not found then
    select id into v_event_id from public.payment_events
    where provider=p_provider and provider_event_id=p_provider_event_id;
    return jsonb_build_object('event_id',v_event_id,'processed',false,'idempotent_replay',true);
  end if;
  if not p_signature_valid then
    update public.payment_events set processed_at=statement_timestamp(),processing_error='invalid_signature'
    where id=v_event_id;
    return jsonb_build_object('event_id',v_event_id,'processed',false,'reason','invalid_signature','idempotent_replay',false);
  end if;
  if p_transaction_id is null or p_new_status is null then
    update public.payment_events set processed_at=statement_timestamp() where id=v_event_id;
    return jsonb_build_object('event_id',v_event_id,'processed',true,'idempotent_replay',false);
  end if;
  if p_new_status not in ('pending','requires_action','processing','succeeded','failed','cancelled','expired') then
    raise exception using errcode='22023',message='Estado de transacción inválido';
  end if;
  select * into v_tx from public.payment_transactions where id=p_transaction_id for update;
  if not found or v_tx.provider<>p_provider then
    raise exception using errcode='P0001',message='Transacción de proveedor no encontrada';
  end if;
  update public.payment_transactions set status=p_new_status,
    provider_reference=coalesce(nullif(p_provider_reference,''),provider_reference),
    processed_at=case when p_new_status in ('succeeded','failed','cancelled','expired')
      then statement_timestamp() else processed_at end,updated_at=statement_timestamp()
  where id=p_transaction_id;
  v_order_status:=private.refresh_order_payment_status(v_tx.store_id,v_tx.order_id);
  update public.payment_events set processed_at=statement_timestamp() where id=v_event_id;
  return jsonb_build_object('event_id',v_event_id,'processed',true,
    'transaction_status',p_new_status,'order_payment_status',v_order_status,'idempotent_replay',false);
exception when others then
  insert into public.payment_events(
    id,provider,provider_event_id,event_type,payload,signature_valid,processed_at,processing_error
  ) values (
    coalesce(v_event_id,gen_random_uuid()),p_provider,p_provider_event_id,p_event_type,
    coalesce(p_payload,'{}'::jsonb),p_signature_valid,statement_timestamp(),sqlstate||':'||sqlerrm
  ) on conflict(provider,provider_event_id) do update
    set processed_at=excluded.processed_at,processing_error=excluded.processing_error;
  return jsonb_build_object('event_id',coalesce(v_event_id,
    (select id from public.payment_events where provider=p_provider and provider_event_id=p_provider_event_id)),
    'processed',false,'error_code',sqlstate,'idempotent_replay',false);
end; $$;

revoke all on function private.record_payment_event(text,text,text,jsonb,boolean,uuid,text,text)
  from public,anon,authenticated;
grant execute on function private.record_payment_event(text,text,text,jsonb,boolean,uuid,text,text)
  to service_role;
