import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("db.sqlite3");

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
