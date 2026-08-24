BEGIN;

CREATE SCHEMA IF NOT EXISTS neuro;

CREATE TABLE IF NOT EXISTS neuro.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id bigint NOT NULL UNIQUE CHECK (telegram_user_id > 0),
  username text NOT NULL DEFAULT '',
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  language_code text NOT NULL DEFAULT '',
  is_premium boolean NOT NULL DEFAULT false,
  is_bot boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  referral_code text UNIQUE,
  referrer_user_id uuid REFERENCES neuro.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_referrer_idx
  ON neuro.users(referrer_user_id);
CREATE INDEX IF NOT EXISTS users_last_seen_idx
  ON neuro.users(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS neuro.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES neuro.users(id) ON DELETE CASCADE,
  selected_model_id text,
  selected_agent_id text,
  model_settings jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(model_settings) = 'object'),
  agent_settings jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(agent_settings) = 'object'),
  response_preferences jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(response_preferences) = 'object'),
  active_promo_code text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neuro.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  conversation_key text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('model', 'agent', 'welcome', 'tool', 'voice')),
  subject_id text,
  title text NOT NULL DEFAULT 'новый диалог',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  retention_days integer NOT NULL DEFAULT 30 CHECK (retention_days BETWEEN 0 AND 3650),
  latest_message_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS conversations_user_recent_idx
  ON neuro.conversations(user_id, latest_message_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS conversations_expiry_idx
  ON neuro.conversations(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS neuro.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES neuro.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 200000),
  telegram_message_id bigint,
  model_id text,
  provider text,
  provider_model_id text,
  input_tokens integer CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens integer CHECK (output_tokens IS NULL OR output_tokens >= 0),
  metacoins_charged integer NOT NULL DEFAULT 0 CHECK (metacoins_charged >= 0),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'streaming', 'completed', 'failed', 'deleted')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON neuro.messages(conversation_id, created_at, id)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS messages_user_created_idx
  ON neuro.messages(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS neuro.generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES neuro.conversations(id) ON DELETE SET NULL,
  request_key text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('text', 'image', 'video', 'audio', 'music', 'voice', 'document', '3d', 'tool', 'agent')),
  subject_id text NOT NULL,
  provider text,
  provider_model_id text,
  provider_request_id text,
  prompt text NOT NULL DEFAULT '',
  negative_prompt text,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(parameters) = 'object'),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled', 'expired')),
  metacoins_quoted integer NOT NULL DEFAULT 0 CHECK (metacoins_quoted >= 0),
  metacoins_charged integer NOT NULL DEFAULT 0 CHECK (metacoins_charged >= 0),
  provider_cost_usd numeric(14, 6) CHECK (provider_cost_usd IS NULL OR provider_cost_usd >= 0),
  output_text text,
  error_code text,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generations_user_recent_idx
  ON neuro.generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS generations_conversation_idx
  ON neuro.generations(conversation_id, created_at DESC)
  WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS generations_status_idx
  ON neuro.generations(status, created_at)
  WHERE status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS generations_expiry_idx
  ON neuro.generations(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS neuro.generation_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES neuro.generations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  asset_kind text NOT NULL CHECK (asset_kind IN ('input', 'output', 'preview', 'thumbnail')),
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document', 'archive', '3d')),
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  byte_size bigint CHECK (byte_size IS NULL OR byte_size >= 0),
  width integer CHECK (width IS NULL OR width > 0),
  height integer CHECK (height IS NULL OR height > 0),
  duration_ms integer CHECK (duration_ms IS NULL OR duration_ms >= 0),
  sha256 text,
  telegram_file_id text,
  provider_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS generation_assets_generation_idx
  ON neuro.generation_assets(generation_id, created_at);
CREATE INDEX IF NOT EXISTS generation_assets_user_recent_idx
  ON neuro.generation_assets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS generation_assets_expiry_idx
  ON neuro.generation_assets(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS neuro.metacoin_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL UNIQUE,
  delta integer NOT NULL CHECK (delta <> 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  source text NOT NULL CHECK (source IN ('purchase', 'subscription', 'generation', 'promo', 'referral', 'refund', 'admin', 'expiry')),
  reference_type text,
  reference_id text,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS metacoin_ledger_user_created_idx
  ON neuro.metacoin_ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS neuro.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  payment_id text NOT NULL UNIQUE,
  provider text NOT NULL,
  product_type text NOT NULL CHECK (product_type IN ('metacoins', 'subscription')),
  product_id text NOT NULL,
  amount_kopecks integer NOT NULL CHECK (amount_kopecks > 0),
  currency text NOT NULL DEFAULT 'RUB',
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'cancelled', 'refunded', 'partially_refunded')),
  base_metacoins integer NOT NULL DEFAULT 0 CHECK (base_metacoins >= 0),
  bonus_metacoins integer NOT NULL DEFAULT 0 CHECK (bonus_metacoins >= 0),
  provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(provider_payload) = 'object'),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_user_created_idx
  ON neuro.payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_status_idx
  ON neuro.payments(status, created_at);

