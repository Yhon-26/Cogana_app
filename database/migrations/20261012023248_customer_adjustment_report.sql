create or replace function private.get_customer_order_details(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); ord public.orders%rowtype; assignment public.delivery_assignments%rowtype; code_value text; result jsonb;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception using errcode='42501',message='Inicia sesión para consultar tu pedido'; end if;
  select * into ord from public.orders where id=p_order_id and requester_user_id=actor for update;
  if not found then raise exception using errcode='42501',message='Pedido no disponible para esta cuenta'; end if;
  if ord.status in ('ready_for_pickup','ready_for_delivery','out_for_delivery') and (ord.payment_status='paid' or (ord.fulfillment_type='pickup' and ord.payment_method='cash')) then
    select * into assignment from public.delivery_assignments where store_id=ord.store_id and order_id=ord.id and status in ('assigned','accepted','picked_up','delivering') order by created_at desc limit 1 for update;
    if ord.fulfillment_type='pickup' or assignment.id is not null then
      select code into code_value from private.customer_fulfillment_codes where order_id=ord.id;
      if code_value is null then
        code_value:=upper(encode(extensions.gen_random_bytes(4),'hex'));
        insert into private.customer_fulfillment_codes(store_id,order_id,assignment_id,code) values(ord.store_id,ord.id,assignment.id,code_value);
        if ord.fulfillment_type='pickup' then
          update public.orders set pickup_confirmation_code_hash=extensions.crypt(code_value,extensions.gen_salt('bf')) where id=ord.id;
        else
          update public.delivery_assignments set confirmation_code_hash=extensions.crypt(code_value,extensions.gen_salt('bf')) where id=assignment.id;
        end if;
      end if;
    end if;
  end if;
  result:=jsonb_build_object('order',jsonb_build_object('id',ord.id,'store_id',ord.store_id,'order_number',ord.order_number,
    'status',ord.status,'payment_status',ord.payment_status,'payment_method',ord.payment_method,'fulfillment_type',ord.fulfillment_type,
    'scheduled_for',ord.scheduled_for,'delivery_address',ord.delivery_address,'estimated_total_cents',ord.estimated_total_cents,'final_total_cents',ord.final_total_cents,
    'created_at',ord.created_at,'completed_at',ord.completed_at,'cancellation_reason_code',ord.cancellation_reason_code),
    'confirmation_code',code_value,'payment_instructions',ord.payment_instructions,
    'items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'name',i.product_name_snapshot,'presentation',i.presentation_name_snapshot,'unit',i.base_unit_snapshot,
      'estimated_quantity',i.estimated_quantity,'prepared_quantity',i.prepared_quantity,'estimated_line_cents',i.estimated_line_cents,'final_line_cents',i.final_line_cents,
      'discount_cents',coalesce(i.final_discount_cents,i.estimated_discount_cents)) order by i.created_at,i.id) from public.order_items i where i.store_id=ord.store_id and i.order_id=ord.id),'[]'::jsonb),
    'history',coalesce((select jsonb_agg(jsonb_build_object('status',h.to_status,'at',h.created_at,'reason',h.reason_code) order by h.created_at,h.id) from public.order_status_history h where h.store_id=ord.store_id and h.order_id=ord.id),'[]'::jsonb),
    'substitutions',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'item_id',s.order_item_id,'name',p.name,'presentation',pp.name,'quantity',s.proposed_quantity,
      'difference_cents',s.price_difference_cents,'status',s.status,'expires_at',s.expires_at) order by s.created_at) from public.order_substitutions s
      join public.products p on p.id=s.replacement_product_id and p.store_id=s.store_id join public.product_presentations pp on pp.id=s.replacement_presentation_id and pp.store_id=s.store_id
      where s.store_id=ord.store_id and s.order_id=ord.id),'[]'::jsonb),
    'differences',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'type',t.transaction_type,'amount_cents',t.amount_cents,'status',t.status))
      from public.payment_transactions t where t.store_id=ord.store_id and t.order_id=ord.id and t.transaction_type in ('refund','adjustment')),'[]'::jsonb));
  return result;
end; $$;

create or replace function private.report_customer_adjustment(p_transaction_id uuid,p_reference text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); tx public.payment_transactions%rowtype;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception using errcode='42501',message='Inicia sesión'; end if;
  if length(coalesce(btrim(p_reference),'')) not between 4 and 100 then raise exception using errcode='22023',message='Escribe la referencia del movimiento'; end if;
  perform 1 from public.orders o where o.id=(select order_id from public.payment_transactions where id=p_transaction_id)
    and o.requester_user_id=actor and o.status='awaiting_adjustment' for update;
  if not found then raise exception using errcode='42501',message='Este cobro no está disponible para tu cuenta'; end if;
  select * into tx from public.payment_transactions where id=p_transaction_id for update;
  if tx.transaction_type<>'adjustment' or tx.provider<>'pending_adjustment' or tx.method not in ('yape','plin') or tx.status not in ('pending','requires_action','processing') then
    raise exception using errcode='P0001',message='El cobro adicional ya no admite referencias'; end if;
  if tx.status='processing' and tx.customer_payment_reference is distinct from btrim(p_reference) then raise exception using errcode='P0001',message='La referencia ya está en revisión'; end if;
  update public.payment_transactions set status='processing',customer_payment_reference=btrim(p_reference),updated_at=statement_timestamp() where id=tx.id;
  perform private.refresh_order_payment_status(tx.store_id,tx.order_id);
  return jsonb_build_object('transaction_id',tx.id,'status','processing');
end; $$;
create or replace function public.report_customer_adjustment(p_transaction_id uuid,p_reference text) returns jsonb language sql security invoker set search_path='' as $$ select private.report_customer_adjustment($1,$2); $$;
revoke all on function public.report_customer_adjustment(uuid,text),private.report_customer_adjustment(uuid,text) from public,anon;
grant execute on function public.report_customer_adjustment(uuid,text),private.report_customer_adjustment(uuid,text) to authenticated;
