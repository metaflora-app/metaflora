import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/202607270005_legal_consent.sql', import.meta.url),
  'utf8'
);
const rpcFix = readFileSync(
  new URL('../supabase/migrations/202607270006_fix_legal_consent_rpc.sql', import.meta.url),
  'utf8'
);

test('legal migration stores current status and immutable audit events', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.legal_consent_status/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.legal_consent_events/i);
  assert.match(migration, /terms_accepted boolean NOT NULL DEFAULT false/i);
  assert.match(migration, /personal_data_accepted boolean NOT NULL DEFAULT false/i);
  assert.match(migration, /request_key text NOT NULL UNIQUE/i);
});

test('legal consent RPC is idempotent, owner-scoped and service-role only', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.record_legal_consent/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /ON CONFLICT \(request_key\)/i);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(migration, /REVOKE ALL .* FROM PUBLIC/i);
  assert.match(migration, /GRANT EXECUTE[\s\S]*TO service_role/i);
});

test('legal RPC fix qualifies status columns that collide with output names', () => {
  assert.match(rpcFix, /CREATE OR REPLACE FUNCTION neuro\.record_legal_consent/i);
  assert.match(
    rpcFix,
    /consent_status\.terms_accepted AND consent_status\.personal_data_accepted/i
  );
  assert.doesNotMatch(rpcFix, /WHEN terms_accepted AND personal_data_accepted/i);
});
