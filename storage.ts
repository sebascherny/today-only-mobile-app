import { dbPromise } from "./db";
import { todayKey } from "./date";

export type StoredDay = {
  date: string;
  goal: string;
  steps: [string, string, string];
  done: [boolean, boolean, boolean];
  completed: boolean;
};

export async function loadToday(): Promise<StoredDay | null> {
  const db = await dbPromise;

  const row = await db.getFirstAsync<any>(
    `SELECT * FROM day_state WHERE date = ?`,
    [todayKey()]
  );

  if (!row) return null;

  return {
    date: row.date,
    goal: row.goal,
    steps: [row.step1 ?? "", row.step2 ?? "", row.step3 ?? ""],
    done: [!!row.done1, !!row.done2, !!row.done3],
    completed: !!row.completed,
  };
}

export async function saveToday(day: StoredDay) {
  const db = await dbPromise;

  await db.runAsync(
    `
    INSERT OR REPLACE INTO day_state
    (date, goal, step1, step2, step3, done1, done2, done3, completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      day.date,
      day.goal,
      day.steps[0],
      day.steps[1],
      day.steps[2],
      day.done[0] ? 1 : 0,
      day.done[1] ? 1 : 0,
      day.done[2] ? 1 : 0,
      day.completed ? 1 : 0,
    ]
  );
}

export async function deleteNonTodayRows() {
  return;
  const db = await dbPromise;
  await db.runAsync(`DELETE FROM day_state WHERE date != ?`, [todayKey()]);
}
