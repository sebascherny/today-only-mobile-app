export function todayKey(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function addDays(dateKey: string, delta: number): string {
  const d = new Date(dateKey + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function yesterdayKey(): string {
  return addDays(todayKey(), -1);
}
