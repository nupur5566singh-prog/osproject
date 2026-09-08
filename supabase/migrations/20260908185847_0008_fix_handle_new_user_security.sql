-- Remove handle_new_user from the API schema so it's not exposed via PostgREST
-- It's a trigger function called by auth.events, not meant to be called directly
ALTER FUNCTION public.handle_new_user() SECURITY INVOKER;
