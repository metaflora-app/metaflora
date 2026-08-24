import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../supabase/migrations/202608140001_referral_supabase_authority.sql', import.meta.url), 'utf8');

test('referral financial tables use RLS and service-role-only RPC writes', () => {
  for (const table of [
    'referral_qualifying_payments', 'referral_cash_earnings', 'referral_metacoin_bonuses',
    'referral_earning_reversals', 'referral_partner_debts', 'referral_payout_requests', 'referral_payout_events',
    'referral_ledger_entries', 'referral_partner_profiles', 'referral_offer_acceptances'
  ]) assert.match(sql, new RegExp(`ALTER TABLE neuro\\.${table} ENABLE ROW LEVEL SECURITY`));
  assert.match(sql, /REVOKE ALL ON FUNCTION neuro\.record_referral_earning_v2/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION neuro\.record_referral_earning_v2[\s\S]* TO service_role/);
});

test('ledger, reversals, payout events and offer acceptance are immutable', () => {
  for (const trigger of [
    'referral_ledger_immutable', 'referral_reversals_immutable',
    'referral_partner_debts_immutable', 'referral_payout_events_immutable', 'referral_offer_acceptances_immutable'
  ]) assert.match(sql, new RegExp(`CREATE TRIGGER ${trigger} BEFORE UPDATE OR DELETE`));
});

test('economic evidence is explicit and enforces the owner floor', () => {
  for (const column of [
    'gross_amount_kopecks', 'payment_fee_kopecks', 'total_api_liability_kopecks',
    'referral_bonus_liability_kopecks', 'contribution_amount_kopecks',
    'cash_earning_kopecks', 'owner_remainder_kopecks'
  ]) assert.match(sql, new RegExp(column));
  assert.match(sql, /owner_remainder_kopecks \* 100 >= gross_amount_kopecks \* 30/);
  assert.match(sql, /policy_version text NOT NULL/);
});

test('withdrawal reservation and transitions are CAS/idempotent', () => {
  assert.match(sql, /idempotency_key text NOT NULL UNIQUE/);
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /v_current\.status<>p_expected_status/);
  assert.match(sql, /invalid payout transition/);
  assert.match(sql, /next_retry_at<=now\(\)/);
  assert.match(sql, /manual_review/);
  assert.match(sql, /record_referral_payout_submission_v2/);
  assert.match(sql, /v\.external_payout_id IS NOT NULL AND v\.external_payout_id<>p_external_payout_id/);
});

test('withdrawal reservation fails closed without current offer and verified eligible partner', () => {
  assert.match(sql, /referral_offer_acceptances[\s\S]*offer_version/);
  assert.match(sql, /referral_partner_profiles[\s\S]*verification_status='verified'/);
  assert.match(sql, /payout_enabled=true/);
  assert.match(sql, /legal_status IN \('self_employed','ip','legal_entity'\)/);
  assert.match(sql, /partner is not eligible for payouts/);
});

test('T-Business notification reconciliation validates identity and amount under row lock', () => {
  assert.match(sql, /reconcile_referral_payout_notification_v2/);
  assert.match(sql, /withdrawal_id=p_withdrawal_id FOR UPDATE/);
  assert.match(sql, /amount_kopecks<>p_amount_kopecks/);
  assert.match(sql, /external_payout_id<>p_external_payout_id/);
  assert.match(sql, /ON CONFLICT\(entry_key\) DO NOTHING/);
});
