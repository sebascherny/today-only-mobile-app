import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Switch, Platform } from "react-native";
import { initDb } from "./db";
import { deleteNonTodayRows, loadToday, saveToday } from "./storage";
import { todayKey } from "./date";
import { SafeAreaView } from "react-native-safe-area-context";
import { normalizeStreakOnStart, recordTodayCompleted } from "./streak";
import { getNotificationPrefs, setNotificationPrefs, syncDailyReminderFromPrefs } from "./notifications";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";


type DayState = {
  goal: string;
  steps: [string, string, string];
  done: [boolean, boolean, boolean];
  dayCompleted: boolean;
  streak: number;
};

export default function App() {
  console.log("Starting App")
  const [screen, setScreen] = useState<"today" | "done" | "settings">("today");

  const [state, setState] = useState<DayState>({
    goal: "",
    steps: ["", "", ""],
    done: [false, false, false],
    dayCompleted: false,
    streak: 0,
  });
  console.log(state);

  useEffect(() => {
    (async () => {
      await initDb();
      await syncDailyReminderFromPrefs();
      // await deleteNonTodayRows();
      const streak = await normalizeStreakOnStart();

      const stored = await loadToday();
      if (stored) {
        setState({
          goal: stored.goal,
          steps: stored.steps,
          done: stored.done,
          dayCompleted: stored.completed,
          streak,
        });
        setScreen(stored.completed ? "done" : "today");
      } else {
        setState({
          goal: "",
          steps: ["", "", ""],
          done: [false, false, false],
          dayCompleted: false,
          streak,
        });
      }
    })();
  }, []);
  console.log("AA", state);

  if (!state) return null;

  useEffect(() => {
    if (!state) return;

    // Don't block UI on disk writes
    saveToday({
      date: todayKey(),
      goal: state.goal,
      steps: state.steps,
      done: state.done,
      completed: state.dayCompleted,
    }).catch(console.error);
  }, [state]);

  const canComplete = useMemo(() => {
    if (!state.goal.trim()) return false;
    // allow completing even with no steps; otherwise require at least one checked step
    const anyStepsFilled = state.steps.some((s) => s.trim().length > 0);
    const anyChecked = state.done.some((d) => d);
    return !anyStepsFilled || anyChecked;
  }, [state.goal, state.steps, state.done]);

  if (screen === "settings") {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Settings" onBack={() => setScreen("today")} />
        <SettingsScreen />
      </SafeAreaView>
    );
  }

  if (screen === "done") {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Today Only" onSettings={() => setScreen("settings")} />
        <DoneScreen
          streak={state.streak}
          onStartTomorrow={() => {
            // demo-only reset (later: automatic daily reset)
            setState((s) => ({
              ...s,
              goal: "",
              steps: ["", "", ""],
              done: [false, false, false],
              dayCompleted: false,
            }));
            setScreen("today");
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Today Only" onSettings={() => setScreen("settings")} />
      <TodayScreen
        state={state}
        setState={setState}
        canComplete={canComplete}
        onComplete={async () => {
          const nextStreak = await recordTodayCompleted();

          setState((s) =>
            s
              ? { ...s, dayCompleted: true, streak: nextStreak }
              : s
          );

          setScreen("done");
        }}
      />
    </SafeAreaView>
  );
}

function Header({
  title,
  onSettings,
  onBack,
}: {
  title: string;
  onSettings?: () => void;
  onBack?: () => void;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}

      <Text style={styles.headerTitle}>{title}</Text>

      {onSettings ? (
        <Pressable onPress={onSettings} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>⚙</Text>
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );
}

function TodayScreen({
  state,
  setState,
  canComplete,
  onComplete,
}: {
  state: DayState;
  setState: React.Dispatch<React.SetStateAction<DayState>>;
  canComplete: boolean;
  onComplete: () => void;
}) {
  return (
    <View style={styles.body}>
      <Text style={styles.subtitle}>Pick ONE meaningful goal for today. No lists. No tomorrow.</Text>

      <Text style={styles.label}>Today's goal</Text>
      <TextInput
        value={state.goal}
        onChangeText={(t) => setState((s) => ({ ...s, goal: t }))}
        placeholder="e.g., Finish the report draft"
        style={styles.input}
      />

      <View style={{ height: 12 }} />

      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.stepRow}>
          <Pressable
            onPress={() =>
              setState((s) => {
                if (!s.steps[i].trim()) return s;
                const done = [...s.done] as DayState["done"];
                done[i] = !done[i];
                return { ...s, done };
              })
            }
            style={[
              styles.checkbox,
              state.done[i] ? styles.checkboxChecked : null,
              !state.steps[i].trim() ? styles.checkboxDisabled : null,
            ]}
          >
            <Text style={styles.checkboxText}>{state.done[i] ? "✓" : ""}</Text>
          </Pressable>

          <TextInput
            value={state.steps[i]}
            onChangeText={(t) =>
              setState((s) => {
                const steps = [...s.steps] as DayState["steps"];
                const done = [...s.done] as DayState["done"];
                steps[i] = t;
                if (!t.trim()) done[i] = false;
                return { ...s, steps, done };
              })
            }
            placeholder={`Step ${i + 1} (optional)`}
            style={[styles.input, { flex: 1 }]}
          />
        </View>
      ))}

      <View style={{ height: 18 }} />

      <Pressable onPress={onComplete} disabled={!canComplete} style={[styles.primaryBtn, !canComplete && styles.primaryBtnDisabled]}>
        <Text style={styles.primaryBtnText}>Complete today</Text>
      </Pressable>

      <Text style={styles.tip}>Tip: keep steps tiny. Momentum beats ambition.</Text>
    </View>
  );
}

