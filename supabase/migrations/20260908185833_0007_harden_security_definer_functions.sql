-- Fix mutable search_path on update_updated_at
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;

-- Revoke EXECUTE on handle_new_user from anon and authenticated
-- (it's a trigger function, only needs to run as SECURITY DEFINER for the trigger)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
