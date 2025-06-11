import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("../db.sqlite3");

// Setup the database
await new Promise<void>((resolve, reject) => {
  db.exec(
    "CREATE TABLE IF NOT EXISTS snipe_history (id INTEGER PRIMARY KEY, system TEXT, type TEXT, power TEXT, amount INTEGER, old_dump TEXT, new_dump TEXT)",
    (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    },
  );
});

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
