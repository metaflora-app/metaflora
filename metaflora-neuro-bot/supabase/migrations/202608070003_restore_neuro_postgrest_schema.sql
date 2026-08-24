BEGIN;

-- The project-level Data API configuration currently exposes only `public`,
-- even though the service-role history client uses the private `neuro` schema.
-- Keep the schema list explicit so the bot and CRM can use the service-role
-- REST client while anon/authenticated still have no privileges there.
ALTER ROLE authenticator
  SET pgrst.db_schemas = 'public, storage, graphql_public, neuro';

GRANT USAGE ON SCHEMA neuro TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA neuro TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA neuro TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA neuro TO service_role;

REVOKE ALL ON SCHEMA neuro FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA neuro FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA neuro FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA neuro FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

COMMIT;
