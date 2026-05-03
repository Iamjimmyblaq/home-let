-- KYC docs storage bucket (private)
insert into storage.buckets (id, name, public) values ('kyc-docs', 'kyc-docs', false)
on conflict (id) do nothing;

-- Agents upload to their own folder: {user_id}/filename
create policy "agents upload own kyc"
on storage.objects for insert
with check (bucket_id = 'kyc-docs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "agents view own kyc"
on storage.objects for select
using (bucket_id = 'kyc-docs' and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(),'admin')));

create policy "agents update own kyc"
on storage.objects for update
using (bucket_id = 'kyc-docs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "admins delete kyc"
on storage.objects for delete
using (bucket_id = 'kyc-docs' and public.has_role(auth.uid(),'admin'));