import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Bell,
  Mail,
  Send,
  HardDrive,
  CloudUpload,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  CalendarClock,
  ExternalLink,
  Copy,
  BarChart3,
  Workflow,
} from "lucide-react";

import AdminSwitch from "../components/form/AdminSwitch";
import ConfirmModal from "../components/ui/ConfirmModal";
import SkeletonCard from "../../components/common/SkeletonCard";
import * as api from "../services/automation.service";

/* ========================================
   AUTOMATIONS — visitor alerts, weekly
   executive report, and notes backups
   (Google Drive / email / download).
========================================= */

const MINUTE_OPTIONS = [1, 2, 3, 5, 10, 15, 30];
const KEEP_OPTIONS = [7, 14, 30, 60];

const fmtDate = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
const fmtBytes = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((b || 0) / 1024))} KB`);

const selectClass = "h-control px-4 rounded-control bg-surface border border-border text-small";
const buttonClass = "h-control px-4 rounded-control border border-border bg-surface text-small inline-flex items-center gap-2 disabled:opacity-50";
const primaryClass = "h-control px-5 rounded-control bg-primary text-background text-small font-medium inline-flex items-center gap-2 disabled:opacity-50";

function SectionCard({ icon: Icon, title, subtitle, children, right }) {
  return (
    <section className="card space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="h-10 w-10 shrink-0 rounded-2xl bg-surface flex items-center justify-center">
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-title">{title}</h2>
            {subtitle && <p className="text-small mt-1">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function StatusPill({ status }) {
  const map = {
    success: ["text-emerald-600 dark:text-emerald-400", CheckCircle2, "Success"],
    partial: ["text-amber-600 dark:text-amber-400", AlertTriangle, "Partly failed"],
    failed: ["text-red-500", XCircle, "Failed"],
    running: ["text-muted", Loader2, "Running"],
  };
  const [cls, Icon, label] = map[status] || ["text-muted", AlertTriangle, "Never run"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-small font-medium ${cls}`}>
      <Icon size={15} className={status === "running" ? "animate-spin" : ""} />
      {label}
    </span>
  );
}

/* ---------- alerts ---------- */

