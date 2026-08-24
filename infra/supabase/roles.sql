-- Run once in the Supabase SQL editor with passwords supplied through your secret manager.
-- Never reuse the migrator credentials at application runtime.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'braincrew_app') THEN
    CREATE ROLE braincrew_app LOGIN NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'braincrew_worker') THEN
    CREATE ROLE braincrew_worker LOGIN NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'braincrew_webhook') THEN
    CREATE ROLE braincrew_webhook LOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

-- `public` access is granted by the project owner when the login roles are
-- provisioned; the migrator owns `app` and every Braincrew object below.
GRANT USAGE ON SCHEMA app TO braincrew_app, braincrew_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO braincrew_app, braincrew_worker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public
  TO braincrew_app, braincrew_worker;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app
  TO braincrew_app, braincrew_worker;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO braincrew_app, braincrew_worker;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO braincrew_app, braincrew_worker;

-- The runtime may read the global catalog but only migrations may mutate it.
REVOKE INSERT, UPDATE, DELETE ON TABLE
  "ModelDefinition", "PluginDefinition"
FROM braincrew_app, braincrew_worker;

-- Global catalogs are read-only to the server runtimes and completely hidden
-- from Supabase `anon` / `authenticated` PostgREST roles.
ALTER TABLE "ModelDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ModelDefinition" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "server runtimes can read model catalog" ON "ModelDefinition";
CREATE POLICY "server runtimes can read model catalog"
ON "ModelDefinition" FOR SELECT TO braincrew_app, braincrew_worker
USING (true);

ALTER TABLE "PluginDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PluginDefinition" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "server runtimes can read plugin catalog" ON "PluginDefinition";
CREATE POLICY "server runtimes can read plugin catalog"
ON "PluginDefinition" FOR SELECT TO braincrew_app, braincrew_worker
USING (true);

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" FORCE ROW LEVEL SECURITY;

-- Verified Stripe webhooks use WEBHOOK_DATABASE_URL; runtime roles cannot read them.
REVOKE ALL ON TABLE "ExternalWebhookEvent" FROM braincrew_app, braincrew_worker;

-- The Stripe verifier has no tenant session, so it bypasses RLS but can only
-- read/write the idempotency ledger and subscription projection.
GRANT SELECT, INSERT, UPDATE ON TABLE "ExternalWebhookEvent", "Subscription"
  TO braincrew_webhook;
