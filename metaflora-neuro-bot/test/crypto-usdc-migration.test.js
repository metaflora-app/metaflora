import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/202608110004_crypto_usdc_checkout.sql', import.meta.url),
  'utf8'
);
const workerMigration = readFileSync(
  new URL('../supabase/migrations/202608110005_crypto_usdc_funding_worker.sql', import.meta.url),
  'utf8'
);
const gasReserveMigration = readFileSync(
  new URL('../supabase/migrations/202608110006_crypto_usdc_gas_reserve.sql', import.meta.url),
  'utf8'
);

test('crypto migration uses dedicated USDC-micros payment and finance records', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.crypto_usdc_payments/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.crypto_usdc_callbacks/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.crypto_usdc_finance_requests/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.crypto_usdc_entitlement_audit/i);
  assert.match(migration, /amount_usdc_micros bigint NOT NULL/i);
  assert.match(migration, /chain text NOT NULL DEFAULT 'base'/i);
  assert.match(migration, /payment_method text NOT NULL DEFAULT 'crypto_usdc'/i);
  assert.match(migration, /UNIQUE INDEX IF NOT EXISTS crypto_usdc_payments_transaction_idx/i);
  assert.match(migration, /UNIQUE INDEX IF NOT EXISTS crypto_usdc_callbacks_transaction_idx/i);
  assert.match(migration, /openrouter_usdc_micros bigint NOT NULL CHECK \(openrouter_usdc_micros >= 5250000\)/i);
  assert.match(migration, /openrouter_credit_microusd bigint NOT NULL CHECK \(openrouter_credit_microusd >= 5000000\)/i);
  assert.match(migration, /gas_reserve_usdc_micros bigint NOT NULL CHECK \(gas_reserve_usdc_micros >= 10000\)/i);
  assert.match(migration, /owner_usdc_micros bigint NOT NULL CHECK \(owner_usdc_micros >= 0\)/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.crypto_usdc_finance_requests[\s\S]*?openrouter_usdc_micros bigint NOT NULL[\s\S]*?gas_reserve_usdc_micros bigint NOT NULL[\s\S]*?owner_usdc_micros bigint NOT NULL[\s\S]*?openrouter_usdc_micros \+ gas_reserve_usdc_micros \+ owner_usdc_micros = amount_usdc_micros/i);
  assert.doesNotMatch(migration, /amount_kopecks|amount_xtr/i);
});

test('crypto funding worker claims with leases and cannot replay an external settlement', () => {
  assert.match(workerMigration, /claim_crypto_usdc_funding_requests/i);
  assert.match(workerMigration, /FOR UPDATE SKIP LOCKED/i);
  assert.match(workerMigration, /charge_started_at IS NULL/i);
  assert.match(workerMigration, /mark_crypto_usdc_funding_started/i);
  assert.match(workerMigration, /mark_crypto_usdc_funding_completed/i);
  assert.match(workerMigration, /mark_crypto_usdc_funding_manual/i);
  assert.match(workerMigration, /owner_transaction_hash/i);
  assert.match(workerMigration, /openrouter_external_id/i);
  assert.match(workerMigration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated/i);
});

test('crypto confirmation RPC is atomic, idempotent and creates no provider top-up', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.record_crypto_usdc_callback/i);
  assert.match(migration, /ON CONFLICT \(callback_id\) DO NOTHING/i);
  assert.match(migration, /idempotency payload conflicts/i);
  assert.match(migration, /chain_status <> 'confirmed'/i);
  assert.match(migration, /INSERT INTO neuro\.crypto_usdc_finance_requests/i);
  assert.match(migration, /INSERT INTO neuro\.crypto_usdc_callbacks\s*\([\s\S]*?openrouter_usdc_micros,[\s\S]*?gas_reserve_usdc_micros, owner_usdc_micros/i);
  assert.doesNotMatch(migration, /INSERT INTO neuro\.provider_topup_requests/i);
  assert.match(migration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated/i);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION[\s\S]*TO service_role/i);
});

test('crypto payment reaches final success only through the entitlement completion RPC', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.complete_crypto_usdc_fulfillment/i);
  assert.match(migration, /INSERT INTO neuro\.crypto_usdc_entitlement_audit/i);
  assert.match(migration, /payment_rail[^\n]*'crypto_usdc'/i);
  assert.match(migration, /funding_provider[^\n]*'openrouter'/i);
  assert.match(migration, /SET status = 'fulfilled'/i);
});

test('fulfilled is terminal across signed callback replays', () => {
  assert.match(migration, /v_payment\.status IN \('confirmed', 'fulfilled'\)/i);
  assert.match(migration, /SET status = CASE WHEN status = 'fulfilled' THEN 'fulfilled' ELSE 'confirmed' END/i);
});

test('follow-up migration upgrades already deployed crypto tables and RPCs idempotently', () => {
  assert.match(gasReserveMigration, /ADD COLUMN IF NOT EXISTS openrouter_credit_microusd/i);
  assert.match(gasReserveMigration, /ADD COLUMN IF NOT EXISTS gas_reserve_usdc_micros/i);
  assert.match(gasReserveMigration, /allocation_snapshot->>'gasReserveUsdcMicros'/i);
  assert.match(gasReserveMigration, /openrouter_usdc_micros \+ gas_reserve_usdc_micros \+ owner_usdc_micros = amount_usdc_micros/i);
  assert.match(gasReserveMigration, /CREATE OR REPLACE FUNCTION neuro\.record_crypto_usdc_callback/i);
  assert.match(gasReserveMigration, /CREATE OR REPLACE FUNCTION neuro\.claim_crypto_usdc_funding_requests/i);
  assert.match(gasReserveMigration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated/i);
});
