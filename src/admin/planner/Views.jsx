import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarCheck, AlertTriangle } from "lucide-react";

import TaskList from "./TaskList";
import { TodayHabits } from "./Habits";
import { useHabits, useTasks } from "./api";
import {
  addDays, addMonths, fmt, isHit, isScheduledDay, monthDays, monthGrid, monthKey, today, weekDays, weekKey, yearKey,
} from "./dates";

/* ========================================
   PLANNER VIEWS — Today, Week, Month, Year.
   Each loads exactly the periods it shows.
========================================= */

const Card = ({ children, className = "" }) => <section className={`rounded-3xl border border-border bg-card p-4 sm:p-5 ${className}`}>{children}</section>;

function Nav({ label, onPrev, onNext, onToday, isCurrent }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onPrev} className="rounded-lg border border-border p-1.5 hover:border-primary" aria-label="Previous">
        <ChevronLeft size={16} />
      </button>
      <h2 className="min-w-0 truncate text-[17px] font-semibold tracking-tight">{label}</h2>
      <button type="button" onClick={onNext} className="rounded-lg border border-border p-1.5 hover:border-primary" aria-label="Next">
        <ChevronRight size={16} />
      </button>
      {!isCurrent && (
        <button type="button" onClick={onToday} className="rounded-lg px-2 py-1 text-xs text-muted hover:text-primary">
          Back to now
        </button>
      )}
    </div>
  );
}

function Ring({ value, size = 64, color = "var(--color-chart-1)", label }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
        <motion.circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - Math.min(1, value)) }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold tabular-nums">{label ?? `${Math.round(value * 100)}%`}</span>
    </div>
  );
}

/* ---------- Today ---------- */

export function TodayView({ habitStore, onEditHabit }) {
  const t = today();
  const periods = [t, weekKey(t), monthKey(t)];
  const tasks = useTasks({ periods: periods.join(","), overdue: 1, today: t }, `today-${t}`);
  const of = (p) => tasks.tasks.filter((x) => x.period === p);

  const todays = of(t);
  const dueHabits = (habitStore.habits || []).filter((h) => !h.archived && isScheduledDay(h, t) && h.schedule?.type !== "weekly" && h.schedule?.type !== "monthly");
  const hitHabits = dueHabits.filter((h) => isHit(h, habitStore.countOf(h._id, t)));
  const total = todays.length + dueHabits.length;
  const done = todays.filter((x) => x.done).length + hitHabits.length;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card>
          <div className="mb-4 flex items-center gap-4">
            <Ring value={total ? done / total : 0} />
            <div className="min-w-0">
              <p className="text-eyebrow">{fmt(t, { weekday: "long" })}</p>
              <h2 className="text-[22px] font-semibold tracking-tight">{fmt(t, { month: "long", day: "numeric" })}</h2>
              <p className="text-xs text-muted">
                {total ? `${done} of ${total} done — tasks and habits` : "A clear day. Plan something small."}
              </p>
            </div>
          </div>
          {tasks.overdue.length > 0 && (
            <div className="mb-4 rounded-2xl border border-[var(--color-chart-2)]/40 bg-[var(--color-chart-2)]/5 p-3">
              <TaskList
                tasks={tasks.overdue}
                api={tasks}
                addable={false}
                showPeriod
                title={
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-chart-2)]">
                    <AlertTriangle size={13} /> Overdue · {tasks.overdue.length}
                  </span>
                }
                right={
                  <button type="button" onClick={() => tasks.overdue.forEach((x) => tasks.update(x, { scope: "day", period: t }))} className="text-[11px] font-medium text-[var(--color-chart-2)] hover:underline">
                    Move all to today
                  </button>
                }
              />
            </div>
          )}
          <TaskList tasks={todays} scope="day" period={t} api={tasks} empty="No tasks for today yet." />
        </Card>
        <Card>
          <TaskList tasks={of(weekKey(t))} scope="week" period={weekKey(t)} api={tasks} title={`This week's goals · week ${Number(weekKey(t).split("W")[1])}`} empty="What would make this week a win?" />
        </Card>
      </div>
      <div className="space-y-5">
        <Card>
          <h3 className="mb-3 px-1 text-[13px] font-semibold">Today&apos;s habits</h3>
          <TodayHabits store={habitStore} onEdit={onEditHabit} />
        </Card>
        <Card>
          <TaskList tasks={of(monthKey(t))} scope="month" period={monthKey(t)} api={tasks} title={`${fmt(t, { month: "long" })} focus`} empty="Big things for this month." />
        </Card>
      </div>
    </div>
  );
}

