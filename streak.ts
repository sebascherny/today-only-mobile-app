import { getMeta, setMeta } from "./meta";
import { todayKey, yesterdayKey } from "./date";

const KEY_STREAK = "streak";
const KEY_LAST_COMPLETED = "lastCompletedDate";

export async function loadStreak(): Promise<number> {
  const v = await getMeta(KEY_STREAK);
  return v ? parseInt(v, 10) || 0 : 0;
}

/**
 * Called on app start to normalize streak if the user missed a day.
 * Rule (strict):
 * - If lastCompletedDate is yesterday or today -> keep streak
 * - Else -> reset to 0
 */
export async function normalizeStreakOnStart(): Promise<number> {
  const last = await getMeta(KEY_LAST_COMPLETED);
  const streak = await loadStreak();

  if (!last) return 0;

  const y = yesterdayKey();
  const t = todayKey();

  if (last === t || last === y) return streak;

  // missed at least one day
  await setMeta(KEY_STREAK, "0");
  return 0;
}

/**
 * Called when user completes today.
 * - If already completed today -> no-op
 * - If lastCompletedDate == yesterday -> streak+1
 * - Else (including null or older) -> streak=1
 * - Set lastCompletedDate=today
 */
export async function recordTodayCompleted(): Promise<number> {
  const last = await getMeta(KEY_LAST_COMPLETED);
  const t = todayKey();
  const y = yesterdayKey();

  if (last === t) {
    return await loadStreak(); // already counted today
  }

  const prev = await loadStreak();
  const next = last === y ? prev + 1 : 1;

  await setMeta(KEY_STREAK, String(next));
  await setMeta(KEY_LAST_COMPLETED, t);

  return next;
}
