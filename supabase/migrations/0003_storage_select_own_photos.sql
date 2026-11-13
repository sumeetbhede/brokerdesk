-- Storage can only delete files the caller is allowed to select.
create policy listing_photos_select on storage.objects for select to authenticated
  using (bucket_id = 'listing-photos'
         and (storage.foldername(name))[1] = public.current_org_id()::text);
