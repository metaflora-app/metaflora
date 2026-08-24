import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export class StateStore {
  constructor(directory) {
    this.directory = directory;
    this.file = path.join(directory, "funding-operations.json");
    this.state = Object.create(null);
    this.writeQueue = Promise.resolve();
  }
  async load() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    try { this.state = JSON.parse(await readFile(this.file, "utf8")); } catch { this.state = Object.create(null); }
  }
  get(key) { return this.state[key] ?? null; }
  async set(key, value) {
    const operation = this.writeQueue.then(async () => {
      const next = { ...this.state, [key]: value };
      const temporary = `${this.file}.${process.pid}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(next), { mode: 0o600 });
      await rename(temporary, this.file);
      this.state = next;
    });
    this.writeQueue = operation.catch(() => undefined);
    return operation;
  }
}
