import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import { toast } from "react-toastify";
import { Check, Flame, GripVertical, Minus, Pencil, Plus, Trash2, X, Archive, ArchiveRestore } from "lucide-react";

import { plannerApi } from "./api";
import { WEEKDAYS, addDays, fmt, isHit, isScheduledDay, quotaProgress, range, scheduleLabel, targetOf, today } from "./dates";

/* ========================================
   HABITS — check or count habits on any
   schedule: every day, chosen weekdays,
   every N days, or N times a week/month.
========================================= */

const COLORS = ["#2a78d6", "#1baf7a", "#eb6834", "#eda100", "#8b5cf6", "#e5487a", "#0ea5b7", "#64748b"];
const EMOJIS = ["✅", "💧", "🏃", "📚", "🧘", "💪", "🥗", "😴", "✍️", "🧠", "🙏", "🚭", "💊", "🎸", "💻", "🌅"];

const blank = () => ({ name: "", emoji: "✅", color: COLORS[0], kind: "check", target: 1, unit: "", schedule: { type: "daily", days: [1, 2, 3, 4, 5], times: 3, every: 2 }, time: "", area: "", why: "", startDate: today() });

export function HabitEditor({ initial, onClose, onSaved }) {
  const [h, setH] = useState(() => ({ ...blank(), ...initial, schedule: { ...blank().schedule, ...(initial?.schedule || {}) } }));
  const [busy, setBusy] = useState(false);
  const set = (patch) => setH((x) => ({ ...x, ...patch }));
  const setSchedule = (patch) => setH((x) => ({ ...x, schedule: { ...x.schedule, ...patch } }));
  const input = "h-10 w-full rounded-xl border border-border bg-surface px-3 text-small outline-none focus:border-primary";

  const save = async (e) => {
    e.preventDefault();
    if (!h.name.trim()) return toast.error("Name the habit");
    if (h.schedule.type === "weekdays" && !h.schedule.days.length) return toast.error("Pick at least one day");
    const body = {
      name: h.name.trim(),
      emoji: h.emoji,
      color: h.color,
      kind: h.kind,
      target: h.kind === "count" ? Math.max(1, Number(h.target) || 1) : 1,
      unit: h.kind === "count" ? h.unit.trim() : "",
      schedule: { type: h.schedule.type, days: h.schedule.days, times: Number(h.schedule.times) || 1, every: Number(h.schedule.every) || 1 },
      time: h.time,
      area: h.area.trim(),
      why: h.why.trim(),
      startDate: h.startDate,
    };
    setBusy(true);
    try {
      const saved = h._id ? await plannerApi.updateHabit(h._id, body) : await plannerApi.createHabit(body);
      onSaved(saved);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save the habit");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.form initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onSubmit={save} className="max-h-[92dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-3xl border border-border bg-[var(--color-card)] p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-title">{h._id ? "Edit habit" : "New habit"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2">
          <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl border border-border text-xl" style={{ background: `${h.color}22` }}>
            {h.emoji}
          </span>
          <input className={input} value={h.name} onChange={(e) => set({ name: e.target.value })} placeholder="Drink water, Read 20 pages, Gym…" autoFocus />
        </div>
        <div className="flex flex-wrap gap-1">
          {EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => set({ emoji: e })} className={`h-8 w-8 rounded-lg text-base ${h.emoji === e ? "bg-surface ring-1 ring-primary" : "hover:bg-surface"}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => set({ color: c })} className={`h-7 w-7 rounded-full ${h.color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-[var(--color-card)]" : ""}`} style={{ background: c }} aria-label={`Colour ${c}`} />
          ))}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-secondary">Track</p>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
            {[
              ["check", "Done / not done"],
              ["count", "An amount"],
            ].map(([v, l]) => (
              <button key={v} type="button" onClick={() => set({ kind: v })} className={`rounded-lg py-1.5 text-xs ${h.kind === v ? "bg-background font-medium shadow-sm" : "text-muted"}`}>
                {l}
              </button>
            ))}
          </div>
          {h.kind === "count" && (
            <div className="mt-2 flex gap-2">
              <input type="number" min={1} className={`${input} w-24`} value={h.target} onChange={(e) => set({ target: e.target.value })} aria-label="Target" />
              <input className={input} value={h.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="glasses, pages, minutes…" />
            </div>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-secondary">How often</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["daily", "Every day"],
              ["weekdays", "Certain days"],
              ["interval", "Every N days"],
              ["weekly", "N× a week"],
              ["monthly", "N× a month"],
            ].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setSchedule({ type: v })} className={`rounded-full border px-3 py-1 text-xs ${h.schedule.type === v ? "border-primary bg-primary text-background" : "border-border text-secondary"}`}>
                {l}
              </button>
            ))}
          </div>
          {h.schedule.type === "weekdays" && (
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const on = h.schedule.days.includes(d);
                return (
                  <button key={d} type="button" onClick={() => setSchedule({ days: on ? h.schedule.days.filter((x) => x !== d) : [...h.schedule.days, d] })} className={`h-9 flex-1 rounded-lg border text-xs ${on ? "border-primary bg-primary text-background" : "border-border text-muted"}`}>
                    {WEEKDAYS[d].slice(0, 2)}
                  </button>
                );
              })}
            </div>
          )}
          {(h.schedule.type === "weekly" || h.schedule.type === "monthly") && (
            <label className="mt-2 flex items-center gap-2 text-small">
              <input type="number" min={1} max={h.schedule.type === "weekly" ? 7 : 31} className={`${input} w-20`} value={h.schedule.times} onChange={(e) => setSchedule({ times: e.target.value })} />
              times a {h.schedule.type === "weekly" ? "week" : "month"}, any days
            </label>
          )}
          {h.schedule.type === "interval" && (
            <label className="mt-2 flex items-center gap-2 text-small">
              Every <input type="number" min={1} max={365} className={`${input} w-20`} value={h.schedule.every} onChange={(e) => setSchedule({ every: e.target.value })} /> days
            </label>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-xs text-secondary">Time of day (optional)</span>
            <input type="time" className={input} value={h.time} onChange={(e) => set({ time: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-secondary">Starts</span>
            <input type="date" className={input} value={h.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />
          </label>
        </div>
        <input className={input} value={h.area} onChange={(e) => set({ area: e.target.value })} placeholder="Area (health, learning, work…)" />
        <input className={input} value={h.why} onChange={(e) => set({ why: e.target.value })} placeholder="Why it matters to you (shown as a reminder)" />

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {h._id ? "Save habit" : "Start this habit"}
        </button>
      </motion.form>
    </div>
  );
}

/* ---------- a check / count control ---------- */

export function HabitCheck({ habit, count, onChange, size = "md" }) {
  const hit = isHit(habit, count);
  const big = size === "md";
  if (habit.kind === "count") {
    const target = targetOf(habit);
    return (
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onChange(Math.max(0, count - 1))} disabled={!count} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted disabled:opacity-30" aria-label="Less">
          <Minus size={13} />
        </button>
        <div className="relative flex h-10 w-10 items-center justify-center">
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-border)" strokeWidth="3" />
            <motion.circle cx="18" cy="18" r="15" fill="none" stroke={habit.color} strokeWidth="3" strokeLinecap="round" strokeDasharray={94.2} animate={{ strokeDashoffset: 94.2 * (1 - Math.min(1, count / target)) }} />
          </svg>
          <span className="text-[11px] font-semibold tabular-nums">{count}</span>
        </div>
        <button type="button" onClick={() => onChange(count + 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-background" style={{ background: habit.color }} aria-label="More">
          <Plus size={14} />
        </button>
        <span className="w-14 text-[10px] text-muted">/ {target} {habit.unit}</span>
      </div>
    );
  }
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={() => onChange(hit ? 0 : 1)}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 transition-colors ${big ? "h-10 w-10" : "h-7 w-7"}`}
      style={{ borderColor: habit.color, background: hit ? habit.color : "transparent", color: "white" }}
      aria-label={hit ? `Undo ${habit.name}` : `Done: ${habit.name}`}
      aria-pressed={hit}
    >
      <AnimatePresence>{hit && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={big ? 18 : 13} strokeWidth={3} /></motion.span>}</AnimatePresence>
    </motion.button>
  );
}

/* ---------- today's habits ---------- */

export function TodayHabits({ store, day = today(), onEdit }) {
  const { habits, countOf, setCount } = store;
  if (!habits) return <div className="h-24 animate-pulse rounded-2xl bg-surface" />;
  const active = habits.filter((h) => !h.archived && h.startDate <= day);
  const due = active.filter((h) => isScheduledDay(h, day));
  if (!due.length) return <p className="px-1 text-xs text-muted">{active.length ? "No habits scheduled today." : "No habits yet — add one in Habits."}</p>;
  return (
    <div className="space-y-1.5">
      {due.map((h) => {
        const count = countOf(h._id, day);
        const quota = quotaProgress(h, countOf, day);
        return (
          <div key={h._id} className="flex items-center gap-3 rounded-2xl border border-border p-2.5" style={{ background: isHit(h, count) ? `${h.color}14` : undefined }}>
            <span className="text-xl" aria-hidden>
              {h.emoji}
            </span>
            <button type="button" onClick={() => onEdit?.(h)} className="min-w-0 flex-1 text-left">
              <span className={`block truncate text-small font-medium ${isHit(h, count) ? "text-muted line-through decoration-1" : ""}`}>{h.name}</span>
              <span className="text-[11px] text-muted">
                {quota ? `${quota.done}/${quota.quota} this ${h.schedule.type === "weekly" ? "week" : "month"}` : scheduleLabel(h)}
                {h.time && ` · ${h.time}`}
              </span>
            </button>
            <HabitCheck habit={h} count={count} onChange={(n) => setCount(h, day, n)} />
          </div>
        );
      })}
    </div>
  );
}

/* ---------- habits tab ---------- */

function HabitRow({ habit, days, store, stat, onEdit }) {
  const controls = useDragControls();
  const { countOf, setCount } = store;
  return (
    <Reorder.Item value={habit} dragListener={false} dragControls={controls} className="list-none">
      <div className={`rounded-2xl border border-border bg-card p-3 ${habit.archived ? "opacity-50" : ""}`}>
        <div className="flex items-center gap-2">
          <button type="button" onPointerDown={(e) => { e.preventDefault(); controls.start(e); }} className="cursor-grab touch-none text-muted" aria-label="Drag">
            <GripVertical size={15} />
          </button>
          <span className="text-xl">{habit.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-small font-medium">{habit.name}</p>
            <p className="truncate text-[11px] text-muted">
              {scheduleLabel(habit)}
              {habit.kind === "count" && ` · ${habit.target} ${habit.unit}`}
              {habit.why && ` · ${habit.why}`}
            </p>
          </div>
          {stat && (
            <div className="flex shrink-0 items-center gap-3 text-right">
              <span className="text-[11px] text-muted">
                <b className="block text-small text-primary tabular-nums">{stat.rate === null ? "—" : `${Math.round(stat.rate * 100)}%`}</b>
                30d
              </span>
              <span className="text-[11px] text-muted">
                <b className="flex items-center justify-end gap-0.5 text-small text-primary tabular-nums">
                  <Flame size={13} className={stat.streak ? "text-[var(--color-chart-2)]" : ""} /> {stat.streak}
                </b>
                best {stat.best}
              </span>
            </div>
          )}
          <button type="button" onClick={() => onEdit(habit)} className="rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Edit">
            <Pencil size={14} />
          </button>
        </div>
        <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {days.map((d) => {
            const scheduled = isScheduledDay(habit, d);
            const count = countOf(habit._id, d);
            const hit = isHit(habit, count);
            const partial = !hit && count > 0;
            return (
              <button
                key={d}
                type="button"
                disabled={d > today() || d < habit.startDate}
                onClick={() => setCount(habit, d, habit.kind === "count" ? (hit ? 0 : targetOf(habit)) : hit ? 0 : 1)}
                title={`${fmt(d, { weekday: "short", month: "short", day: "numeric" })}${count ? ` · ${count}${habit.unit ? ` ${habit.unit}` : ""}` : ""}`}
                className="flex w-7 shrink-0 flex-col items-center gap-1 disabled:opacity-30"
              >
                <span className="text-[9px] text-muted">{fmt(d, { weekday: "narrow" })}</span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] ${d === today() ? "ring-1 ring-primary" : ""}`}
                  style={{
                    background: hit ? habit.color : partial ? `${habit.color}55` : "transparent",
                    borderColor: hit || partial ? habit.color : scheduled ? "var(--color-border)" : "transparent",
                    color: hit ? "white" : "var(--color-muted)",
                  }}
                >
                  {hit ? <Check size={12} strokeWidth={3} /> : fmt(d, { day: "numeric" })}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Reorder.Item>
  );
}

export function HabitsTab({ store }) {
  const { habits, setHabits, reload } = store;
  const [editing, setEditing] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [stats, setStats] = useState(new Map());
  const days = useMemo(() => range(addDays(today(), -20), today()), []);
  const timer = useRef(null);

  const loadStats = () =>
    plannerApi
      .stats({ today: today(), days: 30 })
      .then((s) => setStats(new Map(s.habits.rows.map((r) => [r.id, r]))))
      .catch(() => {});

  // Refresh streaks shortly after check-ins settle.
  const checkIns = store.logs;
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(loadStats, 900);
    return () => clearTimeout(timer.current);
  }, [checkIns]);

  if (!habits) return <div className="h-40 animate-pulse rounded-2xl bg-surface" />;
  const list = habits.filter((h) => showArchived || !h.archived);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setEditing({})} className="btn btn-primary">
          <Plus size={15} /> New habit
        </button>
        {habits.some((h) => h.archived) && (
          <button type="button" onClick={() => setShowArchived((s) => !s)} className="text-xs text-muted hover:text-primary">
            {showArchived ? "Hide" : "Show"} archived
          </button>
        )}
        <p className="ml-auto text-xs text-muted">Tap a day to tick it · last 3 weeks</p>
      </div>
      {list.length ? (
        <Reorder.Group
          axis="y"
          values={list}
          onReorder={(next) => {
            setHabits([...next, ...habits.filter((h) => !next.includes(h))]);
            plannerApi.reorderHabits(next.map((h) => h._id)).catch(() => {});
          }}
          className="space-y-2.5"
        >
          {list.map((h) => (
            <HabitRow key={h._id} habit={h} days={days} store={store} stat={stats.get(h._id)} onEdit={setEditing} />
          ))}
        </Reorder.Group>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-3xl">🌱</p>
          <p className="mt-2 text-small font-medium">Start with one small habit</p>
          <p className="mt-1 text-xs text-muted">Something you can do in two minutes — consistency beats size.</p>
        </div>
      )}

      {editing && (
        <>
          <HabitEditor
            initial={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
              loadStats();
            }}
          />
          {editing._id && (
            <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  await plannerApi.updateHabit(editing._id, { archived: !editing.archived });
                  setEditing(null);
                  reload();
                }}
                className="btn btn-outline bg-[var(--color-card)]"
              >
                {editing.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />} {editing.archived ? "Restore" : "Archive"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm(`Delete “${editing.name}” and all its check-ins? This can't be undone.`)) return;
                  await plannerApi.deleteHabit(editing._id);
                  setEditing(null);
                  reload();
                }}
                className="btn btn-outline bg-[var(--color-card)] text-red-500"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
