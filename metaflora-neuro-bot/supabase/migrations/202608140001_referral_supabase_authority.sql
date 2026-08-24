BEGIN;

-- Authoritative referral finance contour. Legacy SQLite is backfill-only after cutover.
CREATE TABLE IF NOT EXISTS neuro.referral_qualifying_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_key text NOT NULL UNIQUE CHECK (length(payment_key) BETWEEN 1 AND 160),
  referred_user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  referrer_user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  product_kind text NOT NULL DEFAULT 'unknown',
  product_id text NOT NULL DEFAULT 'unknown',
  gross_amount_kopecks bigint NOT NULL CHECK (gross_amount_kopecks > 0),
  payment_fee_kopecks bigint NOT NULL CHECK (payment_fee_kopecks >= 0),
  total_api_liability_kopecks bigint NOT NULL CHECK (total_api_liability_kopecks >= 0),
  referral_bonus_liability_kopecks bigint NOT NULL CHECK (referral_bonus_liability_kopecks >= 0),
  contribution_amount_kopecks bigint NOT NULL CHECK (contribution_amount_kopecks >= 0),
  cash_earning_kopecks bigint NOT NULL CHECK (cash_earning_kopecks >= 0),
  owner_remainder_kopecks bigint NOT NULL CHECK (owner_remainder_kopecks >= 0),
  policy_version text NOT NULL CHECK (length(policy_version) BETWEEN 1 AND 80),
  paid_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'refunded', 'chargeback', 'voided')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (referred_user_id <> referrer_user_id),
  CHECK (contribution_amount_kopecks = gross_amount_kopecks - payment_fee_kopecks - total_api_liability_kopecks),
  CHECK (owner_remainder_kopecks = contribution_amount_kopecks - cash_earning_kopecks),
  CHECK (owner_remainder_kopecks * 100 >= gross_amount_kopecks * 30)
);

CREATE INDEX IF NOT EXISTS referral_qualifying_payments_referrer_idx
  ON neuro.referral_qualifying_payments(referrer_user_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS referral_qualifying_payments_referred_idx
  ON neuro.referral_qualifying_payments(referred_user_id, paid_at DESC);

CREATE TABLE IF NOT EXISTS neuro.referral_level_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL UNIQUE REFERENCES neuro.referral_qualifying_payments(id) ON DELETE RESTRICT,
  referrer_user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  level_code text NOT NULL CHECK (level_code IN ('classic', 'silver', 'gold', 'platinum')),
  paid_referrals_count integer NOT NULL CHECK (paid_referrals_count >= 0),
  cash_percent integer NOT NULL CHECK (cash_percent BETWEEN 0 AND 100),
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neuro.referral_cash_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL UNIQUE REFERENCES neuro.referral_qualifying_payments(id) ON DELETE RESTRICT,
  referrer_user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  referred_user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  amount_kopecks bigint NOT NULL CHECK (amount_kopecks >= 0),
  percent integer NOT NULL CHECK (percent BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'reserved', 'paid', 'reversed')),
  available_at timestamptz NOT NULL,
  reversed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  policy_version text NOT NULL,
  CHECK (referred_user_id <> referrer_user_id)
);

CREATE INDEX IF NOT EXISTS referral_cash_earnings_account_idx
  ON neuro.referral_cash_earnings(referrer_user_id, status, available_at);

CREATE TABLE IF NOT EXISTS neuro.referral_metacoin_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES neuro.referral_qualifying_payments(id) ON DELETE RESTRICT,
  beneficiary_user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  beneficiary_role text NOT NULL CHECK (beneficiary_role IN ('invitee', 'inviter')),
  amount_metacoins integer NOT NULL CHECK (amount_metacoins >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'reversed')),
  source_payment_key text NOT NULL,
  applied_at timestamptz,
  reversed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payment_id, beneficiary_role)
);

CREATE TABLE IF NOT EXISTS neuro.referral_earning_reversals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reversal_key text NOT NULL UNIQUE CHECK (length(reversal_key) BETWEEN 1 AND 160),
  earning_id uuid NOT NULL REFERENCES neuro.referral_cash_earnings(id) ON DELETE RESTRICT,
  payment_id uuid NOT NULL REFERENCES neuro.referral_qualifying_payments(id) ON DELETE RESTRICT,
  amount_kopecks bigint NOT NULL CHECK (amount_kopecks >= 0),
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 80),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neuro.referral_partner_debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  reversal_id uuid NOT NULL UNIQUE REFERENCES neuro.referral_earning_reversals(id) ON DELETE RESTRICT,
  amount_kopecks bigint NOT NULL CHECK (amount_kopecks > 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','recovered','waived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neuro.referral_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id text NOT NULL UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  amount_kopecks bigint NOT NULL CHECK (amount_kopecks > 0),
  payout_method text NOT NULL CHECK (payout_method IN ('sbp', 'bank_card', 'bank_account')),
  provider text NOT NULL DEFAULT 'tbank_mass_payouts' CHECK (provider='tbank_mass_payouts'),
  destination_encrypted text NOT NULL,
  destination_hint text NOT NULL CHECK (length(destination_hint) BETWEEN 1 AND 64),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitting', 'processing', 'paid', 'rejected', 'cancelled', 'manual_review', 'unknown')),
  external_payout_id text,
  payout_fee_kopecks bigint CHECK (payout_fee_kopecks >= 0),
  error_code text,
  claim_token uuid,
  lease_until timestamptz,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  last_attempt_at timestamptz,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_payout_requests_queue_idx
  ON neuro.referral_payout_requests(status, next_retry_at, requested_at);

CREATE TABLE IF NOT EXISTS neuro.referral_payout_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payout_request_id uuid NOT NULL REFERENCES neuro.referral_payout_requests(id) ON DELETE RESTRICT,
  from_status text,
  to_status text NOT NULL,
  external_payout_id text,
  error_code text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neuro.referral_ledger_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  entry_key text NOT NULL UNIQUE CHECK (length(entry_key) BETWEEN 1 AND 200),
  entry_type text NOT NULL CHECK (entry_type IN ('earning_pending', 'earning_available', 'withdrawal_reserved', 'withdrawal_released', 'payout_paid', 'earning_reversed')),
  amount_kopecks bigint NOT NULL CHECK (amount_kopecks <> 0),
  earning_id uuid REFERENCES neuro.referral_cash_earnings(id) ON DELETE RESTRICT,
  payout_request_id uuid REFERENCES neuro.referral_payout_requests(id) ON DELETE RESTRICT,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_ledger_entries_user_idx
  ON neuro.referral_ledger_entries(user_id, id DESC);

CREATE TABLE IF NOT EXISTS neuro.referral_partner_profiles (
  user_id uuid PRIMARY KEY REFERENCES neuro.users(id) ON DELETE RESTRICT,
  legal_status text CHECK (legal_status IN ('self_employed', 'ip', 'legal_entity')),
  inn text CHECK (inn IS NULL OR inn ~ '^([0-9]{10}|[0-9]{12})$'),
  full_name text,
  verification_status text NOT NULL DEFAULT 'not_started' CHECK (verification_status IN ('not_started', 'pending', 'verified', 'rejected', 'blocked')),
  payout_enabled boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neuro.referral_partner_verification_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  verification_version integer NOT NULL CHECK (verification_version > 0),
  from_status text,
  to_status text NOT NULL,
  provider text NOT NULL,
  external_check_id text,
  reason_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,verification_version)
);