CREATE TABLE IF NOT EXISTS neuro.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  source_payment_id uuid REFERENCES neuro.payments(id) ON DELETE SET NULL,
  price_kopecks integer NOT NULL DEFAULT 0 CHECK (price_kopecks >= 0),
  metacoins_total integer NOT NULL DEFAULT 0 CHECK (metacoins_total >= 0),
  metacoins_remaining integer NOT NULL DEFAULT 0 CHECK (metacoins_remaining >= 0),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx
  ON neuro.subscriptions(user_id, status, expires_at DESC);

CREATE TABLE IF NOT EXISTS neuro.promo_codes (
  code text PRIMARY KEY,
  reward_type text NOT NULL CHECK (reward_type IN ('metacoins', 'discount_percent', 'subscription', 'feature')),
  reward_value integer NOT NULL CHECK (reward_value > 0),
  max_uses integer NOT NULL CHECK (max_uses > 0),
  uses integer NOT NULL DEFAULT 0 CHECK (uses BETWEEN 0 AND max_uses),
  per_user_limit integer NOT NULL DEFAULT 1 CHECK (per_user_limit > 0),
  applicable_product_ids text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_by text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_codes_active_expiry_idx
  ON neuro.promo_codes(active, expires_at);

CREATE TABLE IF NOT EXISTS neuro.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code text NOT NULL REFERENCES neuro.promo_codes(code) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES neuro.payments(id) ON DELETE SET NULL,
  reward_applied integer NOT NULL CHECK (reward_applied >= 0),
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('reserved', 'applied', 'cancelled', 'reversed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promo_code, user_id)
);

CREATE INDEX IF NOT EXISTS promo_redemptions_user_idx
  ON neuro.promo_redemptions(user_id, redeemed_at DESC);

CREATE TABLE IF NOT EXISTS neuro.referral_relations (
  referred_user_id uuid PRIMARY KEY REFERENCES neuro.users(id) ON DELETE CASCADE,
  referrer_user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'blocked')),
  referred_at timestamptz NOT NULL DEFAULT now(),
  CHECK (referred_user_id <> referrer_user_id)
);

CREATE INDEX IF NOT EXISTS referral_relations_referrer_idx
  ON neuro.referral_relations(referrer_user_id, referred_at DESC);

CREATE TABLE IF NOT EXISTS neuro.referral_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  referred_user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  payment_id uuid NOT NULL UNIQUE REFERENCES neuro.payments(id) ON DELETE RESTRICT,
  amount_kopecks integer NOT NULL CHECK (amount_kopecks >= 0),
  percent integer NOT NULL CHECK (percent BETWEEN 0 AND 100),
  status text NOT NULL CHECK (status IN ('pending', 'available', 'paid', 'reversed')),
  available_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_earnings_referrer_idx
  ON neuro.referral_earnings(referrer_user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS neuro.referral_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  amount_kopecks integer NOT NULL CHECK (amount_kopecks > 0),
  destination_encrypted bytea NOT NULL,
  destination_hint text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'rejected', 'cancelled')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_withdrawals_user_idx
  ON neuro.referral_withdrawals(user_id, status, requested_at DESC);

