import sqlite3 from "sqlite3";
import { DBFilePath } from "./Constants";
import type { SpanshDumpPPData } from "./SpanshAPI";

export const db = new sqlite3.Database(DBFilePath);

// Setup the database
db.exec("CREATE TABLE IF NOT EXISTS shortlinks (short TEXT, long TEXT)");
db.exec(
  "CREATE TABLE IF NOT EXISTS snipe_history (id INTEGER PRIMARY KEY, system TEXT, type TEXT, power TEXT, amount INTEGER, old_dump TEXT, new_dump TEXT)",
);

/** Wrapper for the db.get function that allows async awaiting for the results. */
export async function dbGet<T>(sql: string, ...params: unknown[]): Promise<T | undefined> {
  return await new Promise<T | undefined>((resolve, reject) => {
    db.get<T | undefined>(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/** Wrapper for the db.all function that allows async awaiting for the results. */
export async function dbGetAll<T>(sql: string, ...params: unknown[]): Promise<T[]> {
  return await new Promise<T[]>((resolve, reject) => {
    db.all<T>(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export async function logSnipe(
  system: string,
  type: string,
  power: string,
  amount: number,
  old_dump: SpanshDumpPPData | null,
  new_dump: SpanshDumpPPData,
) {
  db.run(
    "INSERT INTO snipe_history (system, type, power, amount, old_dump, new_dump) VALUES (?, ?, ?, ?, ?, ?)",
    system,
    type,
    power,
    amount,
    JSON.stringify(old_dump),
    JSON.stringify(new_dump),
  );
}