CREATE TABLE IF NOT EXISTS neuro.referral_offer_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  offer_version text NOT NULL,
  document_sha256 text NOT NULL CHECK (document_sha256 ~ '^[0-9a-f]{64}$'),
  source text NOT NULL DEFAULT 'telegram_bot',
  source_event_id text NOT NULL UNIQUE,
  telegram_update_id bigint,
  accepted_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_version),
  UNIQUE (telegram_update_id)
);

CREATE TABLE IF NOT EXISTS neuro.referral_program_policy (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  current_offer_version text NOT NULL CHECK (length(current_offer_version) BETWEEN 1 AND 80),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO neuro.referral_program_policy(singleton,current_offer_version)
VALUES(true,'partner-program-2026-08-14')
ON CONFLICT(singleton) DO NOTHING;

CREATE OR REPLACE FUNCTION neuro.reject_referral_finance_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  RAISE EXCEPTION 'referral financial audit rows are immutable';
END; $$;

DROP TRIGGER IF EXISTS referral_ledger_immutable ON neuro.referral_ledger_entries;
CREATE TRIGGER referral_ledger_immutable BEFORE UPDATE OR DELETE ON neuro.referral_ledger_entries
FOR EACH ROW EXECUTE FUNCTION neuro.reject_referral_finance_mutation();
DROP TRIGGER IF EXISTS referral_reversals_immutable ON neuro.referral_earning_reversals;
CREATE TRIGGER referral_reversals_immutable BEFORE UPDATE OR DELETE ON neuro.referral_earning_reversals
FOR EACH ROW EXECUTE FUNCTION neuro.reject_referral_finance_mutation();
DROP TRIGGER IF EXISTS referral_partner_debts_immutable ON neuro.referral_partner_debts;
CREATE TRIGGER referral_partner_debts_immutable BEFORE UPDATE OR DELETE ON neuro.referral_partner_debts
FOR EACH ROW EXECUTE FUNCTION neuro.reject_referral_finance_mutation();
DROP TRIGGER IF EXISTS referral_payout_events_immutable ON neuro.referral_payout_events;
CREATE TRIGGER referral_payout_events_immutable BEFORE UPDATE OR DELETE ON neuro.referral_payout_events
FOR EACH ROW EXECUTE FUNCTION neuro.reject_referral_finance_mutation();
DROP TRIGGER IF EXISTS referral_offer_acceptances_immutable ON neuro.referral_offer_acceptances;
CREATE TRIGGER referral_offer_acceptances_immutable BEFORE UPDATE OR DELETE ON neuro.referral_offer_acceptances
FOR EACH ROW EXECUTE FUNCTION neuro.reject_referral_finance_mutation();
DROP TRIGGER IF EXISTS referral_partner_verification_events_immutable ON neuro.referral_partner_verification_events;
CREATE TRIGGER referral_partner_verification_events_immutable BEFORE UPDATE OR DELETE ON neuro.referral_partner_verification_events
FOR EACH ROW EXECUTE FUNCTION neuro.reject_referral_finance_mutation();

ALTER TABLE neuro.referral_qualifying_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_level_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_cash_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_metacoin_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_earning_reversals ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_partner_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_payout_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_partner_verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_offer_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_program_policy ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION neuro.record_referral_earning_v2(
  p_payment_key text, p_referrer_telegram_id bigint, p_referred_telegram_id bigint,
  p_gross_amount_kopecks bigint, p_payment_fee_kopecks bigint, p_total_api_liability_kopecks bigint,
  p_referral_bonus_liability_kopecks bigint, p_contribution_amount_kopecks bigint,
  p_reward_amount_kopecks bigint, p_owner_remainder_kopecks bigint,
  p_invitee_bonus_metacoins integer, p_inviter_bonus_metacoins integer, p_percent integer,
  p_available_at timestamptz, p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE(earning_id uuid, outcome text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = neuro, pg_temp AS $$
DECLARE v_referrer uuid; v_referred uuid; v_payment uuid; v_earning uuid; v_existing record;
BEGIN
  IF p_referrer_telegram_id = p_referred_telegram_id OR p_gross_amount_kopecks <= 0
     OR p_reward_amount_kopecks < 0 OR p_percent NOT BETWEEN 0 AND 100 THEN
    RAISE EXCEPTION 'invalid referral earning';
  END IF;
  SELECT id INTO v_referrer FROM neuro.users WHERE telegram_user_id = p_referrer_telegram_id;
  SELECT id INTO v_referred FROM neuro.users WHERE telegram_user_id = p_referred_telegram_id;
  IF v_referrer IS NULL OR v_referred IS NULL THEN RAISE EXCEPTION 'referral user not found'; END IF;
  SELECT e.id AS earning_id, p.referrer_user_id, p.referred_user_id, p.gross_amount_kopecks,
    p.payment_fee_kopecks,p.total_api_liability_kopecks,p.referral_bonus_liability_kopecks,
    p.contribution_amount_kopecks,p.owner_remainder_kopecks,e.amount_kopecks,e.percent
    INTO v_existing FROM neuro.referral_qualifying_payments p
    LEFT JOIN neuro.referral_cash_earnings e ON e.payment_id = p.id WHERE p.payment_key = p_payment_key;
  IF FOUND THEN
    IF v_existing.referrer_user_id <> v_referrer OR v_existing.referred_user_id <> v_referred
       OR v_existing.gross_amount_kopecks <> p_gross_amount_kopecks
       OR v_existing.payment_fee_kopecks <> p_payment_fee_kopecks
       OR v_existing.total_api_liability_kopecks <> p_total_api_liability_kopecks
       OR v_existing.referral_bonus_liability_kopecks <> p_referral_bonus_liability_kopecks
       OR v_existing.contribution_amount_kopecks <> p_contribution_amount_kopecks
       OR v_existing.owner_remainder_kopecks <> p_owner_remainder_kopecks
       OR v_existing.amount_kopecks <> p_reward_amount_kopecks OR v_existing.percent <> p_percent THEN
      RAISE EXCEPTION 'idempotency conflict for referral payment';
    END IF;
    RETURN QUERY SELECT v_existing.earning_id, 'already_recorded'::text; RETURN;
  END IF;
  INSERT INTO neuro.referral_qualifying_payments(payment_key,referred_user_id,referrer_user_id,product_kind,product_id,gross_amount_kopecks,payment_fee_kopecks,total_api_liability_kopecks,referral_bonus_liability_kopecks,contribution_amount_kopecks,cash_earning_kopecks,owner_remainder_kopecks,policy_version,paid_at,metadata)
  VALUES(p_payment_key,v_referred,v_referrer,COALESCE(p_metadata->>'product_kind','unknown'),COALESCE(p_metadata->>'product_id','unknown'),p_gross_amount_kopecks,p_payment_fee_kopecks,p_total_api_liability_kopecks,p_referral_bonus_liability_kopecks,p_contribution_amount_kopecks,p_reward_amount_kopecks,p_owner_remainder_kopecks,COALESCE(p_metadata->>'policy_version','referral-v1'),COALESCE((p_metadata->>'paid_at')::timestamptz,now()),COALESCE(p_metadata,'{}')) RETURNING id INTO v_payment;
  INSERT INTO neuro.referral_cash_earnings(payment_id,referrer_user_id,referred_user_id,amount_kopecks,percent,available_at,policy_version)
  VALUES(v_payment,v_referrer,v_referred,p_reward_amount_kopecks,p_percent,p_available_at,COALESCE(p_metadata->>'policy_version','referral-v1')) RETURNING id INTO v_earning;
  INSERT INTO neuro.referral_ledger_entries(user_id,entry_key,entry_type,amount_kopecks,earning_id,metadata)
  VALUES(v_referrer,'earning:pending:'||v_earning,'earning_pending',p_reward_amount_kopecks,v_earning,p_metadata);
  INSERT INTO neuro.referral_level_snapshots(payment_id,referrer_user_id,level_code,paid_referrals_count,cash_percent)
  VALUES(v_payment,v_referrer,COALESCE(p_metadata->>'level_code','classic'),COALESCE((p_metadata->>'paid_referrals_count')::integer,0),p_percent);
  IF p_invitee_bonus_metacoins > 0 THEN INSERT INTO neuro.referral_metacoin_bonuses(payment_id,beneficiary_user_id,beneficiary_role,amount_metacoins,status,source_payment_key,applied_at) VALUES(v_payment,v_referred,'invitee',p_invitee_bonus_metacoins,COALESCE(p_metadata->>'invitee_bonus_status','pending'),p_payment_key,CASE WHEN p_metadata->>'invitee_bonus_status'='applied' THEN now() END); END IF;
  IF p_inviter_bonus_metacoins > 0 THEN INSERT INTO neuro.referral_metacoin_bonuses(payment_id,beneficiary_user_id,beneficiary_role,amount_metacoins,status,source_payment_key,applied_at) VALUES(v_payment,v_referrer,'inviter',p_inviter_bonus_metacoins,COALESCE(p_metadata->>'inviter_bonus_status','pending'),p_payment_key,CASE WHEN p_metadata->>'inviter_bonus_status'='applied' THEN now() END); END IF;
  RETURN QUERY SELECT v_earning, 'created'::text;
END; $$;

CREATE OR REPLACE FUNCTION neuro.bind_referral_relation_v2(p_referred_telegram_id bigint,p_referrer_telegram_id bigint,p_referral_code text,p_referred_at timestamptz)
RETURNS TABLE(outcome text,referrer_user_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v_referred uuid; v_referrer uuid; v_existing uuid;
BEGIN
  IF p_referred_telegram_id=p_referrer_telegram_id THEN RETURN QUERY SELECT 'self_referral'::text,NULL::uuid; RETURN; END IF;
  SELECT id INTO v_referred FROM neuro.users WHERE telegram_user_id=p_referred_telegram_id;
  SELECT id INTO v_referrer FROM neuro.users WHERE telegram_user_id=p_referrer_telegram_id;
  IF v_referred IS NULL OR v_referrer IS NULL THEN RAISE EXCEPTION 'referral user not found'; END IF;
  SELECT r.referrer_user_id INTO v_existing FROM neuro.referral_relations r WHERE r.referred_user_id=v_referred FOR UPDATE;
  IF FOUND THEN RETURN QUERY SELECT CASE WHEN v_existing=v_referrer THEN 'already_bound' ELSE 'conflict' END,v_existing; RETURN; END IF;
  INSERT INTO neuro.referral_relations(referred_user_id,referrer_user_id,referral_code,referred_at) VALUES(v_referred,v_referrer,p_referral_code,p_referred_at);
  UPDATE neuro.users SET referrer_user_id=v_referrer,updated_at=now() WHERE id=v_referred AND referrer_user_id IS NULL;
  RETURN QUERY SELECT 'bound'::text,v_referrer;
END; $$;

CREATE OR REPLACE FUNCTION neuro.release_referral_earnings_v2(p_now timestamptz DEFAULT now(), p_limit integer DEFAULT 500)
RETURNS TABLE(released_count integer) LANGUAGE plpgsql SECURITY DEFINER SET search_path = neuro, pg_temp AS $$
DECLARE v_count integer;
BEGIN
  WITH due AS (SELECT id FROM neuro.referral_cash_earnings WHERE status='pending' AND available_at<=p_now ORDER BY available_at FOR UPDATE SKIP LOCKED LIMIT LEAST(GREATEST(p_limit,1),2000)),
  changed AS (UPDATE neuro.referral_cash_earnings e SET status='available',updated_at=p_now FROM due WHERE e.id=due.id RETURNING e.*),
  logged AS (INSERT INTO neuro.referral_ledger_entries(user_id,entry_key,entry_type,amount_kopecks,earning_id)
    SELECT referrer_user_id,'earning:available:'||id,'earning_available',amount_kopecks,id FROM changed ON CONFLICT(entry_key) DO NOTHING RETURNING 1)
  SELECT count(*) INTO v_count FROM changed;
  RETURN QUERY SELECT v_count;
END; $$;

CREATE OR REPLACE FUNCTION neuro.reverse_referral_earning_v2(p_payment_key text,p_reversal_key text,p_reason text,p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(outcome text,reversal_key text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v_e neuro.referral_cash_earnings%ROWTYPE; v_p uuid; v_reversal uuid; v_overpaid bigint; v_existing_debt bigint;
BEGIN
  IF EXISTS(SELECT 1 FROM neuro.referral_earning_reversals WHERE referral_earning_reversals.reversal_key=p_reversal_key) THEN RETURN QUERY SELECT 'already_reversed'::text,p_reversal_key; RETURN; END IF;
  SELECT e.* INTO v_e FROM neuro.referral_qualifying_payments p JOIN neuro.referral_cash_earnings e ON e.payment_id=p.id WHERE p.payment_key=p_payment_key FOR UPDATE OF e;
  IF NOT FOUND THEN RAISE EXCEPTION 'earning not found'; END IF;
  v_p := v_e.payment_id;
  UPDATE neuro.referral_cash_earnings SET status='reversed',reversed_at=now(),updated_at=now() WHERE id=v_e.id AND status<>'reversed';
  INSERT INTO neuro.referral_earning_reversals(reversal_key,earning_id,payment_id,amount_kopecks,reason,metadata) VALUES(p_reversal_key,v_e.id,v_p,v_e.amount_kopecks,p_reason,p_metadata) RETURNING id INTO v_reversal;
  INSERT INTO neuro.referral_ledger_entries(user_id,entry_key,entry_type,amount_kopecks,earning_id,metadata) VALUES(v_e.referrer_user_id,'earning:reversed:'||p_reversal_key,'earning_reversed',-v_e.amount_kopecks,v_e.id,p_metadata);
  UPDATE neuro.referral_qualifying_payments SET status='refunded' WHERE id=v_p AND status='confirmed';
  SELECT GREATEST(COALESCE((SELECT sum(amount_kopecks) FROM neuro.referral_payout_requests WHERE user_id=v_e.referrer_user_id AND status='paid'),0)-COALESCE((SELECT sum(amount_kopecks) FROM neuro.referral_cash_earnings WHERE referrer_user_id=v_e.referrer_user_id AND status<>'reversed'),0),0),COALESCE((SELECT sum(amount_kopecks) FROM neuro.referral_partner_debts WHERE user_id=v_e.referrer_user_id),0) INTO v_overpaid,v_existing_debt;
  IF v_overpaid>v_existing_debt THEN INSERT INTO neuro.referral_partner_debts(user_id,reversal_id,amount_kopecks) VALUES(v_e.referrer_user_id,v_reversal,v_overpaid-v_existing_debt); END IF;
  RETURN QUERY SELECT 'reversed'::text,p_reversal_key;
END; $$;

CREATE OR REPLACE FUNCTION neuro.get_referral_account_v2(p_telegram_id bigint)
RETURNS TABLE(available_kopecks bigint,pending_kopecks bigint,reserved_kopecks bigint,lifetime_kopecks bigint)
LANGUAGE sql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
WITH target AS (SELECT id FROM neuro.users WHERE telegram_user_id=p_telegram_id),
e AS (SELECT COALESCE(sum(amount_kopecks) FILTER(WHERE status='available'),0)::bigint available,COALESCE(sum(amount_kopecks) FILTER(WHERE status='pending'),0)::bigint pending,COALESCE(sum(amount_kopecks) FILTER(WHERE status<>'reversed'),0)::bigint lifetime FROM neuro.referral_cash_earnings WHERE referrer_user_id=(SELECT id FROM target)),
w AS (SELECT COALESCE(sum(amount_kopecks) FILTER(WHERE status IN ('pending','submitting','processing','unknown','manual_review')),0)::bigint reserved,COALESCE(sum(amount_kopecks) FILTER(WHERE status IN ('pending','submitting','processing','unknown','manual_review','paid')),0)::bigint consumed FROM neuro.referral_payout_requests WHERE user_id=(SELECT id FROM target))
SELECT GREATEST(e.available-w.consumed,0),e.pending,w.reserved,e.lifetime FROM e,w
$$;

CREATE OR REPLACE FUNCTION neuro.reserve_referral_withdrawal_v2(p_withdrawal_id text,p_telegram_id bigint,p_amount_kopecks bigint,p_payout_method text,p_destination_encrypted text,p_destination_hint text,p_idempotency_key text)
RETURNS TABLE(withdrawal_id text,status text,outcome text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v_user uuid; v_available bigint; v_existing neuro.referral_payout_requests%ROWTYPE; v_id uuid;
BEGIN
  SELECT * INTO v_existing FROM neuro.referral_payout_requests r WHERE r.idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF v_existing.withdrawal_id<>p_withdrawal_id OR v_existing.amount_kopecks<>p_amount_kopecks OR v_existing.user_id<>(SELECT id FROM neuro.users WHERE telegram_user_id=p_telegram_id) THEN RAISE EXCEPTION 'idempotency conflict for withdrawal'; END IF;
    RETURN QUERY SELECT v_existing.withdrawal_id,v_existing.status,'already_reserved'::text; RETURN;
  END IF;
  SELECT id INTO v_user FROM neuro.users WHERE telegram_user_id=p_telegram_id FOR UPDATE;
  IF v_user IS NULL THEN RAISE EXCEPTION 'referral user not found'; END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM neuro.referral_partner_profiles profile
    JOIN neuro.referral_offer_acceptances acceptance ON acceptance.user_id=profile.user_id
    JOIN neuro.referral_program_policy policy ON policy.singleton=true
      AND acceptance.offer_version=policy.current_offer_version
    WHERE profile.user_id=v_user
      AND profile.verification_status='verified'
      AND profile.payout_enabled=true
      AND profile.legal_status IN ('self_employed','ip','legal_entity')
  ) THEN RAISE EXCEPTION 'partner is not eligible for payouts'; END IF;
  SELECT GREATEST(COALESCE(sum(amount_kopecks) FILTER(WHERE status='available'),0)-(SELECT COALESCE(sum(amount_kopecks),0) FROM neuro.referral_payout_requests WHERE user_id=v_user AND status IN ('pending','submitting','processing','unknown','manual_review','paid')),0) INTO v_available FROM neuro.referral_cash_earnings WHERE referrer_user_id=v_user;
  IF p_amount_kopecks<=0 OR p_amount_kopecks>v_available THEN RAISE EXCEPTION 'insufficient referral balance'; END IF;
  INSERT INTO neuro.referral_payout_requests(withdrawal_id,idempotency_key,user_id,amount_kopecks,payout_method,destination_encrypted,destination_hint)
  VALUES(p_withdrawal_id,p_idempotency_key,v_user,p_amount_kopecks,p_payout_method,p_destination_encrypted,p_destination_hint) RETURNING id INTO v_id;
  INSERT INTO neuro.referral_payout_events(payout_request_id,to_status) VALUES(v_id,'pending');
  INSERT INTO neuro.referral_ledger_entries(user_id,entry_key,entry_type,amount_kopecks,payout_request_id) VALUES(v_user,'withdrawal:reserved:'||v_id,'withdrawal_reserved',-p_amount_kopecks,v_id);
  RETURN QUERY SELECT p_withdrawal_id,'pending'::text,'created'::text;
END; $$;

CREATE OR REPLACE FUNCTION neuro.reconcile_referral_payout_notification_v2(
  p_withdrawal_id text,p_external_payout_id text,p_amount_kopecks bigint,
  p_provider_status text,p_error_code text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v neuro.referral_payout_requests%ROWTYPE; v_next text;
BEGIN
  IF p_provider_status NOT IN ('pending','succeeded','failed') OR p_amount_kopecks<=0
     OR length(COALESCE(p_external_payout_id,'')) NOT BETWEEN 1 AND 180 THEN RETURN false; END IF;
  SELECT * INTO v FROM neuro.referral_payout_requests WHERE withdrawal_id=p_withdrawal_id FOR UPDATE;
  IF NOT FOUND OR v.amount_kopecks<>p_amount_kopecks
     OR (v.external_payout_id IS NOT NULL AND v.external_payout_id<>p_external_payout_id)
     OR v.status IN ('cancelled','rejected') THEN RETURN false; END IF;
  v_next:=CASE p_provider_status WHEN 'succeeded' THEN 'paid' WHEN 'failed' THEN 'rejected' ELSE 'processing' END;
  IF v.status=v_next THEN RETURN true; END IF;
  IF v.status='paid' THEN RETURN false; END IF;
  UPDATE neuro.referral_payout_requests SET status=v_next,external_payout_id=p_external_payout_id,
    error_code=p_error_code,claim_token=NULL,lease_until=NULL,
    processed_at=CASE WHEN v_next IN ('paid','rejected') THEN now() ELSE NULL END,updated_at=now()
  WHERE id=v.id AND status=v.status;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO neuro.referral_payout_events(payout_request_id,from_status,to_status,external_payout_id,error_code,payload)
  VALUES(v.id,v.status,v_next,p_external_payout_id,p_error_code,jsonb_build_object('source','tbank_webhook'));
  IF v_next='paid' THEN
    INSERT INTO neuro.referral_ledger_entries(user_id,entry_key,entry_type,amount_kopecks,payout_request_id)
    VALUES(v.user_id,'payout:paid:'||v.id,'payout_paid',-v.amount_kopecks,v.id) ON CONFLICT(entry_key) DO NOTHING;
  ELSIF v_next='rejected' THEN
    INSERT INTO neuro.referral_ledger_entries(user_id,entry_key,entry_type,amount_kopecks,payout_request_id)
    VALUES(v.user_id,'withdrawal:released:'||v.id,'withdrawal_released',v.amount_kopecks,v.id) ON CONFLICT(entry_key) DO NOTHING;
  END IF;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION neuro.list_referral_people_v2(p_telegram_id bigint,p_limit integer DEFAULT 20)
RETURNS TABLE(telegram_id bigint,username text,first_name text,created_at timestamptz,first_payment_at timestamptz,turnover_kopecks bigint)
LANGUAGE sql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
WITH target AS (SELECT id FROM neuro.users WHERE telegram_user_id=p_telegram_id)
SELECT referred.telegram_user_id,referred.username,referred.first_name,relation.referred_at,
  min(payment.paid_at),COALESCE(sum(payment.gross_amount_kopecks) FILTER(WHERE payment.status='confirmed'),0)::bigint
FROM neuro.referral_relations relation
JOIN neuro.users referred ON referred.id=relation.referred_user_id
LEFT JOIN neuro.referral_qualifying_payments payment ON payment.referred_user_id=relation.referred_user_id
  AND payment.referrer_user_id=relation.referrer_user_id
WHERE relation.referrer_user_id=(SELECT id FROM target)
GROUP BY referred.telegram_user_id,referred.username,referred.first_name,relation.referred_at
ORDER BY relation.referred_at DESC LIMIT LEAST(GREATEST(p_limit,1),100)
$$;

CREATE OR REPLACE FUNCTION neuro.list_referral_earnings_v2(p_telegram_id bigint,p_limit integer DEFAULT 20)
RETURNS TABLE(amount_kopecks bigint,percent integer,status text,created_at timestamptz,username text,first_name text,payment_amount_kopecks bigint,invitee_bonus_metacoins integer)
LANGUAGE sql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
WITH target AS (SELECT id FROM neuro.users WHERE telegram_user_id=p_telegram_id)
SELECT earning.amount_kopecks,earning.percent,earning.status,earning.created_at,referred.username,referred.first_name,
  payment.gross_amount_kopecks,COALESCE(bonus.amount_metacoins,0)
FROM neuro.referral_cash_earnings earning
JOIN neuro.users referred ON referred.id=earning.referred_user_id
JOIN neuro.referral_qualifying_payments payment ON payment.id=earning.payment_id
LEFT JOIN neuro.referral_metacoin_bonuses bonus ON bonus.payment_id=payment.id AND bonus.beneficiary_role='invitee'
WHERE earning.referrer_user_id=(SELECT id FROM target)
ORDER BY earning.created_at DESC LIMIT LEAST(GREATEST(p_limit,1),100)
$$;

CREATE OR REPLACE FUNCTION neuro.transition_referral_withdrawal_v2(p_withdrawal_id text,p_expected_status text,p_next_status text,p_external_payout_id text DEFAULT NULL,p_error_code text DEFAULT NULL,p_payout_fee_kopecks bigint DEFAULT NULL)
RETURNS TABLE(withdrawal_id text,status text,changed boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v_current neuro.referral_payout_requests%ROWTYPE;
BEGIN
  IF (p_expected_status,p_next_status) NOT IN (('pending','processing'),('processing','paid'),('processing','rejected'),('pending','cancelled')) THEN RAISE EXCEPTION 'invalid payout transition'; END IF;
  SELECT * INTO v_current FROM neuro.referral_payout_requests WHERE referral_payout_requests.withdrawal_id=p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'withdrawal not found'; END IF;
  IF v_current.status<>p_expected_status THEN RETURN QUERY SELECT v_current.withdrawal_id,v_current.status,false; RETURN; END IF;
  UPDATE neuro.referral_payout_requests SET status=p_next_status,external_payout_id=COALESCE(p_external_payout_id,external_payout_id),error_code=p_error_code,payout_fee_kopecks=COALESCE(p_payout_fee_kopecks,payout_fee_kopecks),processed_at=CASE WHEN p_next_status IN ('paid','rejected','cancelled') THEN now() ELSE processed_at END,updated_at=now() WHERE id=v_current.id;
  INSERT INTO neuro.referral_payout_events(payout_request_id,from_status,to_status,external_payout_id,error_code) VALUES(v_current.id,p_expected_status,p_next_status,p_external_payout_id,p_error_code);
  IF p_next_status IN ('rejected','cancelled') THEN INSERT INTO neuro.referral_ledger_entries(user_id,entry_key,entry_type,amount_kopecks,payout_request_id) VALUES(v_current.user_id,'withdrawal:released:'||v_current.id,'withdrawal_released',v_current.amount_kopecks,v_current.id) ON CONFLICT(entry_key) DO NOTHING;
  ELSIF p_next_status='paid' THEN INSERT INTO neuro.referral_ledger_entries(user_id,entry_key,entry_type,amount_kopecks,payout_request_id) VALUES(v_current.user_id,'payout:paid:'||v_current.id,'payout_paid',-v_current.amount_kopecks,v_current.id) ON CONFLICT(entry_key) DO NOTHING; END IF;
  RETURN QUERY SELECT p_withdrawal_id,p_next_status,true;
END; $$;

CREATE OR REPLACE FUNCTION neuro.claim_referral_payouts_v2(p_worker_id text,p_limit integer DEFAULT 25,p_lease_seconds integer DEFAULT 120)
RETURNS TABLE(withdrawal_id text,claim_token uuid,user_id uuid,amount_kopecks bigint,payout_method text,destination_encrypted text,destination_hint text,external_payout_id text,attempt_count integer,lease_until timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
BEGIN
  IF length(COALESCE(p_worker_id,'')) NOT BETWEEN 1 AND 100 OR p_limit NOT BETWEEN 1 AND 100 OR p_lease_seconds NOT BETWEEN 30 AND 900 THEN RAISE EXCEPTION 'invalid payout claim'; END IF;
  RETURN QUERY WITH candidates AS (SELECT id FROM neuro.referral_payout_requests WHERE (status='pending' AND next_retry_at<=now() AND attempt_count<max_attempts) OR (status='submitting' AND lease_until<now() AND attempt_count<max_attempts) ORDER BY next_retry_at,requested_at FOR UPDATE SKIP LOCKED LIMIT p_limit),
  claimed AS (UPDATE neuro.referral_payout_requests r SET status='submitting',claim_token=gen_random_uuid(),lease_until=now()+make_interval(secs=>p_lease_seconds),attempt_count=r.attempt_count+1,last_attempt_at=now(),updated_at=now() FROM candidates c WHERE r.id=c.id RETURNING r.*),
  events AS (INSERT INTO neuro.referral_payout_events(payout_request_id,from_status,to_status,payload) SELECT id,CASE WHEN attempt_count=1 THEN 'pending' ELSE 'submitting' END,'submitting',jsonb_build_object('worker_id',p_worker_id,'attempt',attempt_count) FROM claimed RETURNING 1)
  SELECT c.withdrawal_id,c.claim_token,c.user_id,c.amount_kopecks,c.payout_method,c.destination_encrypted,c.destination_hint,c.external_payout_id,c.attempt_count,c.lease_until FROM claimed c;
END; $$;

CREATE OR REPLACE FUNCTION neuro.record_referral_payout_submission_v2(p_withdrawal_id text,p_claim_token uuid,p_external_payout_id text,p_provider_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v_id uuid;
BEGIN
  UPDATE neuro.referral_payout_requests SET external_payout_id=COALESCE(external_payout_id,p_external_payout_id),updated_at=now()
  WHERE withdrawal_id=p_withdrawal_id AND status='submitting' AND claim_token=p_claim_token AND (external_payout_id IS NULL OR external_payout_id=p_external_payout_id) RETURNING id INTO v_id;
  IF v_id IS NULL THEN RETURN false; END IF;
  INSERT INTO neuro.referral_payout_events(payout_request_id,from_status,to_status,external_payout_id,payload) VALUES(v_id,'submitting','submitting',p_external_payout_id,jsonb_build_object('provider_status',p_provider_status));
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION neuro.complete_referral_payout_v2(p_withdrawal_id text,p_claim_token uuid,p_external_payout_id text,p_payout_fee_kopecks bigint DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v neuro.referral_payout_requests%ROWTYPE;
BEGIN
  SELECT * INTO v FROM neuro.referral_payout_requests WHERE withdrawal_id=p_withdrawal_id FOR UPDATE;
  IF NOT FOUND OR v.status<>'submitting' OR v.claim_token<>p_claim_token OR v.lease_until<now()
     OR (v.external_payout_id IS NOT NULL AND v.external_payout_id<>p_external_payout_id) THEN RETURN false; END IF;
  UPDATE neuro.referral_payout_requests SET status='paid',external_payout_id=p_external_payout_id,payout_fee_kopecks=p_payout_fee_kopecks,processed_at=now(),claim_token=NULL,lease_until=NULL,updated_at=now() WHERE id=v.id;
  INSERT INTO neuro.referral_payout_events(payout_request_id,from_status,to_status,external_payout_id) VALUES(v.id,'submitting','paid',p_external_payout_id);
  INSERT INTO neuro.referral_ledger_entries(user_id,entry_key,entry_type,amount_kopecks,payout_request_id) VALUES(v.user_id,'payout:paid:'||v.id,'payout_paid',-v.amount_kopecks,v.id) ON CONFLICT(entry_key) DO NOTHING;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION neuro.fail_referral_payout_v2(p_withdrawal_id text,p_claim_token uuid,p_error_code text,p_retryable boolean DEFAULT true)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v neuro.referral_payout_requests%ROWTYPE; v_next text;
BEGIN
  SELECT * INTO v FROM neuro.referral_payout_requests WHERE withdrawal_id=p_withdrawal_id FOR UPDATE;
  IF NOT FOUND OR v.status<>'submitting' OR v.claim_token<>p_claim_token THEN RETURN false; END IF;
  v_next:=CASE WHEN p_retryable AND v.attempt_count<v.max_attempts THEN 'pending' WHEN p_retryable THEN 'manual_review' ELSE 'rejected' END;
  UPDATE neuro.referral_payout_requests SET status=v_next,error_code=p_error_code,next_retry_at=CASE WHEN v_next='pending' THEN now()+make_interval(secs=>LEAST(3600,30*power(2,GREATEST(v.attempt_count-1,0))::integer)) ELSE next_retry_at END,processed_at=CASE WHEN v_next='pending' THEN NULL ELSE now() END,claim_token=NULL,lease_until=NULL,updated_at=now() WHERE id=v.id;
  INSERT INTO neuro.referral_payout_events(payout_request_id,from_status,to_status,error_code) VALUES(v.id,'submitting',v_next,p_error_code);
  IF NOT p_retryable THEN INSERT INTO neuro.referral_ledger_entries(user_id,entry_key,entry_type,amount_kopecks,payout_request_id) VALUES(v.user_id,'withdrawal:released:'||v.id,'withdrawal_released',v.amount_kopecks,v.id) ON CONFLICT(entry_key) DO NOTHING; END IF;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION neuro.manual_referral_payout_v2(p_withdrawal_id text,p_claim_token uuid,p_error_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v neuro.referral_payout_requests%ROWTYPE;
BEGIN
  SELECT * INTO v FROM neuro.referral_payout_requests WHERE withdrawal_id=p_withdrawal_id FOR UPDATE;
  IF NOT FOUND OR v.status<>'submitting' OR v.claim_token<>p_claim_token THEN RETURN false; END IF;
  UPDATE neuro.referral_payout_requests SET status='manual_review',error_code=p_error_code,processed_at=now(),claim_token=NULL,lease_until=NULL,updated_at=now() WHERE id=v.id;
  INSERT INTO neuro.referral_payout_events(payout_request_id,from_status,to_status,error_code) VALUES(v.id,'submitting','manual_review',p_error_code);
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION neuro.accept_referral_offer_v2(p_telegram_id bigint,p_offer_version text,p_document_sha256 text,p_accepted_at timestamptz,p_telegram_update_id bigint,p_source_event_id text,p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(offer_version text,accepted_at timestamptz,outcome text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v_user uuid; v_row neuro.referral_offer_acceptances%ROWTYPE; v_inserted integer;
BEGIN
  SELECT id INTO v_user FROM neuro.users WHERE telegram_user_id=p_telegram_id;
  IF v_user IS NULL THEN RAISE EXCEPTION 'referral user not found'; END IF;
  INSERT INTO neuro.referral_offer_acceptances(user_id,offer_version,document_sha256,source_event_id,telegram_update_id,accepted_at,metadata)
  VALUES(v_user,p_offer_version,p_document_sha256,p_source_event_id,p_telegram_update_id,p_accepted_at,COALESCE(p_metadata,'{}')) ON CONFLICT(user_id,offer_version) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  SELECT * INTO v_row FROM neuro.referral_offer_acceptances WHERE user_id=v_user AND referral_offer_acceptances.offer_version=p_offer_version;
  RETURN QUERY SELECT v_row.offer_version,v_row.accepted_at,CASE WHEN v_inserted=1 THEN 'accepted' ELSE 'already_accepted' END;
END; $$;

CREATE OR REPLACE FUNCTION neuro.upsert_referral_partner_profile_v2(p_telegram_id bigint,p_legal_status text,p_inn text,p_full_name text,p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(legal_status text,verification_status text,payout_enabled boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v_user uuid;
BEGIN
  SELECT id INTO v_user FROM neuro.users WHERE telegram_user_id=p_telegram_id;
  IF v_user IS NULL THEN RAISE EXCEPTION 'referral user not found'; END IF;
  IF p_legal_status NOT IN ('self_employed','ip','legal_entity') OR p_inn !~ '^([0-9]{10}|[0-9]{12})$' THEN RAISE EXCEPTION 'invalid partner profile'; END IF;
  INSERT INTO neuro.referral_partner_profiles(user_id,legal_status,inn,full_name,verification_status,payout_enabled,metadata)
  VALUES(v_user,p_legal_status,p_inn,p_full_name,'pending',false,COALESCE(p_metadata,'{}'))
  ON CONFLICT(user_id) DO UPDATE SET legal_status=EXCLUDED.legal_status,inn=EXCLUDED.inn,full_name=EXCLUDED.full_name,verification_status='pending',payout_enabled=false,metadata=EXCLUDED.metadata,updated_at=now();
  RETURN QUERY SELECT p_legal_status,'pending'::text,false;
END; $$;

CREATE OR REPLACE FUNCTION neuro.get_referral_partner_onboarding_v2(p_telegram_id bigint)
RETURNS TABLE(offer_version text,offer_accepted_at timestamptz,legal_status text,inn_masked text,verification_status text,payout_enabled boolean)
LANGUAGE sql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
WITH target AS (SELECT id FROM neuro.users WHERE telegram_user_id=p_telegram_id), consent AS (SELECT offer_version,accepted_at FROM neuro.referral_offer_acceptances WHERE user_id=(SELECT id FROM target) ORDER BY accepted_at DESC LIMIT 1)
SELECT c.offer_version,c.accepted_at,p.legal_status,CASE WHEN p.inn IS NULL THEN NULL ELSE repeat('•',greatest(length(p.inn)-4,0))||right(p.inn,4) END,p.verification_status,p.payout_enabled FROM target t LEFT JOIN consent c ON true LEFT JOIN neuro.referral_partner_profiles p ON p.user_id=t.id
$$;

CREATE OR REPLACE FUNCTION neuro.transition_referral_partner_verification_v2(p_telegram_id bigint,p_expected_status text,p_next_status text,p_provider text,p_external_check_id text DEFAULT NULL,p_reason_code text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE v_user uuid; v_version integer;
BEGIN
  SELECT id INTO v_user FROM neuro.users WHERE telegram_user_id=p_telegram_id;
  UPDATE neuro.referral_partner_profiles SET verification_status=p_next_status,payout_enabled=(p_next_status='verified'),updated_at=now() WHERE user_id=v_user AND verification_status=p_expected_status;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT COALESCE(max(verification_version),0)+1 INTO v_version FROM neuro.referral_partner_verification_events WHERE user_id=v_user;
  INSERT INTO neuro.referral_partner_verification_events(user_id,verification_version,from_status,to_status,provider,external_check_id,reason_code) VALUES(v_user,v_version,p_expected_status,p_next_status,p_provider,p_external_check_id,p_reason_code);
  RETURN true;
END; $$;

CREATE OR REPLACE VIEW neuro.referral_crm_drilldown AS
SELECT r.referrer_user_id,r.referred_user_id,r.referral_code,r.referred_at,p.payment_key,p.product_kind,p.product_id,p.gross_amount_kopecks,p.payment_fee_kopecks,p.total_api_liability_kopecks,p.referral_bonus_liability_kopecks,p.contribution_amount_kopecks,p.cash_earning_kopecks,p.owner_remainder_kopecks,p.policy_version,p.paid_at,p.status payment_status,e.amount_kopecks earning_kopecks,e.percent,e.status earning_status,e.available_at,l.level_code,l.paid_referrals_count
FROM neuro.referral_relations r LEFT JOIN neuro.referral_qualifying_payments p ON p.referrer_user_id=r.referrer_user_id AND p.referred_user_id=r.referred_user_id LEFT JOIN neuro.referral_cash_earnings e ON e.payment_id=p.id LEFT JOIN neuro.referral_level_snapshots l ON l.payment_id=p.id;

REVOKE ALL ON neuro.referral_qualifying_payments,neuro.referral_level_snapshots,neuro.referral_cash_earnings,
  neuro.referral_metacoin_bonuses,neuro.referral_earning_reversals,neuro.referral_payout_requests,
  neuro.referral_partner_debts,
  neuro.referral_payout_events,neuro.referral_ledger_entries,neuro.referral_partner_profiles,
  neuro.referral_partner_verification_events,neuro.referral_offer_acceptances,neuro.referral_program_policy FROM anon,authenticated;
REVOKE ALL ON FUNCTION neuro.record_referral_earning_v2(text,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,integer,integer,integer,timestamptz,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.bind_referral_relation_v2(bigint,bigint,text,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.release_referral_earnings_v2(timestamptz,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.reverse_referral_earning_v2(text,text,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.get_referral_account_v2(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.reserve_referral_withdrawal_v2(text,bigint,bigint,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.reconcile_referral_payout_notification_v2(text,text,bigint,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.list_referral_people_v2(bigint,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.list_referral_earnings_v2(bigint,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.transition_referral_withdrawal_v2(text,text,text,text,text,bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.claim_referral_payouts_v2(text,integer,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.record_referral_payout_submission_v2(text,uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.complete_referral_payout_v2(text,uuid,text,bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.fail_referral_payout_v2(text,uuid,text,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.manual_referral_payout_v2(text,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.accept_referral_offer_v2(bigint,text,text,timestamptz,bigint,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.upsert_referral_partner_profile_v2(bigint,text,text,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.get_referral_partner_onboarding_v2(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION neuro.transition_referral_partner_verification_v2(bigint,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION neuro.record_referral_earning_v2(text,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,integer,integer,integer,timestamptz,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.bind_referral_relation_v2(bigint,bigint,text,timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.release_referral_earnings_v2(timestamptz,integer) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.reverse_referral_earning_v2(text,text,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.get_referral_account_v2(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.reserve_referral_withdrawal_v2(text,bigint,bigint,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.reconcile_referral_payout_notification_v2(text,text,bigint,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.list_referral_people_v2(bigint,integer) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.list_referral_earnings_v2(bigint,integer) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.transition_referral_withdrawal_v2(text,text,text,text,text,bigint) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.claim_referral_payouts_v2(text,integer,integer) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.record_referral_payout_submission_v2(text,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.complete_referral_payout_v2(text,uuid,text,bigint) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.fail_referral_payout_v2(text,uuid,text,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.manual_referral_payout_v2(text,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.accept_referral_offer_v2(bigint,text,text,timestamptz,bigint,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.upsert_referral_partner_profile_v2(bigint,text,text,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.get_referral_partner_onboarding_v2(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.transition_referral_partner_verification_v2(bigint,text,text,text,text,text) TO service_role;

COMMIT;
