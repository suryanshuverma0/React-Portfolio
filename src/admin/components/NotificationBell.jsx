import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Eye, AlertTriangle, CheckCheck, Settings2 } from "lucide-react";

import { getAlerts, markAlertRead, markAllAlertsRead } from "../services/automation.service";

/* ========================================
   Header bell — in-app copy of every alert
   (long visits, backup failures). Polls
   once a minute while the panel is open.
========================================= */

const POLL_MS = 60 * 1000;

const ICONS = { long_visit: Eye, backup_failed: AlertTriangle, test: Bell };

const timeAgo = (date) => {
  const s = Math.round((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ alerts: [], unread: 0 });
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      setState(await getAlerts(20));
    } catch {
      /* the bell just stays as it was */
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

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const openAlert = async (alert) => {
    setOpen(false);
    if (!alert.read) {
      markAlertRead(alert._id).catch(() => {});
      setState((s) => ({
        alerts: s.alerts.map((a) => (a._id === alert._id ? { ...a, read: true } : a)),
        unread: Math.max(0, s.unread - 1),
      }));
    }
    if (alert.link) navigate(alert.link);
  };

  const readAll = async () => {
    await markAllAlertsRead().catch(() => {});
    setState((s) => ({ alerts: s.alerts.map((a) => ({ ...a, read: true })), unread: 0 }));
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={state.unread ? `${state.unread} unread notifications` : "Notifications"}
        className="relative h-10 w-10 flex items-center justify-center rounded-control bg-surface border border-border hover:opacity-80 transition"
      >
        <Bell size={18} />
        {state.unread > 0 && (
          <span className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white flex items-center justify-center">
            {state.unread > 9 ? "9+" : state.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-label">Notifications</p>
            <div className="flex items-center gap-1">
              {state.unread > 0 && (
                <button type="button" onClick={readAll} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface">
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/dashboard/automations");
                }}
                title="Alert settings"
                className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface"
              >
                <Settings2 size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-1">
            {!state.alerts.length ? (
              <p className="px-4 py-8 text-center text-small text-muted">
                No notifications yet. You&apos;ll see one when someone spends a while on your portfolio.
              </p>
            ) : (
              state.alerts.map((alert) => {
                const Icon = ICONS[alert.type] || Bell;
                return (
                  <button
                    key={alert._id}
                    type="button"
                    onClick={() => openAlert(alert)}
                    className={`flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface ${alert.read ? "opacity-70" : ""}`}
                  >
                    <span
                      className={`mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
                        alert.type === "backup_failed" ? "bg-red-500/12 text-red-500" : "bg-surface text-primary"
                      }`}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-small font-medium">{alert.title}</span>
                        {!alert.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-chart-1)]" />}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{alert.body}</span>
                      <span className="mt-1 block text-[11px] text-muted">
                        {timeAgo(alert.createdAt)}
                        {alert.emailedAt ? " · emailed" : ""}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
