import sqlite3 from "better-sqlite3";
import type { SpanshDumpPPData } from "../SpanshAPI";

export const db = sqlite3("db.sqlite3");

// Setup the database
db.exec("CREATE TABLE IF NOT EXISTS shortlinks (short TEXT PRIMARY KEY, long TEXT)");
db.exec(
  "CREATE TABLE IF NOT EXISTS snipe_history (id INTEGER PRIMARY KEY, system TEXT, type TEXT, power TEXT, amount INTEGER, old_dump TEXT, new_dump TEXT)",
);
db.exec("CREATE TABLE IF NOT EXISTS cycle_stats (id INTEGER PRIMARY KEY, timestamp TEXT, snapshot TEXT)");

export async function dbGet<T>(sql: string, ...params: unknown[]): Promise<T | undefined> {
  return db.prepare<unknown[], T>(sql).get(...params);
}

export async function dbGetAll<T>(sql: string, ...params: unknown[]): Promise<T[]> {
  return db.prepare<unknown[], T>(sql).all(...params);
}

export async function logSnipe(
  system: string,
  type: string,
  power: string,
  amount: number,
  old_dump: SpanshDumpPPData | null,
  new_dump: SpanshDumpPPData,
) {
  db.prepare(
    "INSERT INTO snipe_history (system, type, power, amount, old_dump, new_dump) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(system, type, power, amount, JSON.stringify(old_dump), JSON.stringify(new_dump));
}
