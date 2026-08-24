import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/202607270001_neuro_history.sql', import.meta.url),
  'utf8'
);

const requiredTables = [
  'users',
  'user_preferences',
  'conversations',
  'messages',
  'generations',
  'generation_assets',
  'metacoin_ledger',
  'payments',
  'subscriptions',
  'promo_codes',
  'promo_redemptions',
  'referral_relations',
  'referral_earnings',
  'referral_withdrawals',
  'voice_profiles',
  'product_events',
  'telegram_updates',
  'telegram_api_calls',
  'provider_api_calls',
  'provider_webhooks',
  'delivery_attempts',
  'system_jobs'
];

test('Supabase migration isolates bot data in the neuro schema', () => {
  assert.match(migration, /CREATE SCHEMA IF NOT EXISTS neuro/);
  for (const table of requiredTables) {
    assert.match(
      migration,
      new RegExp(`CREATE TABLE IF NOT EXISTS neuro\\.${table}\\b`),
      `missing neuro.${table}`
    );
  }
});

test('every user-facing table has RLS and direct public access is revoked', () => {
  for (const table of requiredTables) {
    assert.match(
      migration,
      new RegExp(`ALTER TABLE neuro\\.${table} ENABLE ROW LEVEL SECURITY`),
      `RLS is not enabled for neuro.${table}`
    );
  }
  assert.match(migration, /REVOKE ALL ON ALL TABLES IN SCHEMA neuro FROM anon, authenticated/);
});

test('history tables include retention and query indexes', () => {
  assert.match(migration, /conversations_user_recent_idx/);
  assert.match(migration, /messages_conversation_created_idx/);
  assert.match(migration, /generations_user_recent_idx/);
  assert.match(migration, /expires_at/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.purge_expired_history/);
});

test('API audit tables keep correlation, timing and sanitized payloads', () => {
  assert.match(migration, /telegram_updates_update_id_idx/);
  assert.match(migration, /telegram_api_calls_request_key_idx/);
  assert.match(migration, /provider_api_calls_generation_idx/);
  assert.match(migration, /request_payload jsonb/);
  assert.match(migration, /response_payload jsonb/);
  assert.match(migration, /duration_ms integer/);
  assert.match(migration, /CHECK \(duration_ms IS NULL OR duration_ms >= 0\)/);
});

test('private history buckets are provisioned for bot inputs and outputs', () => {
  for (const bucket of ['neuro-inputs', 'neuro-outputs', 'neuro-voice-samples']) {
    assert.match(migration, new RegExp(`'${bucket}'`));
  }
  assert.match(migration, /INSERT INTO storage\.buckets/);
  assert.match(migration, /public, file_size_limit/);
});

test('payment history keeps receipt delivery status for CRM reconciliation', () => {
  const migration = readFileSync(
    new URL('../supabase/migrations/202608040014_payment_receipts.sql', import.meta.url),
    'utf8'
  );
  assert.match(migration, /ALTER TABLE neuro\.payments\s+ADD COLUMN IF NOT EXISTS receipt_email/);
  assert.match(migration, /receipt_registration/);
  assert.match(migration, /receipt_sent_at/);
});

test('entertainment and music generation subjects are added idempotently', () => {
  const workflowMigration = readFileSync(
    new URL('../supabase/migrations/202608130001_generation_workflow_subjects.sql', import.meta.url),
    'utf8'
  );
  assert.match(workflowMigration, /DROP CONSTRAINT IF EXISTS generations_subject_type_check/u);
  assert.match(workflowMigration, /'entertainment'/u);
  assert.match(workflowMigration, /'music'/u);
  assert.match(workflowMigration, /CREATE INDEX IF NOT EXISTS generations_user_subject_recent_idx/u);
});

test('payment history keeps the actual payment method for CRM reconciliation', () => {
  const migration = readFileSync(
    new URL('../supabase/migrations/202608040016_payment_methods.sql', import.meta.url),
    'utf8'
  );
  assert.match(migration, /ADD COLUMN IF NOT EXISTS payment_method/);
  assert.match(migration, /telegram_stars/);
  assert.match(migration, /payments_payment_method_idx/);
});

