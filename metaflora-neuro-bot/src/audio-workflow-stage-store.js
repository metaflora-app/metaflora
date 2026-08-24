import { deserialize, serialize } from 'node:v8';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const validKey = (value) => {
  const key = String(value ?? '');
  if (!key || key.length > 700 || /[\u0000-\u001f]/u.test(key)) {
    throw new TypeError('Invalid audio workflow stage key.');
  }
  return key;
};

export class DurableAudioWorkflowStageStore {
  #database;
  #pending = new Map();

  constructor(databasePath) {
    this.#database = new DatabaseSync(databasePath);
    this.#database.exec(`
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS audio_workflow_stages (
        stage_key TEXT PRIMARY KEY,
        result BLOB,
        completed_at TEXT,
        lease_token TEXT,
        lease_until TEXT,
        external_started INTEGER NOT NULL DEFAULT 0,
        outcome_unknown INTEGER NOT NULL DEFAULT 0
      );
    `);
    const columns = new Set(this.#database.prepare('PRAGMA table_info(audio_workflow_stages)').all()
      .map(({ name }) => name));
    if (!columns.has('external_started')) {
      this.#database.exec('ALTER TABLE audio_workflow_stages ADD COLUMN external_started INTEGER NOT NULL DEFAULT 0;');
    }
    if (!columns.has('outcome_unknown')) {
      this.#database.exec('ALTER TABLE audio_workflow_stages ADD COLUMN outcome_unknown INTEGER NOT NULL DEFAULT 0;');
    }
  }

  close() {
    this.#database.close();
  }

  async get(keyValue) {
    const row = this.#database.prepare(
      'SELECT result FROM audio_workflow_stages WHERE stage_key = ?'
    ).get(validKey(keyValue));
    return row?.result ? deserialize(Buffer.from(row.result)) : undefined;
  }

  async run(keyValue, operation) {
    const key = validKey(keyValue);
    const stored = await this.get(key);
    if (stored !== undefined) return stored;
    if (this.#pending.has(key)) return this.#pending.get(key);
    const token = randomUUID();
    const task = Promise.resolve().then(async () => {
      const now = new Date();
      const leaseUntil = new Date(now.valueOf() + 5 * 60_000).toISOString();
      this.#database.exec('BEGIN IMMEDIATE');
      let claimed = false;
      try {
        this.#database.prepare(`
          INSERT INTO audio_workflow_stages (stage_key, lease_token, lease_until)
          VALUES (?, ?, ?)
          ON CONFLICT(stage_key) DO UPDATE SET lease_token = excluded.lease_token,
            lease_until = excluded.lease_until
          WHERE audio_workflow_stages.result IS NULL
            AND (audio_workflow_stages.lease_until IS NULL OR audio_workflow_stages.lease_until <= ?)
        `).run(key, token, leaseUntil, now.toISOString());
        const row = this.#database.prepare(
          'SELECT result, lease_token, outcome_unknown FROM audio_workflow_stages WHERE stage_key = ?'
        ).get(key);
        if (row?.outcome_unknown) throw new Error('manual_reconcile: external outcome is unknown.');
        claimed = row?.lease_token === token;
        this.#database.exec('COMMIT');
        if (row?.result) return deserialize(Buffer.from(row.result));
      } catch (error) {
        this.#database.exec('ROLLBACK');
        throw error;
      }
      if (!claimed) {
        throw new Error('Audio workflow stage is already running.');
      }
      let externalStarted = false;
      const markExternalStarted = () => {
        externalStarted = true;
        this.#database.prepare(`
          UPDATE audio_workflow_stages SET external_started = 1
          WHERE stage_key = ? AND lease_token = ?
        `).run(key, token);
      };
      let result;
      try {
        result = await operation(Object.freeze({ markExternalStarted }));
      } catch (error) {
        if (externalStarted) {
          this.#database.prepare(`
            UPDATE audio_workflow_stages
            SET outcome_unknown = 1, lease_token = NULL, lease_until = NULL
            WHERE stage_key = ? AND lease_token = ?
          `).run(key, token);
          throw new Error('outcome_unknown: manual reconciliation required.', { cause: error });
        }
        throw error;
      }
      const stored = this.#database.prepare(`
        UPDATE audio_workflow_stages
        SET result = ?, completed_at = ?, lease_token = NULL, lease_until = NULL
        WHERE stage_key = ? AND lease_token = ?
      `).run(serialize(result), new Date().toISOString(), key, token);
      if (stored.changes !== 1) throw new Error('Audio workflow stage lease was lost.');
      return result;
    }).then((result) => {
      this.#pending.delete(key);
      return result;
    }).catch((error) => {
      try {
        this.#database.prepare(`
          UPDATE audio_workflow_stages SET lease_token = NULL, lease_until = NULL
          WHERE stage_key = ? AND lease_token = ? AND result IS NULL
        `).run(key, token);
      } catch {
        // Preserve the original workflow error.
      }
      this.#pending.delete(key);
      throw error;
    });
    this.#pending.set(key, task);
    return task;
  }
}
