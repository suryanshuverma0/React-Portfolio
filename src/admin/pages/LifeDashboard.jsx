import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Heart, NotebookPen, PenLine, Type, Pin, BookOpen, Lock, KeyRound, LifeBuoy, Timer, Fingerprint, Copy } from "lucide-react";

import api from "../../lib/axios";
import LifeGate from "../life/LifeGate";
import { useLifeLock, lockNow, changePassphrase, updateAutoLock, newRecoveryCode } from "../life/lifeLockStore";
import { KpiCard, RangeTabs, CalendarHeatmap } from "../components/charts/Visuals";
import { ChartTooltip, Legend, Panel, RankBars, Donut, Empty } from "../components/charts/ChartKit";

/* ========================================
   LIFE DASHBOARD — what's happening on the
   personal side, behind the life lock.
   Notes today; planner, habits, bookmarks
   and vault add their own blocks as they
   arrive.
========================================= */

const SERIES = { created: "var(--color-chart-1)", edits: "var(--color-chart-2)" };
const PALETTE = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-muted)"];
const fmtDay = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const ago = (d) => {
  const m = Math.round((Date.now() - new Date(d)) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
};

function LockSettings() {
  const status = useLifeLock();
  const [mode, setMode] = useState(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e.response?.data?.message || "That didn't work");
    } finally {
      setBusy(false);
    }
  };
  const input = "h-10 w-full rounded-xl border border-border bg-surface px-3 text-small outline-none focus:border-primary";

  return (
    <Panel title="Lock & recovery" subtitle="Your personal space has its own passphrase, separate from the admin sign-in.">
      <div className="space-y-3">
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-small">
          <span className="inline-flex items-center gap-2">
            <Timer size={15} /> Auto-lock after
          </span>
          <select value={status.autoLockMinutes} onChange={(e) => run(() => updateAutoLock(Number(e.target.value)))} className="rounded-lg border border-border bg-surface px-2 py-1 text-small">
            {[5, 10, 15, 30, 60, 120, 240].map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${m / 60} h`} idle
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-small">
          <Fingerprint size={15} />
          <span className="flex-1">{status.passkeys ? `Fingerprint unlock on · ${status.passkeys} passkey${status.passkeys > 1 ? "s" : ""}` : "Add a passkey to unlock with your fingerprint"}</span>
          <Link to="/dashboard/security" className="text-xs text-muted hover:text-primary">
            Manage
          </Link>
        </div>

        {mode === "change" && (
          <form onSubmit={(e) => { e.preventDefault(); run(async () => { await changePassphrase(current, next); toast.success("Passphrase changed — other devices were locked"); setMode(null); setCurrent(""); setNext(""); }); }} className="space-y-2 rounded-xl border border-border p-3">
            <input type="password" autoComplete="current-password" className={input} placeholder="Current passphrase" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus />
            <input type="password" autoComplete="new-password" className={input} placeholder="New passphrase (8+ characters)" value={next} onChange={(e) => setNext(e.target.value)} />
            <button type="submit" disabled={busy || !current || next.length < 8} className="btn btn-primary w-full disabled:opacity-40">Change passphrase</button>
          </form>
        )}
        {mode === "recovery" && (
          <form onSubmit={(e) => { e.preventDefault(); run(async () => setCode(await newRecoveryCode(current))); }} className="space-y-2 rounded-xl border border-border p-3">
            {code ? (
              <>
                <p className="select-all rounded-xl bg-surface px-3 py-3 text-center font-mono tracking-[0.12em]">{code}</p>
                <p className="text-xs text-muted">The old code no longer works. Store this one safely — it&apos;s shown once.</p>
                <button type="button" className="btn btn-outline w-full" onClick={() => navigator.clipboard.writeText(code).then(() => toast.success("Copied"))}>
                  <Copy size={14} /> Copy
                </button>
              </>
            ) : (
              <>
                <input type="password" autoComplete="current-password" className={input} placeholder="Confirm with your passphrase" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus />
                <button type="submit" disabled={busy || !current} className="btn btn-primary w-full disabled:opacity-40">Make a new recovery code</button>
              </>
            )}
          </form>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => { setMode(mode === "change" ? null : "change"); setCurrent(""); }} className="btn btn-outline">
            <KeyRound size={14} /> Change
          </button>
          <button type="button" onClick={() => { setMode(mode === "recovery" ? null : "recovery"); setCode(""); setCurrent(""); }} className="btn btn-outline">
            <LifeBuoy size={14} /> Recovery code
          </button>
          <button type="button" onClick={lockNow} className="btn btn-primary">
            <Lock size={14} /> Lock now
          </button>
        </div>
      </div>
    </Panel>
  );
}

function Overview() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/life/overview", { params: { days } })
      .then((r) => !cancelled && setData(r.data.data))
      .catch((e) => e.response?.status !== 423 && toast.error("Couldn't load your overview"));
    return () => {
      cancelled = true;
    };
  }, [days]);

  const notes = data?.notes;
  const totals = notes?.activity.reduce((t, d) => ({ created: t.created + d.created, edits: t.edits + d.edits }), { created: 0, edits: 0 });
  const activeDays = notes?.activity.filter((d) => d.created || d.edits).length || 0;
  const spark = notes?.activity.map((d) => ({ v: d.created + d.edits })) || [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading inline-flex items-center gap-3">
            <Heart size={28} /> Life
          </h1>
          <p className="text-body mt-2">Your personal side at a glance — private, behind its own lock.</p>
        </div>
        <RangeTabs value={days} onChange={setDays} options={[7, 30, 90, 365].map((d) => ({ value: d, label: d === 365 ? "1y" : `${d}d` }))} />
      </section>

      {!notes ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard index={0} icon={NotebookPen} label="Notes" value={notes.total} hint={`${notes.notebooks} notebook${notes.notebooks === 1 ? "" : "s"}`} spark={spark} sparkKey="v" />
            <KpiCard index={1} icon={PenLine} label={`Writing sessions · ${days}d`} value={totals.edits + totals.created} hint={`${totals.created} new · ${totals.edits} saved versions`} accent="var(--color-chart-2)" />
            <KpiCard index={2} icon={Type} label="Words written" value={notes.words} hint={`${notes.typed} typed · ${notes.handwritten} handwritten`} accent="var(--color-chart-3)" />
            <KpiCard index={3} icon={Pin} label="Active days" value={activeDays} hint={`of the last ${days} · ${notes.pinned} pinned notes`} accent="var(--color-chart-4)" gauge={Math.round((activeDays / days) * 100)} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Panel title="Writing activity" subtitle="New notes and saved versions per day" right={<Legend items={[{ label: "New notes", color: SERIES.created, value: totals.created }, { label: "Saved versions", color: SERIES.edits, value: totals.edits }]} />}>
              {totals.created + totals.edits ? (
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart data={notes.activity} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                      <defs>
                        {Object.entries(SERIES).map(([k, c]) => (
                          <linearGradient key={k} id={`life-${k}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={c} stopOpacity={0.28} />
                            <stop offset="100%" stopColor={c} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 4" />
                      <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} minTickGap={24} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted)" }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<ChartTooltip labelFormatter={fmtDay} />} cursor={{ stroke: "var(--color-border)" }} />
                      <Area type="monotone" dataKey="edits" name="Saved versions" stroke={SERIES.edits} strokeWidth={2} fill="url(#life-edits)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }} />
                      <Area type="monotone" dataKey="created" name="New notes" stroke={SERIES.created} strokeWidth={2} fill="url(#life-created)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty>No writing in this period yet.</Empty>
              )}
            </Panel>
            <LockSettings />
          </div>

          <CalendarHeatmap daily={notes.activity.map((d) => ({ date: d.date, sessions: d.created + d.edits }))} valueKey="sessions" unit="sessions" title="Writing streak" subtitle="Each square is a day — darker means more writing" />

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel title="Notebooks" subtitle="Where your notes live">
              <Donut data={notes.byNotebook.map((n) => ({ label: `${n.icon || ""} ${n.title}`.trim(), count: n.n }))} colorFor={(_, i) => PALETTE[Math.min(i, PALETTE.length - 1)]} totalLabel="notes" />
            </Panel>
            <Panel title="Top tags">
              <RankBars items={notes.tags.map((t) => ({ label: `#${t.tag}`, value: t.count }))} />
            </Panel>
            <Panel title="Recently edited" right={<Link to="/dashboard/notes" className="text-xs text-muted hover:text-primary">Open notes →</Link>}>
              {notes.recent.length ? (
                <ul className="space-y-1">
                  {notes.recent.map((n) => (
                    <li key={n.id}>
                      <Link to={`/dashboard/notes?note=${n.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface">
                        {n.kind === "handwritten" ? <PenLine size={15} className="shrink-0 text-muted" /> : <BookOpen size={15} className="shrink-0 text-muted" />}
                        <span className="min-w-0 flex-1 truncate text-small">{n.title}</span>
                        <span className="shrink-0 text-[11px] text-muted">{ago(n.updatedAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No notes yet.</Empty>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function LifeDashboard() {
  return (
    <LifeGate>
      <Overview />
    </LifeGate>
  );
}

export default LifeDashboard;