test('CRM admin actions enqueue idempotent notifications for the separate bot service', () => {
  const migration = readFileSync(
    new URL('../supabase/migrations/202608040013_crm_user_notifications.sql', import.meta.url),
    'utf8'
  );
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.crm_user_notifications/);
  assert.match(migration, /crm:metacoins:/);
  assert.match(migration, /claim_crm_user_notifications/);
  assert.match(migration, /mark_crm_user_notification_sent/);
  assert.match(migration, /mark_crm_user_notification_failed/);
  assert.match(migration, /FOR UPDATE SKIP LOCKED/);
});

test('CRM tariff changes are transactional, idempotent and routed to the bot queue', () => {
  const migration = readFileSync(
    new URL('../supabase/migrations/202608040015_crm_subscription_change.sql', import.meta.url),
    'utf8'
  );
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.crm_subscription_actions/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.crm_change_subscription/);
  assert.match(migration, /crm:subscription:/);
  assert.match(migration, /ON CONFLICT \(idempotency_key\)/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /subscription_changed/);
});

test('finance migration keeps payment splits, provider reserves and payouts separately auditable', () => {
  const migration = readFileSync(
    new URL('../supabase/migrations/202608040018_finance_ledger.sql', import.meta.url),
    'utf8'
  );
  for (const table of ['finance_allocations', 'provider_topup_requests', 'finance_payouts']) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS neuro\\.${table}\\b`));
    assert.match(migration, new RegExp(`ALTER TABLE neuro\\.${table} ENABLE ROW LEVEL SECURITY`));
  }
  assert.match(migration, /allocation_key text NOT NULL UNIQUE/);
  assert.match(migration, /destination_hint text NOT NULL/);
  assert.match(migration, /provider_topup_requests_status_idx/);
});

test('YooKassa confirmation migration gates provider top-ups by payment.succeeded', () => {
  const settlementMigration = readFileSync(
    new URL('../supabase/migrations/202608070005_yookassa_payment_confirmation.sql', import.meta.url),
    'utf8'
  );
  assert.match(settlementMigration, /CREATE TABLE IF NOT EXISTS neuro\.finance_yookassa_confirmations/);
  assert.match(settlementMigration, /CREATE OR REPLACE FUNCTION neuro\.record_yookassa_payment_confirmation/);
  assert.match(settlementMigration, /v_payment\.status <> 'succeeded'/);
  assert.match(settlementMigration, /p_event <> 'payment\.succeeded'/);
  assert.match(settlementMigration, /allocation\.category = 'api_reserve'/);
  assert.match(settlementMigration, /confirmation_status', 'posted'/);
  assert.match(settlementMigration, /funding_source', 'yookassa'/);
  assert.match(settlementMigration, /external_event_id text NOT NULL UNIQUE/);

  const gateMigration = readFileSync(
    new URL('../supabase/migrations/202608070007_yookassa_topup_db_gate.sql', import.meta.url),
    'utf8'
  );
  assert.match(gateMigration, /v_payment\.provider <> 'yookassa'/);
  assert.match(gateMigration, /INSERT INTO neuro\.provider_topup_requests/);
  assert.match(gateMigration, /confirmation_status', 'posted'/);
  assert.match(gateMigration, /guard_queued_provider_topup_confirmation/);
  assert.match(gateMigration, /yookassa_confirmation_required/);
});

test('fulfillment retry migration validates the live balance only for a new credit', () => {
  const retryMigration = readFileSync(
    new URL('../supabase/migrations/202608070004_fix_fulfillment_retry_balance.sql', import.meta.url),
    'utf8'
  );
  assert.match(retryMigration, /RETURN QUERY SELECT v_ledger_id, v_duplicate, v_existing\.balance_after/);
  assert.match(retryMigration, /IF p_balance_after < p_metacoins THEN/);
  assert.doesNotMatch(retryMigration, /v_existing_ledger\.balance_after\s*<>/);
});

test('T-Bank checkout migration stores a normalized fiscal receipt phone', () => {
  const migration = readFileSync(
    new URL('../supabase/migrations/202608090008_tbank_checkout.sql', import.meta.url),
    'utf8'
  );
  assert.match(migration, /ADD COLUMN IF NOT EXISTS receipt_phone text/);
  assert.match(migration, /payments_receipt_phone_format_check/);
  assert.match(migration, /\^\\\+\[1-9\]\[0-9\]\{9,14\}\$/);
});