CREATE TABLE IF NOT EXISTS neuro.voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_voice_id text,
  display_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'processing', 'ready', 'failed', 'deleted')),
  consent_version text NOT NULL,
  consent_confirmed_at timestamptz NOT NULL,
  encrypted_profile bytea,
  sample_bucket text,
  sample_path text,
  sample_hmac text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS voice_profiles_user_idx
  ON neuro.voice_profiles(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS neuro.product_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  category text NOT NULL,
  telegram_user_id bigint NOT NULL CHECK (telegram_user_id > 0),
  telegram_chat_id bigint,
  telegram_update_id bigint,
  telegram_message_id bigint,
  request_key text,
  conversation_key text,
  subject_type text,
  subject_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_events_user_time_idx
  ON neuro.product_events(telegram_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS product_events_name_time_idx
  ON neuro.product_events(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS product_events_request_idx
  ON neuro.product_events(request_key)
  WHERE request_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS product_events_expiry_idx
  ON neuro.product_events(occurred_at);

CREATE TABLE IF NOT EXISTS neuro.telegram_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_update_id bigint NOT NULL UNIQUE,
  telegram_user_id bigint CHECK (telegram_user_id IS NULL OR telegram_user_id > 0),
  telegram_chat_id bigint,
  telegram_message_id bigint,
  update_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_status text NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received', 'processing', 'completed', 'failed', 'ignored')),
  error_code text,
  error_message text,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '180 days',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telegram_updates_update_id_idx
  ON neuro.telegram_updates(telegram_update_id DESC);
CREATE INDEX IF NOT EXISTS telegram_updates_user_time_idx
  ON neuro.telegram_updates(telegram_user_id, received_at DESC)
  WHERE telegram_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS telegram_updates_expiry_idx
  ON neuro.telegram_updates(expires_at);

CREATE TABLE IF NOT EXISTS neuro.telegram_api_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_key text NOT NULL UNIQUE,
  method text NOT NULL,
  telegram_user_id bigint CHECK (telegram_user_id IS NULL OR telegram_user_id > 0),
  telegram_chat_id bigint,
  telegram_message_id bigint,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(request_payload) = 'object'),
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(response_payload) = 'object'),
  http_status integer CHECK (http_status IS NULL OR http_status BETWEEN 100 AND 599),
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'succeeded', 'failed', 'cancelled')),
  telegram_error_code integer,
  error_message text,
  duration_ms integer CHECK (duration_ms IS NULL OR duration_ms >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '180 days'
);

CREATE INDEX IF NOT EXISTS telegram_api_calls_request_key_idx
  ON neuro.telegram_api_calls(request_key);
CREATE INDEX IF NOT EXISTS telegram_api_calls_chat_time_idx
  ON neuro.telegram_api_calls(telegram_chat_id, started_at DESC);
CREATE INDEX IF NOT EXISTS telegram_api_calls_expiry_idx
  ON neuro.telegram_api_calls(expires_at);

CREATE TABLE IF NOT EXISTS neuro.provider_api_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_key text NOT NULL UNIQUE,
  generation_id uuid REFERENCES neuro.generations(id) ON DELETE SET NULL,
  telegram_user_id bigint CHECK (telegram_user_id IS NULL OR telegram_user_id > 0),
  provider text NOT NULL,
  operation text NOT NULL,
  endpoint_host text NOT NULL,
  endpoint_path text NOT NULL,
  provider_request_id text,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(request_payload) = 'object'),
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(response_payload) = 'object'),
  http_status integer CHECK (http_status IS NULL OR http_status BETWEEN 100 AND 599),
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'succeeded', 'failed', 'cancelled', 'timeout')),
  error_code text,
  error_message text,
  input_tokens integer CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens integer CHECK (output_tokens IS NULL OR output_tokens >= 0),
  provider_cost_usd numeric(14, 6) CHECK (provider_cost_usd IS NULL OR provider_cost_usd >= 0),
  duration_ms integer CHECK (duration_ms IS NULL OR duration_ms >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '180 days'
);

