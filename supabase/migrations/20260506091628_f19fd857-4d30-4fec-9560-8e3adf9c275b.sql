
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  chosen_role app_role;
  chosen_username text;
begin
  chosen_role := CASE
    WHEN (new.raw_user_meta_data->>'role') = 'agent' THEN 'agent'::app_role
    ELSE 'user'::app_role
  END;

  chosen_username := nullif(trim(coalesce(new.raw_user_meta_data->>'username','')), '');

  insert into public.profiles (user_id, full_name, phone, agency_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'agency_name',
    chosen_username
  )
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, chosen_role)
  on conflict do nothing;

  insert into public.wallets (user_id, available_balance, escrow_balance)
  values (new.id, 0, 0) on conflict do nothing;

  return new;
end;
$function$;
