import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/202608070002_idempotent_fulfillment_retries.sql', import.meta.url),
  'utf8'
);

test('fulfillment retry migration keeps the original ledger balance after the user spends credits', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.record_metacoin_purchase/i);
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.record_subscription_activation/i);
  assert.match(migration, /v_existing\.balance_after\s+AS\s+balance_after/i);
  assert.doesNotMatch(
    migration,
    /v_existing\.balance_after\s*<>\s*p_balance_after[\s\S]{0,260}idempotency payload conflicts/i
  );
  assert.match(migration, /FOR UPDATE/i);
  assert.match(migration, /GRANT EXECUTE[\s\S]*TO service_role/i);
});