/* ---------- Week ---------- */

export function WeekView() {
  const [anchor, setAnchor] = useState(today());
  const days = weekDays(anchor);
  const wk = weekKey(anchor);
  const tasks = useTasks({ periods: [...days, wk].join(",") }, `week-${wk}`);
  const habits = useHabits(days[0], days[6]);
  const t = today();

  const dayStats = (d) => {
    const due = (habits.habits || []).filter((h) => !h.archived && isScheduledDay(h, d) && !["weekly", "monthly"].includes(h.schedule?.type));
    return { due: due.length, hit: due.filter((h) => isHit(h, habits.countOf(h._id, d))).length };
  };

  return (
    <div className="space-y-4">
      <Nav label={`${fmt(days[0], { month: "short", day: "numeric" })} – ${fmt(days[6], { month: "short", day: "numeric", year: "numeric" })}`} onPrev={() => setAnchor(addDays(anchor, -7))} onNext={() => setAnchor(addDays(anchor, 7))} onToday={() => setAnchor(t)} isCurrent={days.includes(t)} />
      <Card>
        <TaskList tasks={tasks.tasks.filter((x) => x.period === wk)} scope="week" period={wk} api={tasks} title={`Week ${Number(wk.split("W")[1])} goals`} empty="Set two or three goals for the week." />
      </Card>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 xl:grid xl:grid-cols-7 xl:overflow-visible">
        {days.map((d) => {
          const list = tasks.tasks.filter((x) => x.period === d);
          const s = dayStats(d);
          return (
            <section key={d} className={`w-[260px] shrink-0 snap-start rounded-3xl border bg-card p-3 xl:w-auto ${d === t ? "border-primary" : "border-border"} ${d < t ? "opacity-80" : ""}`}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <span>
                  <span className="text-[11px] uppercase tracking-wider text-muted">{fmt(d, { weekday: "short" })}</span>
                  <span className={`ml-1.5 text-[18px] font-semibold ${d === t ? "text-[var(--color-chart-1)]" : ""}`}>{fmt(d, { day: "numeric" })}</span>
                </span>
                <span className="text-[10px] text-muted">
                  {list.filter((x) => x.done).length}/{list.length}
                  {s.due > 0 && ` · ${s.hit}/${s.due} habits`}
                </span>
              </div>
              <TaskList tasks={list} scope="day" period={d} api={tasks} empty="" />
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Month ---------- */

export function MonthView({ initial }) {
  const [anchor, setAnchor] = useState(initial || today());
  const [selected, setSelected] = useState(initial || today());
  const days = monthDays(anchor);
  const grid = monthGrid(anchor);
  const mk = monthKey(anchor);
  const tasks = useTasks({ from: grid[0], to: grid[grid.length - 1] }, `month-${mk}`);
  const monthGoals = useTasks({ periods: mk }, `month-goals-${mk}`);
  const habits = useHabits(grid[0], grid[grid.length - 1]);
  const t = today();
  const byDay = useMemo(() => {
    const m = new Map();
    tasks.tasks.forEach((x) => m.set(x.period, [...(m.get(x.period) || []), x]));
    return m;
  }, [tasks.tasks]);

  const habitShare = (d) => {
    const due = (habits.habits || []).filter((h) => !h.archived && isScheduledDay(h, d) && !["weekly", "monthly"].includes(h.schedule?.type));
    if (!due.length || d > t) return null;
    return due.filter((h) => isHit(h, habits.countOf(h._id, d))).length / due.length;
  };

  const sel = selected.startsWith(mk) || grid.includes(selected) ? selected : days[0];

  return (
    <div className="space-y-4">
      <Nav label={fmt(`${mk}-01`, { month: "long", year: "numeric" })} onPrev={() => setAnchor(addMonths(anchor, -1))} onNext={() => setAnchor(addMonths(anchor, 1))} onToday={() => { setAnchor(t); setSelected(t); }} isCurrent={mk === monthKey(t)} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="p-2 sm:p-3">
          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="py-1 text-center text-[10px] uppercase tracking-wider text-muted">
                {d}
              </span>
            ))}
            {grid.map((d) => {
              const list = byDay.get(d) || [];
              const share = habitShare(d);
              const inMonth = d.startsWith(mk);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelected(d)}
                  className={`flex min-h-[64px] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[92px] ${d === sel ? "border-primary bg-surface" : "border-transparent hover:bg-surface/70"} ${inMonth ? "" : "opacity-40"}`}
                >
                  <span className={`text-[12px] font-medium ${d === t ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-background" : ""}`}>{fmt(d, { day: "numeric" })}</span>
                  <span className="mt-1 hidden space-y-0.5 sm:block">
                    {list.slice(0, 3).map((x) => (
                      <span key={x._id} className={`block truncate rounded px-1 text-[10px] ${x.done ? "text-muted line-through" : "bg-[var(--color-chart-1)]/10"}`}>
                        {x.title}
                      </span>
                    ))}
                    {list.length > 3 && <span className="block px-1 text-[10px] text-muted">+{list.length - 3}</span>}
                  </span>
                  <span className="mt-auto flex items-center gap-1 pt-1">
                    {list.length > 0 && <span className="text-[9px] text-muted sm:hidden">{list.length}</span>}
                    {share !== null && (
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                        <span className="block h-full rounded-full bg-[var(--color-chart-3)]" style={{ width: `${share * 100}%` }} />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="px-2 pt-2 text-[10px] text-muted">Green bar = share of that day&apos;s habits done</p>
        </Card>
        <div className="space-y-5">
          <Card>
            <TaskList tasks={byDay.get(sel) || []} scope="day" period={sel} api={tasks} title={fmt(sel, { weekday: "long", month: "short", day: "numeric" })} empty="Nothing planned." />
          </Card>
          <Card>
            <TaskList tasks={monthGoals.tasks} scope="month" period={mk} api={monthGoals} title={`${fmt(`${mk}-01`, { month: "long" })} goals`} empty="What should this month be about?" />
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Year ---------- */

export function YearView({ onOpenMonth }) {
  const [year, setYear] = useState(yearKey(today()));
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const tasks = useTasks({ periods: [year, ...months].join(",") }, `year-${year}`);
  const current = monthKey(today());

  return (
    <div className="space-y-4">
      <Nav label={year} onPrev={() => setYear(String(Number(year) - 1))} onNext={() => setYear(String(Number(year) + 1))} onToday={() => setYear(yearKey(today()))} isCurrent={year === yearKey(today())} />
      <Card>
        <TaskList tasks={tasks.tasks.filter((x) => x.period === year)} scope="year" period={year} api={tasks} title={`${year} goals`} empty="Your big goals for the year — keep it to a handful." />
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {months.map((m) => {
          const list = tasks.tasks.filter((x) => x.period === m);
          const done = list.filter((x) => x.done).length;
          return (
            <section key={m} className={`rounded-3xl border bg-card p-3 ${m === current ? "border-primary" : "border-border"} ${m < current ? "opacity-80" : ""}`}>
              <div className="mb-1 flex items-center justify-between px-1">
                <button type="button" onClick={() => onOpenMonth(`${m}-01`)} className="inline-flex items-center gap-1.5 text-[14px] font-semibold hover:text-[var(--color-chart-1)]">
                  {fmt(`${m}-01`, { month: "long" })} <CalendarCheck size={13} className="text-muted" />
                </button>
                {list.length > 0 && (
                  <span className="text-[10px] text-muted">
                    {done}/{list.length}
                  </span>
                )}
              </div>
              {list.length > 0 && (
                <div className="mx-1 mb-2 h-1 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-[var(--color-chart-1)]" style={{ width: `${(done / list.length) * 100}%` }} />
                </div>
              )}
              <TaskList tasks={list} scope="month" period={m} api={tasks} empty="" />
            </section>
          );
        })}
      </div>
    </div>
  );
}
