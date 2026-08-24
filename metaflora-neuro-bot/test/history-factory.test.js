import test from 'node:test';
import assert from 'node:assert/strict';

import { createHistoryRepository } from '../src/history-factory.js';
import {
  NullHistoryRepository,
  PostgresHistoryRepository
} from '../src/history-repository.js';
import { SupabaseHistoryRepository } from '../src/supabase-history-repository.js';

test('history factory keeps Supabase optional for local and test runtime', () => {
  assert.equal(
    createHistoryRepository({ enabled: false, databaseUrl: '', schema: 'neuro' }) instanceof NullHistoryRepository,
    true
  );
});

test('history factory builds a bounded PostgreSQL pool for the separate project', async () => {
  const seen = [];
  class PoolDouble {
    constructor(options) {
      seen.push(options);
    }
    async query() {
      return { rows: [] };
    }
    async end() {}
  }

  const repository = createHistoryRepository({
    enabled: true,
    databaseUrl: 'postgresql://postgres:password@db.example.supabase.co:5432/postgres?sslmode=require',
    schema: 'neuro'
  }, { PoolClass: PoolDouble });

  assert.equal(repository instanceof PostgresHistoryRepository, true);
  assert.equal(seen[0].max, 5);
  assert.equal(seen[0].connectionString.includes('db.example.supabase.co'), true);
  await repository.close();
});

test('history factory uses Supabase REST when a database password is not configured', () => {
  let options;
  const client = {
    schema() {
      return {};
    }
  };
  const repository = createHistoryRepository({
    enabled: true,
    databaseUrl: '',
    storageUrl: 'https://project.supabase.co',
    serviceRoleKey: 'service-role-secret',
    schema: 'neuro'
  }, {
    createSupabaseClient(url, key, receivedOptions) {
      assert.equal(url, 'https://project.supabase.co');
      assert.equal(key, 'service-role-secret');
      options = receivedOptions;
      return client;
    }
  });

  assert.equal(repository instanceof SupabaseHistoryRepository, true);
  assert.equal(options.auth.persistSession, false);
});
