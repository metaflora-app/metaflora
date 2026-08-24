import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL(
  '../supabase/migrations/202608090007_telegram_stars_financial_contour.sql',
  import.meta.url
), 'utf8');
const reconciliationMigration = readFileSync(new URL(
  '../supabase/migrations/202608090009_telegram_stars_fulfillment_reconciliation.sql',
  import.meta.url
), 'utf8');

test('Stars migration separates XTR ledger and pending fiat receivables from kopecks', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.telegram_stars_ledger/i);
  assert.match(migration, /xtr_delta bigint/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.telegram_stars_receivables/i);
  assert.match(migration, /xtr_amount bigint/i);
  assert.match(migration, /settlement_amount_kopecks bigint/i);
  assert.match(migration, /status text NOT NULL DEFAULT 'pending'/i);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS amount_xtr/i);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS price_xtr/i);
});

test('Stars payment RPC is idempotent and cannot enqueue RUB provider funding', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.record_telegram_stars_payment/i);
  assert.match(migration, /telegram stars payment idempotency payload conflicts/i);
  assert.match(migration, /ON CONFLICT \(charge_id\) DO NOTHING/i);
  assert.doesNotMatch(migration, /INSERT INTO neuro\.provider_topup_requests/i);
  assert.doesNotMatch(migration, /INSERT INTO neuro\.finance_allocations/i);
});

test('Stars migration exposes bounded reconciliation for payments missing fulfillment', () => {
  assert.match(reconciliationMigration, /CREATE OR REPLACE FUNCTION neuro\.list_pending_telegram_stars_fulfillments/i);
  assert.match(reconciliationMigration, /payment\.provider = 'telegram_stars'/i);
  assert.match(reconciliationMigration, /NOT EXISTS[\s\S]*neuro\.metacoin_ledger/i);
  assert.match(reconciliationMigration, /NOT EXISTS[\s\S]*neuro\.subscriptions/i);
  assert.match(reconciliationMigration, /LIMIT p_limit/i);
  assert.match(reconciliationMigration, /SECURITY DEFINER[\s\S]*SET search_path = ''/i);
  assert.match(reconciliationMigration, /REVOKE ALL[\s\S]*FROM PUBLIC, anon, authenticated/i);
  assert.match(reconciliationMigration, /GRANT EXECUTE[\s\S]*TO service_role/i);
});
