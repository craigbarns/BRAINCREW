-- Run as the Supabase project owner after `auth-function.sql`. The function is
-- deliberately owned by `braincrew_migrator`; this file only attaches it to
-- the platform-owned `auth.users` table.

DO $braincrew_auth_trigger$
BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS on_braincrew_auth_user_changed ON auth.users';
  EXECUTE 'CREATE TRIGGER on_braincrew_auth_user_changed
    AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_braincrew_auth_user()';
END
$braincrew_auth_trigger$;
