-- Run once in the Supabase SQL editor with passwords supplied through your secret manager.
-- Never reuse the migrator credentials at application runtime.

CREATE ROLE braincrew_app LOGIN NOINHERIT NOBYPASSRLS;
CREATE ROLE braincrew_worker LOGIN NOINHERIT NOBYPASSRLS;

GRANT USAGE ON SCHEMA public, app TO braincrew_app, braincrew_worker;
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

-- Verified Stripe webhooks use WEBHOOK_DATABASE_URL; runtime roles cannot read them.
REVOKE ALL ON TABLE "ExternalWebhookEvent" FROM braincrew_app, braincrew_worker;
