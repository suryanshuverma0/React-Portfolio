import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import {
  HeartPulse,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Server,
  Database,
  Zap,
  Image as ImageIcon,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";

import SkeletonCard from "../../components/common/SkeletonCard";
import { ChartTooltip } from "../components/charts/ChartKit";
import { getSystemHealth } from "../services/system.service";
import { formatDateTime, timeAgo } from "../components/visitors/visitorFormat";

/* ========================================
   SYSTEM HEALTH — live status of the API
   and everything it depends on. Polls
   every 30s; latency history is kept in
   the browser for this visit only.
========================================= */

const POLL_MS = 30 * 1000;
const HISTORY = 40;

const STATUS = {
  ok: { label: "Operational", icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-400" },
  degraded: { label: "Degraded", icon: AlertTriangle, cls: "text-amber-600 dark:text-amber-400" },
  down: { label: "Down", icon: XCircle, cls: "text-red-500" },
  not_configured: { label: "Not configured", icon: MinusCircle, cls: "text-muted" },
};

const bytes = (value) => {
  if (value === undefined || value === null) return "—";
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024))} KB`;
};

const uptime = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
};

function StatusBadge({ status }) {
  const meta = STATUS[status] || STATUS.degraded;
  const Icon = meta.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-small font-medium ${meta.cls}`}>
      <Icon size={15} /> {meta.label}
    </span>
  );
}

function Sparkline({ points }) {
  if (points.length < 2) return <p className="text-muted text-xs">Collecting latency samples…</p>;

  return (
    <div className="h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <XAxis dataKey="time" hide />
          <YAxis hide domain={[0, "dataMax + 10"]} />
          <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v} ms`} />} />
          <Line type="monotone" dataKey="ms" name="Latency" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ServiceCard({ icon: Icon, name, service, rows = [], history }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 shrink-0 rounded-2xl bg-surface flex items-center justify-center">
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-title">{name}</h2>
            {service?.latencyMs !== undefined && (
              <p className="text-muted text-xs tabular-nums">
                {service.latencyMs} ms{service.cached ? " · checked in the last 5 min" : ""}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={service?.status} />
      </div>

      {service?.error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs break-words">{service.error}</p>}
      {service?.note && <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs">{service.note}</p>}

      {history && <Sparkline points={history} />}

      {rows.filter(([, v]) => v !== undefined && v !== null && v !== "").length > 0 && (
        <dl className="space-y-2 text-small">
          {rows
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-muted shrink-0">{label}</dt>
                <dd className="text-right min-w-0 break-words tabular-nums">{value}</dd>
              </div>
            ))}
        </dl>
      )}
    </div>
  );
}

function UsageBar({ used, total }) {
  const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const tone = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "";

  return (
    <div className="space-y-1.5">
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(pct, 2)}%`, ...(tone ? {} : { backgroundColor: "var(--color-chart-1)" }) }} />
      </div>
      <p className="text-muted text-xs tabular-nums">
        {bytes(used)} of {bytes(total)} · {pct}%
      </p>
    </div>
  );
}

