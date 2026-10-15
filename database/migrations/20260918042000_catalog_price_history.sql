begin;

create or replace function private.record_product_price_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.product_price_history (
      store_id,
      presentation_id,
      old_price_cents,
      new_price_cents,
      reason,
      changed_by
    ) values (
      new.store_id,
      new.id,
      null,
      new.price_cents,
      'initial_price',
      (select auth.uid())
    );
  elsif old.price_cents is distinct from new.price_cents then
    insert into public.product_price_history (
      store_id,
      presentation_id,
      old_price_cents,
      new_price_cents,
      reason,
      changed_by
    ) values (
      new.store_id,
      new.id,
      old.price_cents,
      new.price_cents,
      'price_updated',
      (select auth.uid())
    );
  end if;

  return new;
end;
$$;

revoke all on function private.record_product_price_history()
  from public, anon, authenticated, service_role;

drop trigger if exists product_presentations_price_history_trigger
  on public.product_presentations;

create trigger product_presentations_price_history_trigger
after insert or update of price_cents on public.product_presentations
for each row
execute function private.record_product_price_history();

commit;
