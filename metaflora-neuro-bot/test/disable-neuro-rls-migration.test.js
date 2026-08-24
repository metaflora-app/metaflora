import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/202607270007_disable_neuro_rls.sql', import.meta.url),
  'utf8'
);

const botTables = [
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
  'system_jobs',
  'free_weekly_usage',
  'free_request_claims',
  'free_weekly_entitlement_usage',
  'free_entitlement_claims',
  'legal_consent_status',
  'legal_consent_events'
];

test('RLS is disabled for every bot table in the neuro schema', () => {
  for (const table of botTables) {
    assert.match(
      migration,
      new RegExp(`ALTER TABLE neuro\\.${table} DISABLE ROW LEVEL SECURITY`),
      `RLS is not disabled for neuro.${table}`
    );
  }
});

test('public client roles remain revoked after RLS is disabled', () => {
  assert.match(migration, /REVOKE ALL ON SCHEMA neuro FROM PUBLIC/i);
  assert.match(migration, /REVOKE ALL ON SCHEMA neuro FROM anon, authenticated/i);
  assert.match(
    migration,
    /REVOKE ALL ON ALL TABLES IN SCHEMA neuro FROM anon, authenticated/i
  );
  assert.match(migration, /GRANT ALL ON ALL TABLES IN SCHEMA neuro TO service_role/i);
});

test('migration does not touch tables outside the bot schema', () => {
  assert.doesNotMatch(migration, /ALTER TABLE public\./i);
  assert.doesNotMatch(migration, /ALTER TABLE storage\./i);
});
