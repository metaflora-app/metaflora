import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/202608070006_provider_topup_worker.sql', import.meta.url),
  'utf8'
);
const atMostOnceMigration = readFileSync(
  new URL('../supabase/migrations/202608080003_provider_topup_at_most_once.sql', import.meta.url),
  'utf8'
);
const minimumBatchMigration = readFileSync(
  new URL('../supabase/migrations/202608090004_provider_topup_minimum_batch_gate.sql', import.meta.url),
  'utf8'
);
const terminalUnpaidMigration = readFileSync(
  new URL('../supabase/migrations/202608090006_provider_terminal_unpaid_recovery.sql', import.meta.url),
  'utf8'
);
const gptunnelClaimMigration = readFileSync(
  new URL('../supabase/migrations/202608090011_gptunnel_provider_topup_claims.sql', import.meta.url),
  'utf8'
);
const confirmationReplayHardeningMigration = readFileSync(
  new URL('../supabase/migrations/202608110003_provider_topup_confirmation_replay_hardening.sql', import.meta.url),
  'utf8'
);

test('provider topup migration adds claims, leases, attempts and observed funding data', () => {
  assert.match(migration, /ALTER TABLE neuro\.provider_topup_requests/i);
  assert.match(migration, /claim_token/i);
  assert.match(migration, /lease_until/i);
  assert.match(migration, /attempt_count/i);
  assert.match(migration, /observed_transaction_id/i);
  assert.match(migration, /observed_amount_kopecks/i);
  assert.match(migration, /observed_balance_kopecks/i);
  assert.match(migration, /CREATE INDEX[\s\S]*provider_topup_requests_claim_idx/i);
});

test('provider topup migration claims by allocation/payment/provider and uses row locking', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.claim_provider_topup_requests/i);
  assert.match(migration, /JOIN neuro\.finance_allocations/i);
  assert.match(migration, /allocation\.external_payment_id/i);
  assert.match(migration, /topup\.provider\s*=\s*p_provider/i);
  assert.match(migration, /FOR UPDATE(?: OF topup)? SKIP LOCKED/i);
  assert.match(migration, /attempt_count\s*=\s*topup\.attempt_count\s*\+\s*1/i);
});

test('provider topup migration verifies observations, bounds attempts and restricts RPC access', () => {
  assert.match(migration, /complete_provider_topup_request/i);
  assert.match(migration, /fail_provider_topup_request/i);
  assert.match(migration, /get_provider_topup_request/i);
  assert.match(migration, /p_observed_transaction_id/i);
  assert.match(migration, /p_observed_amount_kopecks/i);
  assert.match(migration, /p_observed_balance_kopecks/i);
  assert.match(migration, /p_max_attempts/i);
  assert.match(migration, /SECURITY DEFINER/i);
  assert.match(migration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated/i);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION[\s\S]*TO service_role/i);
});

test('provider topup at-most-once migration blocks lease retries after an external charge starts', () => {
  assert.match(atMostOnceMigration, /charge_started_at timestamptz/i);
  assert.match(atMostOnceMigration, /mark_provider_topup_charge_started/i);
  assert.match(atMostOnceMigration, /charge_started_at\s+IS NULL/i);
  assert.match(atMostOnceMigration, /WHEN topup\.charge_started_at IS NOT NULL THEN 'manual'/i);
  assert.match(atMostOnceMigration, /p_idempotency_key/i);
});

test('provider topup minimum gate leaves sub-100 RUB reserves queued until a chargeable batch exists', () => {
  assert.match(minimumBatchMigration, /eligible_small_total/i);
  assert.match(minimumBatchMigration, /topup\.amount_kopecks >= 10000/i);
  assert.match(minimumBatchMigration, /small\.total_kopecks[\s\S]*eligible_small_total AS small\) >= 10000/i);
  assert.match(minimumBatchMigration, /charge_started_at IS NULL/i);
  assert.match(minimumBatchMigration, /FOR UPDATE OF topup SKIP LOCKED/i);
});

test('terminal unpaid recovery is narrow, idempotent and restricted to service role', () => {
  assert.match(terminalUnpaidMigration, /payment_declined/i);
  assert.match(terminalUnpaidMigration, /external_charge_started/i);
  assert.match(terminalUnpaidMigration, /external_id IS NULL/i);
  assert.match(terminalUnpaidMigration, /observed_transaction_id IS NULL/i);
  assert.match(terminalUnpaidMigration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated/i);
  assert.match(terminalUnpaidMigration, /GRANT EXECUTE ON FUNCTION[\s\S]*TO service_role/i);
});

test('GPTunnel claims are not blocked by the Polza 100 RUB batch minimum', () => {
  assert.match(gptunnelClaimMigration, /p_provider\s*=\s*'gptunnel'/i);
  assert.match(gptunnelClaimMigration, /topup\.amount_kopecks\s*>=\s*10000/i);
  assert.match(gptunnelClaimMigration, /FOR UPDATE OF topup SKIP LOCKED/i);
  assert.match(gptunnelClaimMigration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC, anon, authenticated/i);
  assert.match(gptunnelClaimMigration, /GRANT EXECUTE ON FUNCTION[\s\S]*TO service_role/i);
});

test('confirmation replay hardening quarantines already-started queued charges and enforces the invariant', () => {
  assert.match(
    confirmationReplayHardeningMigration,
    /UPDATE neuro\.provider_topup_requests[\s\S]*status\s*=\s*'manual'[\s\S]*WHERE[\s\S]*status\s*=\s*'queued'[\s\S]*charge_started_at IS NOT NULL/i
  );
  assert.match(
    confirmationReplayHardeningMigration,
    /CHECK\s*\(\s*status\s*<>\s*'queued'\s+OR\s+charge_started_at\s+IS NULL\s*\)/i
  );
});

test('payment confirmation replays cannot mutate an existing provider topup request', () => {
  assert.match(
    confirmationReplayHardeningMigration,
    /CREATE OR REPLACE FUNCTION neuro\.record_yookassa_payment_confirmation/i
  );
  assert.match(
    confirmationReplayHardeningMigration,
    /CREATE OR REPLACE FUNCTION neuro\.record_tbank_payment_confirmation/i
  );
  assert.equal(
    confirmationReplayHardeningMigration.match(/ON CONFLICT\s*\(allocation_key\)\s*DO NOTHING/gi)?.length,
    2
  );
  assert.doesNotMatch(
    confirmationReplayHardeningMigration,
    /WHEN\s+neuro\.provider_topup_requests\.status\s+IN\s*\([^)]*'manual'[^)]*\)\s+THEN\s+'queued'/i
  );
});

test('claim RPC never selects a charge-started row, including one marked queued', () => {
  assert.match(
    confirmationReplayHardeningMigration,
    /candidates AS\s*\([\s\S]*?WHERE[\s\S]*?topup\.charge_started_at IS NULL[\s\S]*?FOR UPDATE OF topup SKIP LOCKED/i
  );
  assert.match(
    confirmationReplayHardeningMigration,
    /REVOKE ALL ON FUNCTION neuro\.claim_provider_topup_requests[\s\S]*FROM PUBLIC, anon, authenticated/i
  );
  assert.match(
    confirmationReplayHardeningMigration,
    /GRANT EXECUTE ON FUNCTION neuro\.claim_provider_topup_requests[\s\S]*TO service_role/i
  );
});