function AlertsCard() {
  const [settings, setSettings] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api.getAlertSettings().then(setSettings).catch(() => toast.error("Couldn't load alert settings"));
  }, []);

  const save = async (patch) => {
    const previous = settings;
    setSettings((s) => ({
      ...s,
      ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, typeof v === "object" ? { ...s[k], ...v } : v])),
    }));
    try {
      const saved = await api.updateAlertSettings(patch);
      setSettings((s) => ({ ...s, ...saved }));
    } catch (error) {
      setSettings(previous);
      toast.error(error.response?.data?.errors?.[0]?.message || "Couldn't save");
    }
  };

  const test = async () => {
    try {
      setTesting(true);
      await api.sendTestAlert();
      toast.success(settings.email.enabled && settings.emailConfigured ? "Test alert sent — check your inbox and the bell" : "Test alert added to the bell");
    } catch {
      toast.error("Test failed");
    } finally {
      setTesting(false);
    }
  };

  if (!settings) return <SkeletonCard />;

  return (
    <SectionCard
      icon={Bell}
      title="Visitor alerts"
      subtitle="Get notified when someone spends a while on your portfolio — they're probably interested."
      right={
        <button type="button" onClick={test} disabled={testing} className={buttonClass}>
          {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send test alert
        </button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-5">
          <AdminSwitch label="Alert me about long visits" checked={settings.longVisit.enabled} onChange={(v) => save({ longVisit: { enabled: v } })} />

          <label className="flex items-center justify-between gap-4">
            <span className="text-label">Alert after</span>
            <select
              value={settings.longVisit.minutes}
              onChange={(e) => save({ longVisit: { minutes: Number(e.target.value) } })}
              disabled={!settings.longVisit.enabled}
              className={selectClass}
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} minute{m === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>

          <AdminSwitch label="Include NFC card visits" checked={settings.longVisit.includeCard} onChange={(v) => save({ longVisit: { includeCard: v } })} />

          <div className="space-y-1">
            <AdminSwitch label="Ignore my own devices" checked={settings.ignoreOwner} onChange={(v) => save({ ignoreOwner: v })} />
            <p className="text-xs text-muted">
              {settings.ownerVisitorIds?.length || 0} device{settings.ownerVisitorIds?.length === 1 ? "" : "s"} recognised as yours (any browser
              you open this admin panel in).
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <AdminSwitch label="Email me alerts" checked={settings.email.enabled} onChange={(v) => save({ email: { enabled: v } })} />
          <label className="block space-y-2">
            <span className="text-label">Send to</span>
            <input
              type="email"
              defaultValue={settings.email.to}
              placeholder={settings.defaultEmail || "you@example.com"}
              onBlur={(e) => e.target.value !== settings.email.to && save({ email: { to: e.target.value.trim() } })}
              className="w-full h-control px-4 rounded-control bg-surface border border-border outline-none focus:border-primary"
            />
            <span className="block text-xs text-muted">Leave empty to use {settings.defaultEmail || "your admin email"}.</span>
          </label>
          {!settings.emailConfigured && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
              Email isn&apos;t configured on the server (RESEND_API_KEY), so alerts only appear in the bell.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/* ---------- weekly report ---------- */

function ReportCard() {
  const [settings, setSettings] = useState(null);
  const [sending, setSending] = useState(false);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    api.getAlertSettings().then(setSettings).catch(() => {});
  }, []);

  const toggle = async (enabled) => {
    setSettings((s) => ({ ...s, weeklyReport: { ...s.weeklyReport, enabled } }));
    try {
      await api.updateAlertSettings({ weeklyReport: { enabled, timezone } });
      toast.success(enabled ? "You'll get the report every Monday at 8:00" : "Weekly report turned off");
    } catch {
      toast.error("Couldn't save");
    }
  };

  const sendNow = async () => {
    try {
      setSending(true);
      await api.emailExecutiveReport("week");
      toast.success("Report emailed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't email the report");
    } finally {
      setSending(false);
    }
  };

  if (!settings) return <SkeletonCard />;

  return (
    <SectionCard
      icon={BarChart3}
      title="Weekly executive report"
      subtitle="A one-page summary of traffic, engagement, content and what needs your attention."
      right={
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard/report" className={buttonClass}>
            <FileText size={15} /> Open report
          </Link>
          <button type="button" onClick={sendNow} disabled={sending || !settings.emailConfigured} className={buttonClass}>
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Email it now
          </button>
        </div>
      }
    >
      <AdminSwitch label={`Email me every Monday at 08:00 (${timezone})`} checked={settings.weeklyReport?.enabled} onChange={toggle} />
      {settings.weeklyReport?.lastSentAt && <p className="text-xs text-muted">Last sent {fmtDate(settings.weeklyReport.lastSentAt)}</p>}
    </SectionCard>
  );
}

/* ---------- backups ---------- */

function BackupsCard() {
  const [state, setState] = useState(null);
  const [running, setRunning] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setState(await api.getBackups());
    } catch {
      toast.error("Couldn't load backups");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const save = async (patch) => {
    try {
      const config = await api.updateBackupSettings(patch);
      setState((s) => ({ ...s, config }));
    } catch {
      toast.error("Couldn't save");
    }
  };

  const runNow = async () => {
    try {
      setRunning(true);
      const run = await api.runBackupNow();
      if (run.status === "success") toast.success("Backup complete");
      else toast.warn(run.destinations.filter((d) => !d.ok).map((d) => d.error).join(" · ") || "Backup had problems");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Backup failed");
    } finally {
      setRunning(false);
    }
  };

  const connectDrive = async () => {
    try {
      const { url } = await api.getDriveConnectUrl();
      window.location.href = url;
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't start Google sign-in");
    }
  };

  const disconnect = async () => {
    const config = await api.disconnectDrive();
    setState((s) => ({ ...s, config }));
    toast.success("Google Drive disconnected");
  };

  const pickRestoreFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.app !== "portfolio-notes") throw new Error();
      setRestoreFile({ name: file.name, data: parsed });
    } catch {
      toast.error("That file isn't a notes backup");
    }
  };

  const restore = async () => {
    try {
      setRestoring(true);
      const result = await api.restoreBackup(restoreFile.data);
      toast.success(`Restored ${result.notes} notes, ${result.topics} topics, ${result.notebooks} notebooks`);
      setRestoreFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  if (!state) return <SkeletonCard />;
  const { config, runs, redirectUri } = state;

  return (
    <SectionCard
      icon={HardDrive}
      title="Notes backups"
      subtitle="A complete, restorable copy of every notebook, topic and note — typed and handwritten."
      right={
        <button type="button" onClick={runNow} disabled={running || config.running} className={primaryClass}>
          {running || config.running ? <Loader2 size={15} className="animate-spin" /> : <CloudUpload size={15} />} Back up now
        </button>
      }
    >
      {/* status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface/50 p-4">
          <p className="text-small">Last backup</p>
          <p className="text-label mt-1">{fmtDate(config.lastRun?.at)}</p>
          <div className="mt-1">
            <StatusPill status={config.lastRun?.status} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface/50 p-4">
          <p className="text-small">Next scheduled</p>
          <p className="text-label mt-1">{config.schedule === "off" ? "Off" : fmtDate(config.nextRunAt)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/50 p-4">
          <p className="text-small">Keeps</p>
          <p className="text-label mt-1">Latest {config.keep} on Drive</p>
        </div>
      </div>
      {config.lastRun?.message && (
        <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs">
          <XCircle size={14} className="mt-0.5 shrink-0 text-red-500" /> {config.lastRun.message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Google Drive */}
        <div className="space-y-4 rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-label inline-flex items-center gap-2">
              <HardDrive size={16} /> Google Drive
            </p>
            {config.google.connected ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle2 size={13} /> Connected
              </span>
            ) : (
              <span className="text-xs text-muted">Not connected</span>
            )}
          </div>

          {config.google.connected ? (
            <>
              <p className="text-small">
                Saving to <strong>{config.google.email || "your Google account"}</strong> in the folder “Portfolio Notes Backups”.
              </p>
              <AdminSwitch label="Back up to Drive" checked={config.destinations.drive} onChange={(v) => save({ destinations: { drive: v } })} />
              <AdminSwitch label="Also save a readable Google Doc" checked={config.destinations.driveDoc} onChange={(v) => save({ destinations: { driveDoc: v } })} />
              <button type="button" onClick={disconnect} className="text-xs text-red-500 underline underline-offset-2">
                Disconnect Google Drive
              </button>
            </>
          ) : config.driveConfigured ? (
            <>
              <p className="text-small">Connect once — backups then upload automatically. Only files this app creates are accessible.</p>
              <button type="button" onClick={connectDrive} className={primaryClass}>
                Connect Google Drive
              </button>
            </>
          ) : (
            <div className="space-y-3 text-xs text-secondary">
              <p className="text-small text-primary">One-time setup needed on the server:</p>
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>
                  In Google Cloud Console → APIs &amp; Services, open the project for your Google sign-in and <strong>enable the Google Drive API</strong>.
                </li>
                <li>
                  On your OAuth client, add this <strong>Authorized redirect URI</strong>:
                  <span className="mt-1 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-2 py-1">{redirectUri}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(redirectUri).then(() => toast.success("Copied"))}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border"
                      aria-label="Copy redirect URI"
                    >
                      <Copy size={12} />
                    </button>
                  </span>
                </li>
                <li>
                  Copy the client <strong>secret</strong> into Render as <code>GOOGLE_CLIENT_SECRET</code> and redeploy.
                </li>
                <li>
                  OAuth consent screen: add the <code>drive.file</code> scope and set publishing status to <strong>In production</strong> (in “Testing”, Google
                  expires the connection after 7 days).
                </li>
              </ol>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 underline">
                Open Google Cloud Console <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>

        {/* Email + schedule */}
        <div className="space-y-5 rounded-2xl border border-border p-5">
          <p className="text-label inline-flex items-center gap-2">
            <CalendarClock size={16} /> Schedule &amp; email
          </p>
          <label className="flex items-center justify-between gap-4">
            <span className="text-small">Automatic backups</span>
            <select value={config.schedule} onChange={(e) => save({ schedule: e.target.value })} className={selectClass}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="off">Off</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-small">Keep on Drive</span>
            <select value={config.keep} onChange={(e) => save({ keep: Number(e.target.value) })} className={selectClass}>
              {KEEP_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  Latest {k}
                </option>
              ))}
            </select>
          </label>
          <AdminSwitch label="Email me the backup file" checked={config.destinations.email} onChange={(v) => save({ destinations: { email: v } })} />
          {!config.emailConfigured && <p className="text-xs text-muted">Email isn&apos;t configured on the server.</p>}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <button type="button" onClick={() => api.downloadBackup().catch(() => toast.error("Download failed"))} className={buttonClass}>
              <Download size={15} /> Download backup
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={buttonClass}>
              <Upload size={15} /> Restore from file
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={pickRestoreFile} />
          </div>
        </div>
      </div>

      {/* history */}
      <div>
        <p className="text-label mb-3">History</p>
        {!runs.length ? (
          <p className="text-small">No backups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="py-2 font-normal">When</th>
                  <th className="py-2 font-normal">Trigger</th>
                  <th className="py-2 font-normal">Status</th>
                  <th className="py-2 font-normal">Contents</th>
                  <th className="py-2 font-normal">Destinations</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run._id} className="border-b border-border last:border-b-0 align-top">
                    <td className="py-2.5 pr-3 whitespace-nowrap">{fmtDate(run.startedAt)}</td>
                    <td className="py-2.5 pr-3 capitalize text-muted">{run.trigger}</td>
                    <td className="py-2.5 pr-3">
                      <StatusPill status={run.status} />
                    </td>
                    <td className="py-2.5 pr-3 text-muted whitespace-nowrap">
                      {run.counts ? `${run.counts.notes} notes · ${fmtBytes(run.sizeBytes)}` : "—"}
                    </td>
                    <td className="py-2.5 text-xs">
                      {run.destinations.map((d, i) => (
                        <span key={i} className={`mr-2 inline-flex items-center gap-1 ${d.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`} title={d.error}>
                          {d.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {d.ok && d.ref?.startsWith("http") ? (
                            <a href={d.ref} target="_blank" rel="noreferrer noopener" className="underline">
                              {d.type}
                            </a>
                          ) : (
                            d.type
                          )}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(restoreFile)}
        title="Restore this backup?"
        message={
          restoreFile
            ? `${restoreFile.name}: ${restoreFile.data.counts?.notes ?? "?"} notes from ${fmtDate(restoreFile.data.createdAt)}. Notes in the backup replace their current versions; notes created since are kept.`
            : ""
        }
        confirmText="Restore"
        loading={restoring}
        onConfirm={restore}
        onCancel={() => setRestoreFile(null)}
      />
    </SectionCard>
  );
}

function Automations() {
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const drive = params.get("drive");
    if (!drive) return;
    const messages = {
      connected: ["success", "Google Drive connected — backups will upload there"],
      denied: ["error", "Google Drive access was declined"],
      "no-refresh-token": ["error", "Google didn't grant offline access — disconnect the app in your Google account and try again"],
      error: ["error", "Couldn't connect Google Drive"],
    };
    const [kind, text] = messages[drive] || messages.error;
    toast[kind](text);
    setParams({}, { replace: true });
  }, [params, setParams]);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <section>
        <h1 className="text-heading inline-flex items-center gap-3">
          <Workflow size={28} /> Automations
        </h1>
        <p className="text-body mt-3">Alerts, reports and backups that run on their own.</p>
      </section>
      <AlertsCard />
      <ReportCard />
      <BackupsCard />
    </div>
  );
}

export default Automations;
