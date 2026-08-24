import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(
  new URL('../supabase/migrations/202608140003_referral_offer_acceptance_rpc_patch.sql', import.meta.url),
  'utf8'
);

test('offer acceptance RPC qualifies columns that collide with TABLE return names', () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION neuro\.accept_referral_offer_v2/);
  assert.match(sql, /WHERE acceptance\.user_id=v_user AND acceptance\.offer_version=p_offer_version/);
  assert.doesNotMatch(sql, /WHERE user_id=v_user/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION neuro\.accept_referral_offer_v2[\s\S]*TO service_role/);
});