CREATE INDEX IF NOT EXISTS provider_api_calls_generation_idx
  ON neuro.provider_api_calls(generation_id, started_at)
  WHERE generation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS provider_api_calls_provider_time_idx
  ON neuro.provider_api_calls(provider, started_at DESC);
CREATE INDEX IF NOT EXISTS provider_api_calls_expiry_idx
  ON neuro.provider_api_calls(expires_at);

CREATE TABLE IF NOT EXISTS neuro.provider_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text,
  event_type text NOT NULL,
  signature_valid boolean,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  processing_status text NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received', 'processed', 'failed', 'ignored')),
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '180 days',
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS provider_webhooks_provider_time_idx
  ON neuro.provider_webhooks(provider, received_at DESC);
CREATE INDEX IF NOT EXISTS provider_webhooks_expiry_idx
  ON neuro.provider_webhooks(expires_at);

CREATE TABLE IF NOT EXISTS neuro.delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid REFERENCES neuro.generations(id) ON DELETE SET NULL,
  telegram_api_call_id uuid REFERENCES neuro.telegram_api_calls(id) ON DELETE SET NULL,
  telegram_user_id bigint CHECK (telegram_user_id IS NULL OR telegram_user_id > 0),
  telegram_chat_id bigint NOT NULL,
  delivery_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'succeeded', 'failed', 'cancelled')),
  attempt_number integer NOT NULL DEFAULT 1 CHECK (attempt_number > 0),
  error_code text,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_attempts_generation_idx
  ON neuro.delivery_attempts(generation_id, attempted_at DESC)
  WHERE generation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS delivery_attempts_chat_time_idx
  ON neuro.delivery_attempts(telegram_chat_id, attempted_at DESC);

CREATE TABLE IF NOT EXISTS neuro.system_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_key text NOT NULL UNIQUE,
  job_type text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  result jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(result) = 'object'),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  error_message text,
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS system_jobs_status_schedule_idx
  ON neuro.system_jobs(status, scheduled_at)
  WHERE status IN ('queued', 'running');

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('neuro-inputs', 'neuro-inputs', false, 524288000),
  ('neuro-outputs', 'neuro-outputs', false, 1073741824),
  ('neuro-voice-samples', 'neuro-voice-samples', false, 524288000)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit;

CREATE OR REPLACE FUNCTION neuro.purge_expired_history(
  event_retention_days integer DEFAULT 180
)
RETURNS TABLE (
  conversations_deleted bigint,
  generations_deleted bigint,
  events_deleted bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  removed_conversations bigint;
  removed_generations bigint;
  removed_events bigint;
BEGIN
  DELETE FROM neuro.conversations
  WHERE expires_at IS NOT NULL AND expires_at <= now();
  GET DIAGNOSTICS removed_conversations = ROW_COUNT;

  DELETE FROM neuro.generations
  WHERE expires_at IS NOT NULL AND expires_at <= now();
  GET DIAGNOSTICS removed_generations = ROW_COUNT;

  DELETE FROM neuro.product_events
  WHERE occurred_at < now() - make_interval(days => greatest(event_retention_days, 1));
  GET DIAGNOSTICS removed_events = ROW_COUNT;

  DELETE FROM neuro.telegram_updates WHERE expires_at <= now();
  DELETE FROM neuro.telegram_api_calls WHERE expires_at <= now();
  DELETE FROM neuro.provider_api_calls WHERE expires_at <= now();
  DELETE FROM neuro.provider_webhooks WHERE expires_at <= now();

  RETURN QUERY SELECT removed_conversations, removed_generations, removed_events;
END;
$$;

ALTER TABLE neuro.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.generation_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.metacoin_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.referral_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.product_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.telegram_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.telegram_api_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.provider_api_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.provider_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.system_jobs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA neuro FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA neuro FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA neuro FROM anon, authenticated;
GRANT USAGE ON SCHEMA neuro TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA neuro TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA neuro TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA neuro
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA neuro
  GRANT ALL ON TABLES TO service_role;

COMMIT;
