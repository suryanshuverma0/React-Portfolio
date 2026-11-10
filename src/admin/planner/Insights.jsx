import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { CheckCircle2, Flame, Target, AlertTriangle, FileDown, FileSpreadsheet, FileJson, FileText, Printer } from "lucide-react";

import { plannerApi } from "./api";
import { fmt, today, scheduleLabel } from "./dates";
import { KpiCard, RangeTabs } from "../components/charts/Visuals";
import { ChartTooltip, Panel, RankBars, Donut, Empty } from "../components/charts/ChartKit";

/* ========================================
   PLANNER INSIGHTS — completion, streaks
   and trends, plus exports: PDF (print),
   CSV (tasks, habit log), JSON (everything)
   and a Markdown report.
========================================= */

const SCOPE_COLORS = { day: "var(--color-chart-1)", week: "var(--color-chart-2)", month: "var(--color-chart-3)", year: "var(--color-chart-4)", someday: "var(--color-muted)" };
const pct = (v) => (v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`);
const dayTick = (d) => fmt(d, { month: "short", day: "numeric" });

const download = (name, text, type) => {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
const csv = (rows) => rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

function Exports({ stats }) {
  const [busy, setBusy] = useState("");
  const run = async (kind) => {
    setBusy(kind);
    try {
      const stamp = today();
      if (kind === "pdf") return window.print();
      const all = await plannerApi.exportAll();
      const habitName = new Map(all.habits.map((h) => [String(h._id), h.name]));
      if (kind === "tasks") {
        download(
          `planner-tasks-${stamp}.csv`,
          csv([["Title", "Horizon", "Period", "Time", "Priority", "Area", "Done", "Done on", "Steps", "Notes"], ...all.tasks.map((t) => [t.title, t.scope, t.period, t.time, t.priority, t.area, t.done ? "yes" : "no", t.doneDate, (t.subtasks || []).map((s) => `${s.done ? "[x]" : "[ ]"} ${s.title}`).join("; "), t.notes])]),
          "text/csv",
        );
      }
      if (kind === "habits") {
        download(`planner-habit-log-${stamp}.csv`, csv([["Date", "Habit", "Count", "Note"], ...all.logs.map((l) => [l.date, habitName.get(String(l.habit)) || "", l.count, l.note])]), "text/csv");
      }
      if (kind === "json") download(`planner-backup-${stamp}.json`, JSON.stringify(all, null, 2), "application/json");
      if (kind === "md") {
        const lines = [
          `# Planner report — ${fmt(stats.from, { month: "short", day: "numeric" })} to ${fmt(stats.today, { month: "short", day: "numeric", year: "numeric" })}`,
          "",
          `- Tasks completed: **${stats.tasks.done}** (${stats.tasks.open} open, ${stats.tasks.overdue} overdue)`,
          `- Average habit completion: **${pct(stats.habits.avgRate)}**`,
          `- Best streak: **${stats.habits.bestStreak}**`,
          "",
          "## Habits",
          "",
          "| Habit | Schedule | Completion | Streak | Best |",
          "| --- | --- | --- | --- | --- |",
          ...stats.habits.rows.map((h) => `| ${h.emoji} ${h.name} | ${scheduleLabel(h)} | ${pct(h.rate)} | ${h.streak} ${h.unit}s | ${h.best} |`),
          "",
          "## Tasks by area",
          "",
          ...stats.tasks.byArea.map((a) => `- ${a.label}: ${a.value}`),
          "",
          "## Open tasks",
          "",
          ...all.tasks.filter((t) => !t.done).map((t) => `- [ ] ${t.title} _(${t.scope} ${t.period})_`),
        ];
        download(`planner-report-${stamp}.md`, lines.join("\n"), "text/markdown");
      }
    } catch {
      toast.error("Export failed");
    } finally {
      setBusy("");
    }
  };
  const btn = "inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs hover:border-primary disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" className={btn} onClick={() => run("pdf")}>
        <Printer size={14} /> PDF report
      </button>
      <button type="button" className={btn} disabled={busy === "tasks"} onClick={() => run("tasks")}>
        <FileSpreadsheet size={14} /> Tasks CSV
      </button>
      <button type="button" className={btn} disabled={busy === "habits"} onClick={() => run("habits")}>
        <FileDown size={14} /> Habit log CSV
      </button>
      <button type="button" className={btn} disabled={busy === "md"} onClick={() => run("md")}>
        <FileText size={14} /> Markdown
      </button>
      <button type="button" className={btn} disabled={busy === "json"} onClick={() => run("json")}>
        <FileJson size={14} /> Full backup (JSON)
      </button>
    </div>
  );
}