function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState({ api: [], mongo: [], redis: [] });
  const lastError = useRef(false);

  const load = useCallback(async () => {
    const started = performance.now();

    try {
      setLoading(true);
      const data = await getSystemHealth();
      const roundTrip = Math.round(performance.now() - started);
      const time = new Date().toLocaleTimeString();

      setHealth({ ...data, roundTripMs: roundTrip });
      setHistory((h) => ({
        api: [...h.api, { time, ms: roundTrip }].slice(-HISTORY),
        mongo: [...h.mongo, { time, ms: data.services.mongo.latencyMs }].slice(-HISTORY),
        redis: [...h.redis, { time, ms: data.services.redis.latencyMs }].slice(-HISTORY),
      }));
      lastError.current = false;
    } catch {
      if (!lastError.current) toast.error("Couldn't reach the API health check");
      lastError.current = true;
      setHealth((h) => (h ? { ...h, overall: "down", unreachable: true } : { overall: "down", unreachable: true }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, POLL_MS);

    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  const { api, services, schedulers } = health || {};

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading inline-flex items-center gap-3">
            <HeartPulse size={28} /> System Health
          </h1>
          <p className="text-body mt-3">Live status of the API, database, cache and the services they rely on.</p>
        </div>

        <button
          type="button"
          onClick={load}
          className="h-control px-4 rounded-control border border-border bg-surface text-small inline-flex items-center gap-2"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </section>

      {!health ? (
        <SkeletonCard />
      ) : (
        <>
          <section className="card flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={health.overall} />
              <span className="text-body">
                {health.unreachable
                  ? "The API didn't respond — it may be waking up from a Render cold start."
                  : health.overall === "ok"
                    ? "All systems operational."
                    : "Some services need attention."}
              </span>
            </div>
            {health.checkedAt && (
              <span className="text-muted text-xs">
                Checked {timeAgo(health.checkedAt)} · auto-refreshes every 30s
              </span>
            )}
          </section>

          {api && (
            <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {[
                ["Uptime", uptime(api.uptimeSec), `Since ${formatDateTime(api.startedAt)}`],
                ["Round trip", `${health.roundTripMs} ms`, "Browser → API → browser"],
                ["Memory (RSS)", bytes(api.memory.rssBytes), `Heap ${bytes(api.memory.heapUsedBytes)} used`],
                ["Event loop delay", `${api.eventLoopDelayMs.p99} ms`, `p99 · mean ${api.eventLoopDelayMs.mean} ms`],
              ].map(([label, value, hint]) => (
                <div key={label} className="card space-y-2">
                  <p className="text-small">{label}</p>
                  <p className="text-heading tabular-nums">{value}</p>
                  <p className="text-muted text-xs">{hint}</p>
                </div>
              ))}
            </section>
          )}

          {services && (
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <ServiceCard
                icon={Server}
                name="API"
                service={api}
                history={history.api}
                rows={[
                  ["Node", api.node],
                  ["Environment", api.env],
                  ["Deployed commit", api.deploy.commit && `${api.deploy.commit}${api.deploy.branch ? ` (${api.deploy.branch})` : ""}`],
                  ["Service", api.deploy.service],
                  ["CPU load (1m)", `${api.cpuLoad.toFixed(2)} on ${api.cpus} CPU${api.cpus === 1 ? "" : "s"}`],
                ]}
              />

              <ServiceCard
                icon={Database}
                name="MongoDB"
                service={services.mongo}
                history={history.mongo}
                rows={[
                  ["Connection", services.mongo.state],
                  ["Collections", services.mongo.collections],
                  ["Documents", services.mongo.documents?.toLocaleString()],
                  ["Storage", services.mongo.quotaBytes ? <UsageBar used={services.mongo.usedBytes} total={services.mongo.quotaBytes} /> : undefined],
                ]}
              />

              <ServiceCard
                icon={Zap}
                name="Redis"
                service={services.redis}
                history={history.redis}
                rows={[
                  ["Memory used", bytes(services.redis.usedBytes)],
                  ["Keys", services.redis.keys?.toLocaleString()],
                ]}
              />

              <ServiceCard icon={ImageIcon} name="Cloudinary" service={services.cloudinary} rows={[["Used for", "Images & uploads"]]} />

              <ServiceCard
                icon={Mail}
                name="Email (Resend)"
                service={services.resend}
                rows={[
                  ["From", services.resend.from],
                  ...(services.resend.domains || []).map((d) => [d.name, d.status]),
                ]}
              />

              <ServiceCard
                icon={MapPin}
                name="IP geolocation"
                service={services.geo}
                rows={[
                  ["Provider", services.geo.provider],
                  ["API key", services.geo.keyConfigured ? "Configured" : "Free tier (~1000/day)"],
                ]}
              />
            </section>
          )}

          {schedulers && (
            <section className="card">
              <h2 className="text-title mb-5 inline-flex items-center gap-2">
                <Clock size={18} /> Scheduled jobs
              </h2>
              <dl className="grid gap-4 text-small sm:grid-cols-3">
                <div className="space-y-1">
                  <dt className="text-muted">Weekly report</dt>
                  <dd>{schedulers.weeklyReport.enabled ? "On — Mondays 08:00" : "Off"}</dd>
                  <dd className="text-muted text-xs">Last sent {schedulers.weeklyReport.lastSentAt ? timeAgo(schedulers.weeklyReport.lastSentAt) : "never"}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted">Notes backups</dt>
                  <dd className="capitalize">{schedulers.backups.schedule}</dd>
                  <dd className="text-muted text-xs">
                    Last run {schedulers.backups.lastRunAt ? `${timeAgo(schedulers.backups.lastRunAt)} · ${schedulers.backups.lastStatus}` : "never"}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted">Scheduled blog posts</dt>
                  <dd className="tabular-nums">{schedulers.scheduledPosts}</dd>
                  <dd className="text-muted text-xs">Checked every minute</dd>
                </div>
              </dl>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default SystemHealth;
