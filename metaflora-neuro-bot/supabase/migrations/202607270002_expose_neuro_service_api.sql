BEGIN;

ALTER ROLE authenticator
  SET pgrst.db_schemas = 'public, storage, graphql_public, neuro';

GRANT USAGE ON SCHEMA neuro TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA neuro TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA neuro TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA neuro TO service_role;

REVOKE ALL ON SCHEMA neuro FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA neuro FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA neuro FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA neuro FROM anon, authenticated;

NOTIFY pgrst, 'reload config';

COMMIT;
