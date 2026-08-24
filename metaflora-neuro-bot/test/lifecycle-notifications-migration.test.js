import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/202607270008_lifecycle_notifications.sql', import.meta.url),
  'utf8'
);

test('lifecycle notification migration creates a durable, idempotent outbox', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS neuro\.lifecycle_notifications/i);
  assert.match(migration, /notification_key text NOT NULL UNIQUE/i);
  assert.match(migration, /payment_abandoned_20m/i);
  assert.match(migration, /newcomer_after_24h/i);
  assert.match(migration, /FOR UPDATE SKIP LOCKED/i);
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.schedule_payment_abandonment_reminders/i);
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.claim_due_lifecycle_notifications/i);
});

test('newcomer eligibility is derived from Supabase state before delivery', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION neuro\.get_newcomer_reminder_eligibility/i);
  assert.match(migration, /product_type = 'subscription'/i);
  assert.match(migration, /selected_model_id IS NOT NULL/i);
  assert.match(migration, /FROM neuro\.generations/i);
});

test('new lifecycle data follows the bot schema security policy', () => {
  assert.match(migration, /ALTER TABLE neuro\.lifecycle_notifications DISABLE ROW LEVEL SECURITY/i);
  assert.match(migration, /REVOKE ALL ON FUNCTION neuro\.claim_due_lifecycle_notifications/i);
  assert.match(migration, /GRANT EXECUTE[\s\S]*TO service_role/i);
});
