-- Only the auth trigger should run this; it is not an API.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Signed-in users need this for row-level security; anonymous visitors do not.
revoke all on function public.current_org_id() from public, anon;
grant execute on function public.current_org_id() to authenticated;
