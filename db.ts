import * as SQLite from "expo-sqlite";

export const dbPromise = SQLite.openDatabaseAsync("today_only.db");

export async function initDb() {
  const db = await dbPromise;

  // execAsync is good for bulk SQL (no params)
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS day_state (
      date TEXT PRIMARY KEY,
      goal TEXT NOT NULL,
      step1 TEXT,
      step2 TEXT,
      step3 TEXT,
      done1 INTEGER,
      done2 INTEGER,
      done3 INTEGER,
      completed INTEGER
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}
