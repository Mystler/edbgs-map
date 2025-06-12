import sqlite3 from "sqlite3";
import { DBFilePath } from "./Constants";

export const db = new sqlite3.Database(DBFilePath);

// Setup the database
await new Promise<void>((resolve, reject) => {
  db.exec("CREATE TABLE IF NOT EXISTS shortlinks (short TEXT, long TEXT)", (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
});

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
