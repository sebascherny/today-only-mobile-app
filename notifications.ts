import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getMeta, setMeta } from "./meta";

const META_NOTIF_ENABLED = "notif_enabled";
const META_NOTIF_HOUR = "notif_hour";
const META_NOTIF_MIN = "notif_min";
const META_NOTIF_ID = "notif_id";

const CHANNEL_ID = "daily-reminder";

// Make notifications show even while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;

  // On Android 8+, notifications should use a channel that exists, or they may not show. :contentReference[oaicite:1]{index=1}
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Daily reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function getNotificationPrefs(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  const enabled = (await getMeta(META_NOTIF_ENABLED)) === "1";
  const hour = parseInt((await getMeta(META_NOTIF_HOUR)) ?? "9", 10);
  const minute = parseInt((await getMeta(META_NOTIF_MIN)) ?? "0", 10);
  return { enabled, hour, minute };
}

export async function setNotificationPrefs(p: { enabled: boolean; hour: number; minute: number }) {
  await setMeta(META_NOTIF_ENABLED, p.enabled ? "1" : "0");
  await setMeta(META_NOTIF_HOUR, String(p.hour));
  await setMeta(META_NOTIF_MIN, String(p.minute));
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function cancelDailyReminder() {
  const existingId = await getMeta(META_NOTIF_ID);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
    await setMeta(META_NOTIF_ID, "");
  }
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  await ensureAndroidChannel();

  // If you specify a channelId, it must exist on Android 8+ or the notification may not appear. :contentReference[oaicite:2]{index=2}
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Today Only",
      body: "What’s your ONE meaningful goal today?",
      sound: false,
      ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: { hour, minute, repeats: true, type: Notifications.SchedulableTriggerInputTypes.CALENDAR },
  });

  await setMeta(META_NOTIF_ID, id);
  return id;
}

/**
 * Call on app start:
 * - If enabled: ensure scheduled
 * - If disabled: ensure canceled
 */
export async function syncDailyReminderFromPrefs() {
  const { enabled, hour, minute } = await getNotificationPrefs();

  if (!enabled) {
    await cancelDailyReminder();
    return;
  }

  const ok = await requestNotificationPermission();
  if (!ok) {
    // Permission denied => flip pref off so UI matches reality
    await setNotificationPrefs({ enabled: false, hour, minute });
    await cancelDailyReminder();
    return;
  }

  // Recreate schedule (simple + robust)
  await cancelDailyReminder();
  await scheduleDailyReminder(hour, minute);
}