function DoneScreen({ streak, onStartTomorrow }: { streak: number; onStartTomorrow: () => void }) {
  return (
    <View style={[styles.body, { justifyContent: "center", alignItems: "center" }]}>
      <Text style={styles.doneTitle}>Done for today ✅</Text>
      <Text style={styles.doneSub}>Streak: {streak}</Text>
      <View style={{ height: 18 }} />
      <Pressable onPress={onStartTomorrow} style={styles.secondaryBtn}>
        <Text style={styles.secondaryBtnText}>Start tomorrow (demo reset)</Text>
      </Pressable>
    </View>
  );
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function SettingsScreen() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);

  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getNotificationPrefs();
      setEnabled(p.enabled);
      setHour(p.hour);
      setMinute(p.minute);
    })();
  }, []);

  async function persistAndSync(next: { enabled: boolean; hour: number; minute: number }) {
    await setNotificationPrefs(next);
    await syncDailyReminderFromPrefs();
  }

  const timeLabel = `${pad2(hour)}:${pad2(minute)}`;

  const pickerValue = new Date();
  pickerValue.setHours(hour, minute, 0, 0);

  const onTimeChange = async (event: DateTimePickerEvent, date?: Date) => {
    // Android fires "dismissed" when user cancels
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "dismissed" || !date) return;

    const nextHour = date.getHours();
    const nextMinute = date.getMinutes();

    setHour(nextHour);
    setMinute(nextMinute);

    await persistAndSync({ enabled, hour: nextHour, minute: nextMinute });
  };

  return (
    <View style={styles.body}>
      <Text style={styles.label}>Notifications</Text>

      <View style={styles.settingsRow}>
        <Text style={styles.settingsText}>Daily reminder</Text>
        <Pressable
          onPress={async () => {
            const nextEnabled = !enabled;
            setEnabled(nextEnabled);
            await persistAndSync({ enabled: nextEnabled, hour, minute });
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            backgroundColor: enabled ? "#9BF6FF" : "#141420",
          }}
        >
          <Text style={{ color: enabled ? "#0B0B0F" : "white", fontWeight: "800" }}>
            {enabled ? "ON" : "OFF"}
          </Text>
        </Pressable>
      </View>

      <View style={{ height: 10 }} />

      <View style={styles.settingsRow}>
        <Text style={styles.settingsText}>Reminder time</Text>

        <Pressable
          onPress={() => setShowPicker(true)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: "#141420",
            opacity: enabled ? 1 : 0.4,
          }}
          disabled={!enabled}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>{timeLabel}</Text>
        </Pressable>
      </View>

      {showPicker && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          is24Hour={true}
          onChange={onTimeChange}
        />
      )}

      <Text style={styles.tip}>
        When enabled, the reminder repeats daily at the selected time.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0F" },
  header: { height: 56, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "700" },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerBtnText: { color: "white", fontSize: 18 },

  body: { flex: 1, padding: 16 },
  subtitle: { color: "#B9B9C2", marginBottom: 12, fontSize: 14, lineHeight: 18 },

  label: { color: "white", fontSize: 13, marginBottom: 6, fontWeight: "600" },
  input: { backgroundColor: "#141420", color: "white", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },

  stepRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },

  checkbox: {
    width: 28, height: 28, borderRadius: 8,
    borderWidth: 2, borderColor: "#3A3A4A",
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { borderColor: "#9BF6FF" },
  checkboxDisabled: { opacity: 0.35 },
  checkboxText: { color: "white", fontWeight: "900" },

  primaryBtn: { backgroundColor: "#9BF6FF", paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  primaryBtnDisabled: { opacity: 0.35 },
  primaryBtnText: { color: "#0B0B0F", fontWeight: "800", fontSize: 16 },

  secondaryBtn: { backgroundColor: "#141420", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14 },
  secondaryBtnText: { color: "white", fontWeight: "700" },

  tip: { color: "#8A8A98", marginTop: 12, fontSize: 12, lineHeight: 16 },

  doneTitle: { color: "white", fontSize: 22, fontWeight: "800" },
  doneSub: { color: "#B9B9C2", marginTop: 8, fontSize: 16 },

  settingsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  settingsText: { color: "white", fontSize: 14 },
});
