import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ScrollText,
  KeyRound,
  Fingerprint,
  Mail,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Activity,
} from "lucide-react";

import SkeletonCard from "../../components/common/SkeletonCard";
import { getLoginHistory, getActionLog } from "../services/audit.service";
import { countryFlag, countryName, formatDateTime, timeAgo, DEVICE_ICONS } from "../components/visitors/visitorFormat";

/* ========================================
   AUDIT LOG — every sign-in attempt (where,
   which device, which method) and every
   change made through the admin panel.
========================================= */

const TABS = [
  { id: "logins", label: "Sign-ins" },
  { id: "actions", label: "Changes" },
];

const METHOD_META = {
  password: { label: "Password", icon: KeyRound },
  google: { label: "Google", icon: Mail },
  passkey: { label: "Passkey", icon: Fingerprint },
};

const ACTION_ICONS = { POST: Plus, PUT: Pencil, PATCH: Pencil, DELETE: Trash2 };

const PAGE_SIZE = 30;

const where = (entry) =>
  entry.location?.country
    ? `${countryFlag(entry.location.country)} ${[entry.location.city, countryName(entry.location.country)].filter(Boolean).join(", ")}`
    : "🌐 Unknown location";

function Pager({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 p-4 border-t border-border text-small">
      <span className="text-muted tabular-nums">
        Page {pagination.page} of {pagination.pages} · {pagination.total} entries
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
          className="h-control aspect-square inline-flex items-center justify-center rounded-control border border-border bg-surface disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          disabled={pagination.page >= pagination.pages}
          onClick={() => onPage(pagination.page + 1)}
          className="h-control aspect-square inline-flex items-center justify-center rounded-control border border-border bg-surface disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function LoginsPanel() {
  const [page, setPage] = useState(1);
  const [failedOnly, setFailedOnly] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getLoginHistory({ page, limit: PAGE_SIZE, failed: failedOnly ? "true" : undefined })
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && toast.error("Failed to load sign-ins"));

    return () => {
      cancelled = true;
    };
  }, [page, failedOnly]);

  if (!data) return <SkeletonCard />;

  const { summary } = data;

  return (
    <div className="space-y-6">
      {summary && (
        <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            ["Sign-in attempts", summary.total, "Last 30 days"],
            ["Failed attempts", summary.failed, summary.failed ? "Review the entries marked failed" : "None — good"],
            ["Different IPs", summary.uniqueIps],
            ["Countries", summary.countries.length, summary.countries.map(countryFlag).join(" ")],
          ].map(([label, value, hint]) => (
            <div key={label} className="card space-y-2">
              <p className="text-small">{label}</p>
              <p className="text-heading tabular-nums">{value}</p>
              {hint && <p className="text-muted text-xs truncate">{hint}</p>}
            </div>
          ))}
        </section>
      )}

      <section className="card p-0 overflow-hidden">
        <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
          <h2 className="text-title">Sign-in history</h2>
          <label className="inline-flex items-center gap-2 text-small cursor-pointer select-none">
            <input
              type="checkbox"
              checked={failedOnly}
              onChange={(e) => {
                setFailedOnly(e.target.checked);
                setPage(1);
              }}
            />
            Failed only
          </label>
        </div>

        {!data.items.length ? (
          <p className="text-body p-5">No sign-ins recorded yet. They&apos;re logged from now on.</p>
        ) : (
          <div className="divide-y divide-border">
            {data.items.map((entry) => {
              const method = METHOD_META[entry.method] || METHOD_META.password;
              const MethodIcon = method.icon;
              const DeviceIcon = DEVICE_ICONS[entry.device] || DEVICE_ICONS.desktop;

              return (
                <div
                  key={entry._id}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_auto] items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {entry.success ? (
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Succeeded" />
                    ) : (
                      <XCircle size={18} className="shrink-0 text-red-500" aria-label="Failed" />
                    )}
                    <div className="min-w-0">
                      <p className="text-small font-medium truncate">{entry.actorEmail || "Unknown account"}</p>
                      <p className="text-muted text-xs inline-flex items-center gap-1.5">
                        <MethodIcon size={12} /> {method.label}
                        {!entry.success && entry.reason && <span className="truncate">· {entry.reason}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 text-xs">
                    <p className="text-small truncate">{where(entry)}</p>
                    <p className="text-muted truncate font-mono">
                      {entry.ip || "—"}
                      {entry.network && <span className="font-sans"> · {entry.network}</span>}
                    </p>
                  </div>

                  <p className="text-xs text-muted inline-flex items-center gap-1.5 min-w-0">
                    <DeviceIcon size={13} className="shrink-0" />
                    <span className="truncate">{[entry.browser, entry.os].filter(Boolean).join(" · ") || "Unknown device"}</span>
                  </p>

                  <p className="text-muted text-xs md:text-right whitespace-nowrap" title={formatDateTime(entry.createdAt)}>
                    {timeAgo(entry.createdAt)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <Pager pagination={data.pagination} onPage={setPage} />
      </section>
    </div>
  );
}

function ActionsPanel() {
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getActionLog({ page, limit: PAGE_SIZE, resource: resource || undefined })
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && toast.error("Failed to load changes"));

    return () => {
      cancelled = true;
    };
  }, [page, resource]);

  if (!data) return <SkeletonCard />;

  return (
    <section className="card p-0 overflow-hidden">
      <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div>
          <h2 className="text-title">Changes</h2>
          <p className="text-muted text-xs mt-1">Creates, edits and deletes made in the admin. Repeated autosaves count once a minute.</p>
        </div>

        <select
          value={resource}
          onChange={(e) => {
            setResource(e.target.value);
            setPage(1);
          }}
          className="h-control px-3 rounded-control border border-border bg-surface text-small capitalize"
          aria-label="Filter by area"
        >
          <option value="">All areas</option>
          {data.resources.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {!data.items.length ? (
        <p className="text-body p-5">No changes recorded yet. They&apos;re logged from now on.</p>
      ) : (
        <div className="divide-y divide-border">
          {data.items.map((entry) => {
            const Icon = ACTION_ICONS[entry.httpMethod] || Activity;

            return (
              <div key={entry._id} className="grid gap-3 px-5 py-3.5 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_auto] items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-8 w-8 shrink-0 rounded-full border border-border bg-surface inline-flex items-center justify-center">
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-small truncate">
                      <span className="capitalize">{entry.action}</span> <span className="text-muted">in</span>{" "}
                      <span className="capitalize font-medium">{entry.resource}</span>
                      {entry.label && <span className="text-muted"> · “{entry.label}”</span>}
                    </p>
                    <p className="text-muted text-xs truncate font-mono">
                      {entry.httpMethod} {entry.path}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted truncate">
                  {entry.actorEmail} · {where(entry)}
                </p>

                <p className="text-muted text-xs md:text-right whitespace-nowrap" title={formatDateTime(entry.createdAt)}>
                  {timeAgo(entry.createdAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Pager pagination={data.pagination} onPage={setPage} />
    </section>
  );
}

function AuditLog() {
  const [tab, setTab] = useState("logins");

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <section>
        <h1 className="text-heading inline-flex items-center gap-3">
          <ScrollText size={28} /> Audit Log
        </h1>
        <p className="text-body mt-3">Who signed in, from where — and what changed. Entries are kept for a year.</p>
      </section>

      <div className="flex gap-2 border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-small -mb-px border-b-2 transition ${tab === t.id ? "border-primary font-medium" : "border-transparent text-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "logins" ? <LoginsPanel /> : <ActionsPanel />}
    </div>
  );
}

export default AuditLog;
