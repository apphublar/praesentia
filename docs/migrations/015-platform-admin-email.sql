-- Apenas adm.praesentia@gmail.com pode ser super admin
update public.users
set role = 'user', updated_at = now()
where role = 'platform_admin' and lower(email) <> 'adm.praesentia@gmail.com';

update public.users
set role = 'platform_admin', updated_at = now()
where lower(email) = 'adm.praesentia@gmail.com';

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role user_role := 'user';
begin
  if lower(new.email) = 'adm.praesentia@gmail.com' then
    assigned_role := 'platform_admin';
  end if;

  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Usuario'),
    new.email,
    assigned_role
  )
  on conflict (id) do update set
    email = excluded.email,
    role = case
      when lower(excluded.email) = 'adm.praesentia@gmail.com' then 'platform_admin'::user_role
      when public.users.role = 'platform_admin' then 'user'::user_role
      else public.users.role
    end,
    updated_at = now();

  return new;
end;
$$;
