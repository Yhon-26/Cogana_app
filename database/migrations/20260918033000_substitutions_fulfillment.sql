-- Sustituciones y finalización segura de recojo/delivery.

create or replace function private.apply_substitution_internal(
  p_substitution_id uuid,
  p_accept_status text,
  p_actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_sub public.order_substitutions%rowtype;
  v_item public.order_items%rowtype;
  v_order public.orders%rowtype;
  v_presentation public.product_presentations%rowtype;
  v_product public.products%rowtype;
  v_res public.inventory_reservations%rowtype;
  v_expiry timestamptz;
  v_subtotal bigint;
begin
  select * into v_sub from public.order_substitutions where id=p_substitution_id for update;
  if not found then raise exception using errcode='P0001',message='Sustitución no encontrada'; end if;
  select * into v_order from public.orders
  where store_id=v_sub.store_id and id=v_sub.order_id for update;
  select * into v_item from public.order_items
  where store_id=v_sub.store_id and id=v_sub.order_item_id and order_id=v_sub.order_id for update;
  select * into v_presentation from public.product_presentations
  where store_id=v_sub.store_id and id=v_sub.replacement_presentation_id
    and product_id=v_sub.replacement_product_id and is_active for share;
  select * into v_product from public.products
  where store_id=v_sub.store_id and id=v_sub.replacement_product_id and is_active for share;
  if v_presentation.id is null or v_product.id is null then
    raise exception using errcode='P0001',message='El reemplazo ya no está disponible';
  end if;

  select * into v_res from public.inventory_reservations
  where store_id=v_sub.store_id and order_item_id=v_item.id for update;
  if not found or v_res.status not in ('reserved','partially_consumed') then
    raise exception using errcode='P0001',message='La reserva original no está activa';
  end if;
  v_expiry:=v_res.expires_at;
  delete from public.inventory_reservations where id=v_res.id;

  update public.order_items set
    product_id=v_product.id,presentation_id=v_presentation.id,
    product_name_snapshot=v_product.name,presentation_name_snapshot=v_presentation.name,
    base_unit_snapshot=v_product.base_unit,estimated_quantity=v_sub.proposed_quantity,
    price_cents_snapshot=v_presentation.price_cents,
    pricing_quantity_snapshot=v_presentation.base_quantity,
    estimated_line_cents=v_sub.proposed_line_cents,estimated_discount_cents=0,
    updated_at=statement_timestamp()
  where id=v_item.id;

  perform private.reserve_inventory_fefo(
    v_sub.store_id,v_sub.order_id,v_item.id,v_product.id,v_presentation.id,
    v_sub.proposed_quantity,v_expiry
  );
  update public.order_substitutions
  set status=p_accept_status,decided_at=statement_timestamp(),updated_at=statement_timestamp()
  where id=v_sub.id;

  select sum(estimated_line_cents-estimated_discount_cents) into v_subtotal
  from public.order_items where store_id=v_sub.store_id and order_id=v_sub.order_id;
  update public.orders set estimated_subtotal_cents=v_subtotal,
    estimated_total_cents=v_subtotal+delivery_fee_cents-delivery_discount_cents,
    status=case when p_accept_status='accepted' and v_sub.price_difference_cents>0
      then 'awaiting_adjustment' else status end,
    updated_at=statement_timestamp()
  where store_id=v_sub.store_id and id=v_sub.order_id;
end;
$$;

create or replace function private.propose_substitution(
  p_store_id uuid,p_order_id uuid,p_order_item_id uuid,
  p_replacement_presentation_id uuid,p_proposed_quantity bigint,
  p_expires_at timestamptz,p_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=(select auth.uid());
  v_item public.order_items%rowtype;
  v_order public.orders%rowtype;
  v_presentation public.product_presentations%rowtype;
  v_product public.products%rowtype;
  v_line bigint;
  v_current_line bigint;
  v_difference bigint;
  v_sub_id uuid:=gen_random_uuid();
  v_status text:='pending';
  v_result jsonb;
begin
  if v_actor is null or not private.has_store_role(p_store_id,array['owner','admin']) then
    raise exception using errcode='42501',message='No autorizado para proponer sustituciones';
  end if;
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='propose_substitution';
  if found then return v_result||jsonb_build_object('idempotent_replay',true); end if;
  if p_proposed_quantity<=0 then raise exception using errcode='22023',message='Cantidad propuesta inválida'; end if;

  select * into v_order from public.orders
  where store_id=p_store_id and id=p_order_id for update;
  if not found or v_order.status not in ('confirmed','preparing','awaiting_adjustment') then
    raise exception using errcode='P0001',message='El pedido no admite sustituciones';
  end if;
  select * into v_item from public.order_items
  where store_id=p_store_id and order_id=p_order_id and id=p_order_item_id for update;
  if not found then raise exception using errcode='P0001',message='Ítem no encontrado'; end if;
  select * into v_presentation from public.product_presentations
  where store_id=p_store_id and id=p_replacement_presentation_id and is_active for share;
  select * into v_product from public.products
  where store_id=p_store_id and id=v_presentation.product_id and is_active for share;
  if v_presentation.id is null or v_product.id is null then
    raise exception using errcode='P0001',message='Reemplazo no disponible';
  end if;
  if v_presentation.price_mode='fixed' then
    if p_proposed_quantity%v_presentation.base_quantity<>0 then
      raise exception using errcode='22023',message='Cantidad propuesta incompatible con presentación fija';
    end if;
    v_line:=(p_proposed_quantity/v_presentation.base_quantity)*v_presentation.price_cents;
  else
    v_line:=(p_proposed_quantity*v_presentation.price_cents+v_presentation.base_quantity/2)
      /v_presentation.base_quantity;
  end if;
  v_current_line:=coalesce(v_item.final_line_cents,v_item.estimated_line_cents)
    -coalesce(v_item.final_discount_cents,v_item.estimated_discount_cents);
  v_difference:=v_line-v_current_line;
  if v_item.substitution_policy='remove' then
    raise exception using errcode='P0001',message='El cliente pidió retirar el producto si falta';
  end if;
  if v_item.substitution_policy='allow_similar' and v_difference<=v_item.max_substitution_extra_cents then
    v_status:='auto_accepted';
  end if;

  insert into public.order_substitutions(
    id,store_id,order_id,order_item_id,replacement_product_id,replacement_presentation_id,
    proposed_quantity,proposed_line_cents,price_difference_cents,status,expires_at,proposed_by,
    decided_at
  ) values (
    v_sub_id,p_store_id,p_order_id,p_order_item_id,v_product.id,v_presentation.id,
    p_proposed_quantity,v_line,v_difference,v_status,p_expires_at,v_actor,
    case when v_status='auto_accepted' then statement_timestamp() else null end
  );
  if v_status='auto_accepted' then
    perform private.apply_substitution_internal(v_sub_id,'auto_accepted',v_actor);
  end if;
  v_result:=jsonb_build_object('substitution_id',v_sub_id,'status',v_status,
    'price_difference_cents',v_difference,'idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'propose_substitution',v_actor,v_result);
  return v_result;
end;
$$;

create or replace function private.decide_substitution(
  p_store_id uuid,p_substitution_id uuid,p_decision text,p_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=(select auth.uid());
  v_sub public.order_substitutions%rowtype;
  v_order public.orders%rowtype;
  v_result jsonb;
  v_is_staff boolean;
begin
  if v_actor is null or p_decision not in ('accepted','rejected') then
    raise exception using errcode='22023',message='Decisión inválida';
  end if;
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='decide_substitution';
  if found then return v_result||jsonb_build_object('idempotent_replay',true); end if;
  select * into v_sub from public.order_substitutions
  where store_id=p_store_id and id=p_substitution_id for update;
  if not found or v_sub.status<>'pending' then
    raise exception using errcode='P0001',message='Propuesta no pendiente';
  end if;
  if v_sub.expires_at is not null and v_sub.expires_at<=statement_timestamp() then
    update public.order_substitutions set status='expired',decided_at=statement_timestamp(),updated_at=statement_timestamp()
    where id=v_sub.id;
    raise exception using errcode='P0001',message='La propuesta venció';
  end if;
  select * into v_order from public.orders where store_id=p_store_id and id=v_sub.order_id for update;
  v_is_staff:=private.has_store_role(p_store_id,array['owner','admin']);
  if v_order.requester_user_id<>v_actor and not v_is_staff then
    raise exception using errcode='42501',message='No autorizado para decidir esta sustitución';
  end if;
  if p_decision='accepted' then
    perform private.apply_substitution_internal(v_sub.id,'accepted',v_actor);
  else
    update public.order_substitutions set status='rejected',decided_at=statement_timestamp(),updated_at=statement_timestamp()
    where id=v_sub.id;
  end if;
  v_result:=jsonb_build_object('substitution_id',v_sub.id,'status',p_decision,'idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'decide_substitution',v_actor,v_result);
  return v_result;
end;
$$;

create or replace function private.assign_delivery(
  p_store_id uuid,p_order_id uuid,p_driver_user_id uuid,p_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=(select auth.uid());
  v_assignment_id uuid:=gen_random_uuid();
  v_code text:=upper(encode(extensions.gen_random_bytes(4),'hex'));
  v_result jsonb;
begin
  if v_actor is null or not private.has_store_role(p_store_id,array['owner','admin']) then
    raise exception using errcode='42501',message='No autorizado para asignar entregas';
  end if;
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='assign_delivery';
  if found then return v_result||jsonb_build_object('confirmation_code',null,'idempotent_replay',true); end if;
  if not exists(select 1 from public.orders where store_id=p_store_id and id=p_order_id
    and fulfillment_type='delivery' and status='ready_for_delivery' for update) then
    raise exception using errcode='P0001',message='Pedido no listo para delivery';
  end if;
  if p_driver_user_id is not null and not exists(
    select 1 from public.store_memberships where store_id=p_store_id and user_id=p_driver_user_id
      and role in ('owner','admin','driver') and is_active
  ) then raise exception using errcode='P0001',message='Repartidor no autorizado'; end if;
  insert into public.delivery_assignments(
    id,store_id,order_id,driver_user_id,status,confirmation_code_hash
  ) values (
    v_assignment_id,p_store_id,p_order_id,p_driver_user_id,'assigned',
    extensions.crypt(v_code,extensions.gen_salt('bf'))
  );
  insert into public.delivery_events(store_id,assignment_id,event_type,actor_user_id)
  values(p_store_id,v_assignment_id,'assigned',v_actor);
  v_result:=jsonb_build_object('assignment_id',v_assignment_id,'order_id',p_order_id,'idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'assign_delivery',v_actor,v_result);
  return v_result||jsonb_build_object('confirmation_code',v_code);
end;
$$;

create or replace function private.complete_pickup(
  p_store_id uuid,p_order_id uuid,p_confirmation_code text,p_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=(select auth.uid());
  v_order public.orders%rowtype;
  v_tx public.payment_transactions%rowtype;
  v_result jsonb;
begin
  if v_actor is null or not private.has_store_role(p_store_id,array['owner','admin']) then
    raise exception using errcode='42501',message='No autorizado para completar recojo';
  end if;
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='complete_pickup';
  if found then return v_result||jsonb_build_object('idempotent_replay',true); end if;
  select * into v_order from public.orders where store_id=p_store_id and id=p_order_id for update;
  if not found or v_order.fulfillment_type<>'pickup' or v_order.status<>'ready_for_pickup' then
    raise exception using errcode='P0001',message='Pedido no listo para recojo';
  end if;
  if v_order.pickup_confirmation_code_hash is null or p_confirmation_code is null
     or extensions.crypt(p_confirmation_code,v_order.pickup_confirmation_code_hash)<>v_order.pickup_confirmation_code_hash then
    raise exception using errcode='42501',message='Código de recojo inválido';
  end if;
  if v_order.payment_method='cash' then
    select * into v_tx from public.payment_transactions
    where store_id=p_store_id and order_id=p_order_id and transaction_type='charge'
    order by created_at limit 1 for update;
    update public.payment_transactions set amount_cents=coalesce(v_order.final_total_cents,v_order.estimated_total_cents),
      status='succeeded',processed_at=statement_timestamp(),updated_at=statement_timestamp()
    where id=v_tx.id;
    perform private.refresh_order_payment_status(p_store_id,p_order_id);
  elsif v_order.payment_status<>'paid' then
    raise exception using errcode='P0001',message='El pedido todavía no está pagado';
  end if;
  update public.orders set status='completed',completed_at=statement_timestamp(),updated_at=statement_timestamp()
  where store_id=p_store_id and id=p_order_id;
  insert into public.order_status_history(store_id,order_id,from_status,to_status,reason_code,actor_user_id,operation_id)
  values(p_store_id,p_order_id,'ready_for_pickup','completed','pickup_code_verified',v_actor,p_operation_id);
  v_result:=jsonb_build_object('order_id',p_order_id,'status','completed','idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'complete_pickup',v_actor,v_result);
  return v_result;
end;
$$;

create or replace function private.complete_delivery(
  p_store_id uuid,p_assignment_id uuid,p_confirmation_code text,
  p_evidence_storage_path text,p_recipient_name text,p_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_actor uuid:=(select auth.uid());
  v_assignment public.delivery_assignments%rowtype;
  v_order public.orders%rowtype;
  v_result jsonb;
begin
  if v_actor is null then raise exception using errcode='42501',message='Se requiere autenticación'; end if;
  select result into v_result from private.operation_log
  where operation_id=p_operation_id and store_id=p_store_id and operation_kind='complete_delivery';
  if found then return v_result||jsonb_build_object('idempotent_replay',true); end if;
  select * into v_assignment from public.delivery_assignments
  where store_id=p_store_id and id=p_assignment_id for update;
  if not found or v_assignment.status in ('delivered','failed','cancelled') then
    raise exception using errcode='P0001',message='Asignación no disponible';
  end if;
  if v_assignment.driver_user_id<>v_actor
     and not private.has_store_role(p_store_id,array['owner','admin']) then
    raise exception using errcode='42501',message='No autorizado para completar esta entrega';
  end if;
  select * into v_order from public.orders
  where store_id=p_store_id and id=v_assignment.order_id for update;
  if v_order.status not in ('ready_for_delivery','out_for_delivery') or v_order.payment_status<>'paid' then
    raise exception using errcode='P0001',message='Pedido no pagado o no listo para entrega';
  end if;
  if nullif(p_confirmation_code,'') is null and nullif(p_evidence_storage_path,'') is null then
    raise exception using errcode='22023',message='Se requiere código o evidencia de entrega';
  end if;
  if nullif(p_confirmation_code,'') is not null and (
    v_assignment.confirmation_code_hash is null
    or extensions.crypt(p_confirmation_code,v_assignment.confirmation_code_hash)<>v_assignment.confirmation_code_hash
  ) then raise exception using errcode='42501',message='Código de entrega inválido'; end if;
  update public.delivery_assignments set status='delivered',recipient_name=nullif(p_recipient_name,''),
    evidence_storage_path=nullif(p_evidence_storage_path,''),delivered_at=statement_timestamp(),
    updated_at=statement_timestamp() where id=p_assignment_id;
  insert into public.delivery_events(store_id,assignment_id,event_type,note,actor_user_id)
  values(p_store_id,p_assignment_id,'delivered',
    case when nullif(p_evidence_storage_path,'') is not null then 'evidence_recorded' else 'code_verified' end,v_actor);
  update public.orders set status='completed',completed_at=statement_timestamp(),updated_at=statement_timestamp()
  where store_id=p_store_id and id=v_order.id;
  insert into public.order_status_history(store_id,order_id,from_status,to_status,reason_code,actor_user_id,operation_id)
  values(p_store_id,v_order.id,v_order.status,'completed','delivery_completed',v_actor,p_operation_id);
  v_result:=jsonb_build_object('order_id',v_order.id,'assignment_id',p_assignment_id,'status','completed','idempotent_replay',false);
  insert into private.operation_log(operation_id,store_id,operation_kind,actor_user_id,result)
  values(p_operation_id,p_store_id,'complete_delivery',v_actor,v_result);
  return v_result;
end;
$$;

create or replace function public.propose_substitution(uuid,uuid,uuid,uuid,bigint,timestamptz,uuid)
returns jsonb language sql security invoker set search_path=''
as $$ select private.propose_substitution($1,$2,$3,$4,$5,$6,$7); $$;
create or replace function public.decide_substitution(uuid,uuid,text,uuid)
returns jsonb language sql security invoker set search_path=''
as $$ select private.decide_substitution($1,$2,$3,$4); $$;
create or replace function public.assign_delivery(uuid,uuid,uuid,uuid)
returns jsonb language sql security invoker set search_path=''
as $$ select private.assign_delivery($1,$2,$3,$4); $$;
create or replace function public.complete_pickup(uuid,uuid,text,uuid)
returns jsonb language sql security invoker set search_path=''
as $$ select private.complete_pickup($1,$2,$3,$4); $$;
create or replace function public.complete_delivery(uuid,uuid,text,text,text,uuid)
returns jsonb language sql security invoker set search_path=''
as $$ select private.complete_delivery($1,$2,$3,$4,$5,$6); $$;

revoke all on function private.apply_substitution_internal(uuid,text,uuid) from public,anon,authenticated,service_role;
revoke all on function private.propose_substitution(uuid,uuid,uuid,uuid,bigint,timestamptz,uuid) from public,anon;
revoke all on function private.decide_substitution(uuid,uuid,text,uuid) from public,anon;
revoke all on function private.assign_delivery(uuid,uuid,uuid,uuid) from public,anon;
revoke all on function private.complete_pickup(uuid,uuid,text,uuid) from public,anon;
revoke all on function private.complete_delivery(uuid,uuid,text,text,text,uuid) from public,anon;
revoke all on function public.propose_substitution(uuid,uuid,uuid,uuid,bigint,timestamptz,uuid) from public,anon;
revoke all on function public.decide_substitution(uuid,uuid,text,uuid) from public,anon;
revoke all on function public.assign_delivery(uuid,uuid,uuid,uuid) from public,anon;
revoke all on function public.complete_pickup(uuid,uuid,text,uuid) from public,anon;
revoke all on function public.complete_delivery(uuid,uuid,text,text,text,uuid) from public,anon;

grant execute on function private.propose_substitution(uuid,uuid,uuid,uuid,bigint,timestamptz,uuid) to authenticated,service_role;
grant execute on function private.decide_substitution(uuid,uuid,text,uuid) to authenticated,service_role;
grant execute on function private.assign_delivery(uuid,uuid,uuid,uuid) to authenticated,service_role;
grant execute on function private.complete_pickup(uuid,uuid,text,uuid) to authenticated,service_role;
grant execute on function private.complete_delivery(uuid,uuid,text,text,text,uuid) to authenticated,service_role;
grant execute on function public.propose_substitution(uuid,uuid,uuid,uuid,bigint,timestamptz,uuid) to authenticated;
grant execute on function public.decide_substitution(uuid,uuid,text,uuid) to authenticated;
grant execute on function public.assign_delivery(uuid,uuid,uuid,uuid) to authenticated;
grant execute on function public.complete_pickup(uuid,uuid,text,uuid) to authenticated;
grant execute on function public.complete_delivery(uuid,uuid,text,text,text,uuid) to authenticated;
