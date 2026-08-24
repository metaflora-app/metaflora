BEGIN;

CREATE TABLE IF NOT EXISTS neuro.finance_wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_key text NOT NULL UNIQUE,
  external_payment_id text NOT NULL,
  allocation_key text,
  user_id uuid REFERENCES neuro.users(id) ON DELETE SET NULL,
  account text NOT NULL CHECK (account IN ('cash', 'payment_fee', 'api_reserve', 'provider_spend', 'referral_liability', 'owner_share', 'payout')),
  category text NOT NULL,
  provider text,
  direction text NOT NULL CHECK (direction IN ('credit', 'debit')),
  amount_kopecks bigint NOT NULL CHECK (amount_kopecks > 0),
  currency text NOT NULL DEFAULT 'RUB' CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'reversed')),
  source text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS finance_wallet_ledger_payment_idx
  ON neuro.finance_wallet_ledger(external_payment_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS finance_wallet_ledger_account_idx
  ON neuro.finance_wallet_ledger(account, provider, occurred_at DESC);

ALTER TABLE neuro.finance_wallet_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON neuro.finance_wallet_ledger FROM anon, authenticated;
GRANT ALL ON neuro.finance_wallet_ledger TO service_role;

CREATE OR REPLACE FUNCTION neuro.record_metacoin_purchase(
  p_telegram_user_id bigint,
  p_payment_id text,
  p_metacoins integer,
  p_bonus_metacoins integer,
  p_balance_after integer
)
RETURNS TABLE (
  ledger_id uuid,
  duplicate boolean,
  balance_after integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_payment neuro.payments%ROWTYPE;
  v_existing neuro.metacoin_ledger%ROWTYPE;
  v_ledger_id uuid;
  v_key text;
  v_total integer;
  v_duplicate boolean := false;
BEGIN
  IF p_telegram_user_id IS NULL OR p_telegram_user_id <= 0
    OR p_payment_id IS NULL OR char_length(p_payment_id) NOT BETWEEN 1 AND 128
    OR p_metacoins IS NULL OR p_metacoins <= 0
    OR p_bonus_metacoins IS NULL OR p_bonus_metacoins < 0
    OR p_balance_after IS NULL OR p_balance_after < p_metacoins THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid metacoin purchase payload';
  END IF;

  v_total := p_metacoins;
  SELECT app_user.id INTO v_user_id
  FROM neuro.users AS app_user
  WHERE app_user.telegram_user_id = p_telegram_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'metacoin purchase user does not exist';
  END IF;

  SELECT payment.* INTO v_payment
  FROM neuro.payments AS payment
  WHERE payment.payment_id = p_payment_id
  FOR UPDATE;
  IF NOT FOUND
    OR v_payment.user_id <> v_user_id
    OR v_payment.product_type <> 'metacoins'
    OR v_payment.status <> 'succeeded'
    OR v_payment.base_metacoins + p_bonus_metacoins <> p_metacoins THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'metacoin purchase payload conflicts';
  END IF;

  UPDATE neuro.payments
  SET bonus_metacoins = p_bonus_metacoins, updated_at = now()
  WHERE id = v_payment.id;

  v_key := 'package:' || p_payment_id;
  SELECT ledger.* INTO v_existing
  FROM neuro.metacoin_ledger AS ledger
  WHERE ledger.idempotency_key = v_key;
  IF FOUND THEN
    IF v_existing.user_id <> v_user_id
      OR v_existing.delta <> v_total
      OR v_existing.balance_after <> p_balance_after
      OR v_existing.source <> 'package'
      OR v_existing.reference_id <> p_payment_id THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'metacoin purchase idempotency payload conflicts';
    END IF;
    v_ledger_id := v_existing.id;
    v_duplicate := true;
  ELSE
    INSERT INTO neuro.metacoin_ledger (
      user_id, idempotency_key, delta, balance_after, source,
      reference_type, reference_id, description, metadata
    ) VALUES (
      v_user_id, v_key, v_total, p_balance_after, 'package',
      'payment', p_payment_id, 'начисление пакета метакоинов',
      jsonb_build_object('payment_id', p_payment_id, 'bonus_metacoins', p_bonus_metacoins)
    )
    RETURNING id INTO v_ledger_id;
  END IF;

  RETURN QUERY SELECT v_ledger_id, v_duplicate, p_balance_after;
END;
$$;

REVOKE ALL ON FUNCTION neuro.record_metacoin_purchase(bigint, text, integer, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_metacoin_purchase(bigint, text, integer, integer, integer)
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