function Insights() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    plannerApi
      .stats({ today: today(), days })
      .then((s) => !cancelled && setStats(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (!stats) return <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface" />)}</div>;

  const daily = stats.daily.map((d) => ({ ...d, rate: d.habitRate === null ? null : Math.round(d.habitRate * 100) }));
  const scopes = Object.entries(stats.tasks.byScope).filter(([, v]) => v).map(([label, count]) => ({ label, count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="hidden print:block">
          <h1 className="text-[24px] font-semibold">Planner report</h1>
          <p className="text-small text-muted">
            {fmt(stats.from, { month: "long", day: "numeric" })} – {fmt(stats.today, { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <span className="print:hidden">
          <RangeTabs value={days} onChange={setDays} options={[7, 30, 90, 365].map((d) => ({ value: d, label: d === 365 ? "1y" : `${d}d` }))} />
        </span>
        <Exports stats={stats} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
        <KpiCard index={0} icon={CheckCircle2} label={`Tasks done · ${days}d`} value={stats.tasks.done} hint={`${stats.tasks.doneToday} today · ${stats.tasks.open} open`} spark={daily} sparkKey="tasks" />
        <KpiCard index={1} icon={Target} label="Habit completion" value={stats.habits.avgRate === null ? 0 : Math.round(stats.habits.avgRate * 100)} format={(v) => (stats.habits.avgRate === null ? "—" : `${Math.round(v)}%`)} gauge={stats.habits.avgRate === null ? undefined : Math.round(stats.habits.avgRate * 100)} accent="var(--color-chart-3)" hint={`${stats.habits.count} active habit${stats.habits.count === 1 ? "" : "s"}`} />
        <KpiCard index={2} icon={Flame} label="Best streak" value={stats.habits.bestStreak} hint={`${stats.habits.currentStreaks} habit${stats.habits.currentStreaks === 1 ? "" : "s"} on a streak now`} accent="var(--color-chart-2)" />
        <KpiCard index={3} icon={AlertTriangle} label="Overdue" value={stats.tasks.overdue} hint={`${stats.tasks.dueToday} due today`} accent="var(--color-chart-4)" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
        <Panel title="Tasks completed" subtitle="Per day">
          {stats.tasks.done ? (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={daily} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 4" />
                  <XAxis dataKey="date" tickFormatter={dayTick} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip labelFormatter={dayTick} />} cursor={{ fill: "var(--color-surface)" }} />
                  <Bar dataKey="tasks" name="Tasks done" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty>No tasks completed in this period yet.</Empty>
          )}
        </Panel>
        <Panel title="Habit completion" subtitle="Share of each day's scheduled habits done">
          {daily.some((d) => d.rate !== null) ? (
            <div className="h-56">
              <ResponsiveContainer>
                <AreaChart data={daily} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="habit-rate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 4" />
                  <XAxis dataKey="date" tickFormatter={dayTick} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip labelFormatter={dayTick} valueFormatter={(v) => `${v}%`} />} cursor={{ stroke: "var(--color-border)" }} />
                  <Area type="monotone" dataKey="rate" name="Habits done" stroke="var(--color-chart-3)" strokeWidth={2} fill="url(#habit-rate)" connectNulls dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty>Add a habit and tick it to see your trend.</Empty>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 print:grid-cols-3">
        <Panel title="Habits" subtitle="Completion in this period · streak">
          {stats.habits.rows.length ? (
            <div className="space-y-3">
              {stats.habits.rows.map((h) => (
                <div key={h.id} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-small">
                    <span>{h.emoji}</span>
                    <span className="min-w-0 flex-1 truncate">{h.name}</span>
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted">
                      <Flame size={11} /> {h.streak}
                    </span>
                    <span className="w-10 text-right text-xs tabular-nums">{pct(h.rate)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full" style={{ width: `${(h.rate || 0) * 100}%`, background: h.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No habits yet.</Empty>
          )}
        </Panel>
        <Panel title="Done by area">
          <RankBars items={stats.tasks.byArea} />
        </Panel>
        <Panel title="Done by horizon">
          <Donut data={scopes} colorFor={(d) => SCOPE_COLORS[d.label]} totalLabel="tasks" />
        </Panel>
      </div>
    </div>
  );
}

export default Insights;
