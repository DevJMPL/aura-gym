-- Create gym-assets storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('gym-assets', 'gym-assets', true)
on conflict (id) do nothing;

-- Set up storage policies for gym-assets bucket
-- Anyone can view public gym assets
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'gym-assets' );

-- Authenticated users (admin/staff) can upload gym assets
create policy "Admin Upload Access"
  on storage.objects for insert
  with check ( bucket_id = 'gym-assets' and auth.role() = 'authenticated' );

-- Authenticated users can update gym assets
create policy "Admin Update Access"
  on storage.objects for update
  with check ( bucket_id = 'gym-assets' and auth.role() = 'authenticated' );

-- Authenticated users can delete gym assets
create policy "Admin Delete Access"
  on storage.objects for delete
  using ( bucket_id = 'gym-assets' and auth.role() = 'authenticated' );
