create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _ws_id uuid;
  _name text;
begin
  if exists (
    select 1 from public.workspace_members wm
    where wm.user_id = new.id
    limit 1
  ) then
    return new;
  end if;

  _name := coalesce(new.raw_user_meta_data->>'workspace_name', 'Mon Cabinet');

  insert into public.workspaces (owner_user_id, name, plan, sms_quota_month)
  values (new.id, _name, 'starter', 0)
  returning id into _ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (_ws_id, new.id, 'owner');

  insert into public.settings (workspace_id)
  values (_ws_id);

  return new;
end;
$$;

drop trigger if exists handle_new_user_after_signup on auth.users;

create trigger handle_new_user_after_signup
after insert on auth.users
for each row
execute procedure public.handle_new_user();
