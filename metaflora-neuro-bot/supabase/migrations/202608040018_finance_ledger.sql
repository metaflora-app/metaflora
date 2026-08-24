BEGIN;

CREATE TABLE IF NOT EXISTS neuro.finance_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_key text NOT NULL UNIQUE,
  external_payment_id text NOT NULL,
  user_id uuid REFERENCES neuro.users(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('gross', 'payment_fee', 'api_reserve', 'referral_liability', 'owner_share', 'refund')),
  provider text,
  amount_kopecks bigint NOT NULL CHECK (amount_kopecks > 0),
  currency text NOT NULL DEFAULT 'RUB' CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL CHECK (status IN ('estimated', 'reserved', 'actual', 'reversed')),
  source text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS finance_allocations_payment_idx
  ON neuro.finance_allocations(external_payment_id, category);
CREATE INDEX IF NOT EXISTS finance_allocations_provider_idx
  ON neuro.finance_allocations(provider, category, occurred_at DESC)
  WHERE provider IS NOT NULL;

CREATE TABLE IF NOT EXISTS neuro.provider_topup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_key text NOT NULL UNIQUE REFERENCES neuro.finance_allocations(allocation_key) ON DELETE RESTRICT,
  provider text NOT NULL,
  amount_kopecks bigint NOT NULL CHECK (amount_kopecks > 0),
  currency text NOT NULL DEFAULT 'RUB' CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'manual')),
  external_id text,
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_topup_requests_status_idx
  ON neuro.provider_topup_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS neuro.finance_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES neuro.users(id) ON DELETE SET NULL,
  telegram_user_id bigint CHECK (telegram_user_id IS NULL OR telegram_user_id > 0),
  amount_kopecks bigint NOT NULL CHECK (amount_kopecks > 0),
  currency text NOT NULL DEFAULT 'RUB' CHECK (currency ~ '^[A-Z]{3}$'),
  payout_method text NOT NULL CHECK (payout_method IN ('sbp', 'bank_card')),
  provider text NOT NULL DEFAULT 'yookassa_payouts',
  external_payout_id text,
  payout_fee_kopecks bigint CHECK (payout_fee_kopecks IS NULL OR payout_fee_kopecks >= 0),
  status text NOT NULL CHECK (status IN ('pending', 'submitted', 'succeeded', 'canceled', 'failed')),
  payout_status text,
  destination_hint text NOT NULL DEFAULT 'скрыто',
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS finance_payouts_status_idx
  ON neuro.finance_payouts(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS finance_payouts_user_idx
  ON neuro.finance_payouts(user_id, requested_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE neuro.finance_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.provider_topup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.finance_payouts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON neuro.finance_allocations, neuro.provider_topup_requests, neuro.finance_payouts FROM anon, authenticated;
GRANT ALL ON neuro.finance_allocations, neuro.provider_topup_requests, neuro.finance_payouts TO service_role;

COMMIT;
