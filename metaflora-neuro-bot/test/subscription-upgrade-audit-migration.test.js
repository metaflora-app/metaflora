import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/202608110002_subscription_upgrade_audit.sql', import.meta.url),
  'utf8'
);

test('upgrade audit migration records the complete before/after balance contract', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.subscription_upgrade_audit/i);
  for (const column of [
    'payment_id',
    'telegram_user_id',
    'before_subscription_total',
    'before_subscription_remaining',
    'target_subscription_total',
    'credited_delta',
    'after_subscription_total',
    'after_subscription_remaining',
    'before_general_balance',
    'after_general_balance',
    'payment_amount_kopecks',
  ]) {
    assert.match(migration, new RegExp(`\\b${column}\\b`, 'i'));
  }
  assert.match(migration, /credited_delta\s*=\s*target_subscription_total\s*-\s*before_subscription_remaining/i);
});

test('upgrade activation RPC is atomic, idempotent and service-role only', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.activate_subscription_upgrade/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /idempotency payload conflicts/i);
  assert.match(migration, /expected_subscription_updated_at/i);
  assert.match(migration, /subscription upgrade expected state changed/i);
  assert.match(migration, /UPDATE neuro\.subscriptions[\s\S]*status = 'cancelled'/i);
  assert.match(migration, /INSERT INTO neuro\.subscriptions[\s\S]*p_target_subscription_total, p_target_subscription_total/i);
  assert.match(migration, /INSERT INTO neuro\.metacoin_ledger[\s\S]*p_credited_delta/i);
  assert.match(migration, /INSERT INTO neuro\.subscription_upgrade_audit/i);
  assert.match(migration, /SECURITY DEFINER/i);
  assert.match(migration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated/i);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION[\s\S]*TO service_role/i);
  assert.match(migration, /ALTER TABLE neuro\.subscription_upgrade_audit ENABLE ROW LEVEL SECURITY/i);
  assert.match(migration, /GRANT SELECT ON TABLE neuro\.subscription_upgrade_audit TO service_role/i);
  assert.doesNotMatch(migration, /GRANT[^;]*INSERT[^;]*subscription_upgrade_audit[^;]*TO service_role/i);
});

test('CRM views expose live subscription and provider funding limits', () => {
  assert.match(migration, /subscription\.metacoins_total AS subscription_metacoins_total/i);
  assert.match(migration, /subscription\.metacoins_remaining AS subscription_metacoins_remaining/i);
  assert.match(migration, /AS package_metacoin_balance/i);
  assert.match(migration, /CREATE OR REPLACE VIEW neuro\.crm_provider_funding_overview/i);
  assert.match(migration, /AS remaining_kopecks/i);
  assert.match(migration, /GRANT SELECT ON TABLE neuro\.crm_provider_funding_overview TO service_role/i);
});

test('successful generation ledger debits keep the live subscription remainder in sync', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.sync_subscription_remaining_from_ledger/i);
  assert.match(migration, /NEW\.source\s*=\s*'generation'/i);
  assert.match(migration, /NEW\.delta\s*<\s*0/i);
  assert.match(migration, /metacoins_remaining\s*=\s*GREATEST\(0,\s*metacoins_remaining\s*\+\s*NEW\.delta\)/i);
  assert.match(migration, /AFTER INSERT ON neuro\.metacoin_ledger/i);
  assert.match(migration, /REVOKE ALL ON FUNCTION neuro\.sync_subscription_remaining_from_ledger/i);
});
