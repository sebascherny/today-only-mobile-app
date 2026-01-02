import { dbPromise } from "./db";

export async function getMeta(key: string): Promise<string | null> {
  const db = await dbPromise;
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = ?`,
    [key]
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await dbPromise;
  await db.runAsync(
    `INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`,
    [key, value]
  );
}
