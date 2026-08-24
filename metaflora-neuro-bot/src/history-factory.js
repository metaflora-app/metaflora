import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

import {
  NullHistoryRepository,
  PostgresHistoryRepository
} from './history-repository.js';
import { SupabaseHistoryRepository } from './supabase-history-repository.js';

const { Pool } = pg;

function databaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError('SUPABASE_DATABASE_URL is invalid.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) {
    throw new TypeError('SUPABASE_DATABASE_URL must be a PostgreSQL URL.');
  }
  return url.toString();
}

export function createHistoryRepository(config, {
  PoolClass = Pool,
  createSupabaseClient = createClient
} = {}) {
  if (!config?.enabled) return new NullHistoryRepository();
  if (!config.databaseUrl) {
    if (!config.storageUrl || !config.serviceRoleKey) {
      throw new Error('Supabase URL and service role key are required for REST history storage.');
    }
    return new SupabaseHistoryRepository({
      client: createSupabaseClient(config.storageUrl, config.serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }),
      schema: config.schema
    });
  }
  const pool = new PoolClass({
    connectionString: databaseUrl(config.databaseUrl),
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    query_timeout: 15_000,
    statement_timeout: 15_000,
    application_name: 'metaflora-neuro-bot'
  });
  return new PostgresHistoryRepository({
    pool,
    schema: config.schema
  });
}
