begin;

-- Anonymous Auth users also assume the `authenticated` Postgres role.
-- Staff helpers therefore require both an active membership and a permanent
-- identity. Customer-facing ownership policies remain available to anonymous
-- checkout sessions where explicitly intended.
create or replace function private.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false)
    and exists (
      select 1
      from public.store_memberships sm
      where sm.store_id = p_store_id
        and sm.user_id = (select auth.uid())
        and sm.is_active
    );
$$;

create or replace function private.has_store_role(p_store_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and not coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false)
    and exists (
      select 1
      from public.store_memberships sm
      where sm.store_id = p_store_id
        and sm.user_id = (select auth.uid())
        and sm.is_active
        and sm.role = any(p_roles)
    );
$$;

commit;
