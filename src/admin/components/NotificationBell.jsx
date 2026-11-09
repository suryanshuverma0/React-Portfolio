import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Eye,
  AlertTriangle,
  CheckCheck,
  Settings2,
  Building2,
  ShieldAlert,
  Trash2,
  Check,
  Circle,
  X,
} from "lucide-react";

import {
  getAlerts,
  markAlertRead,
  markAlertUnread,
  markAllAlertsRead,
  deleteAlert,
  clearAlerts,
} from "../services/automation.service";
import { setAppBadge } from "../../lib/pwa";
import PushToggle from "./devices/PushToggle";

/* ========================================
   NOTIFICATIONS — in-app inbox for every
   alert (long visits, companies, security,
   backups). On phones it opens as a full-
   width sheet; each alert can be marked
   read/unread or deleted. Alerts can also
   be pushed to this device as system
   notifications (phone, tablet, desktop).
========================================= */

const POLL_MS = 60 * 1000;

const ICONS = {
  long_visit: Eye,
  company_visit: Building2,
  security: ShieldAlert,
  backup_failed: AlertTriangle,
  test: Bell,
};

const timeAgo = (date) => {
  const s = Math.round((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

function IconBtn({ label, onClick, children, danger }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={`h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg text-muted transition hover:bg-background ${danger ? "hover:text-red-500" : "hover:text-primary"}`}
    >
      {children}
    </button>
  );
}

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [state, setState] = useState({ alerts: [], unread: 0 });
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await getAlerts(50);
      setState(data);
      setAppBadge(data.unread);
    } catch {
      /* the bell just stays as it was */
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, POLL_MS);
    // A push arrived while the app is open — refresh right away.
    const onMessage = (event) => event.data?.type === "admin-alert" && load();
    navigator.serviceWorker?.addEventListener("message", onMessage);
    const onFocus = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const update = (fn) =>
    setState((s) => {
      const next = fn(s);
      const unread = next.alerts.filter((a) => !a.read).length;
      setAppBadge(unread);
      return { ...next, unread };
    });

  const toggleRead = (alert) => {
    (alert.read ? markAlertUnread : markAlertRead)(alert._id).catch(() => load());
    update((s) => ({ alerts: s.alerts.map((a) => (a._id === alert._id ? { ...a, read: !a.read } : a)) }));
  };

  const remove = (alert) => {
    deleteAlert(alert._id).catch(() => load());
    update((s) => ({ alerts: s.alerts.filter((a) => a._id !== alert._id) }));
  };

  const openAlert = (alert) => {
    setOpen(false);
    if (!alert.read) {
      markAlertRead(alert._id).catch(() => {});
      update((s) => ({ alerts: s.alerts.map((a) => (a._id === alert._id ? { ...a, read: true } : a)) }));
    }
    if (alert.link) navigate(alert.link);
  };

  const readAll = async () => {
    update((s) => ({ alerts: s.alerts.map((a) => ({ ...a, read: true })) }));
    await markAllAlertsRead().catch(() => load());
  };

  const clearAll = async () => {
    setConfirmClear(false);
    update(() => ({ alerts: [] }));
    await clearAlerts().catch(() => load());
  };

  const visible = filter === "unread" ? state.alerts.filter((a) => !a.read) : state.alerts;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={state.unread ? `${state.unread} unread notifications` : "Notifications"}
        aria-expanded={open}
        className="relative h-10 w-10 flex items-center justify-center rounded-control bg-surface border border-border hover:opacity-80 transition"
      >
        <Bell size={18} />
        <AnimatePresence>
          {state.unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white flex items-center justify-center ring-2 ring-background"
            >
              {state.unread > 9 ? "9+" : state.unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            // Phones: a full-width sheet under the header. Larger: dropdown.
            className="fixed inset-x-2 top-[68px] z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[400px] flex max-h-[calc(100dvh-84px)] sm:max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-label">Notifications</p>
                {state.unread > 0 && <span className="rounded-full bg-red-500/12 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400">{state.unread} new</span>}
              </div>
              <div className="flex items-center gap-0.5">
                {state.unread > 0 && (
                  <button type="button" onClick={readAll} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface hover:text-primary">
                    <CheckCheck size={14} /> <span className="hidden min-[380px]:inline">Mark all read</span>
                  </button>
                )}
                <IconBtn
                  label="Alert settings"
                  onClick={() => {
                    setOpen(false);
                    navigate("/dashboard/automations");
                  }}
                >
                  <Settings2 size={15} />
                </IconBtn>
                <IconBtn label="Close" onClick={() => setOpen(false)}>
                  <X size={16} />
                </IconBtn>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
              <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
                {[
                  ["all", `All ${state.alerts.length ? `(${state.alerts.length})` : ""}`],
                  ["unread", `Unread ${state.unread ? `(${state.unread})` : ""}`],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    className={`rounded-md px-2.5 py-1 transition ${filter === id ? "bg-background font-medium text-primary shadow-sm" : "text-muted"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {state.alerts.length > 0 &&
                (confirmClear ? (
                  <span className="flex items-center gap-1 text-xs">
                    <span className="text-muted">Delete all?</span>
                    <button type="button" onClick={clearAll} className="rounded-md px-2 py-1 font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400">
                      Yes
                    </button>
                    <button type="button" onClick={() => setConfirmClear(false)} className="rounded-md px-2 py-1 text-muted hover:bg-surface">
                      No
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmClear(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-surface hover:text-red-500">
                    <Trash2 size={12} /> Clear all
                  </button>
                ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-1.5 admin-scroll">
              {!visible.length ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-muted">
                    <CheckCheck size={18} />
                  </span>
                  <p className="text-small text-muted">
                    {filter === "unread" && state.alerts.length ? "You're all caught up." : "No notifications yet. You'll see one when someone spends a while on your portfolio."}
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {visible.map((alert) => {
                    const Icon = ICONS[alert.type] || Bell;
                    return (
                      <motion.div
                        key={alert._id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                        transition={{ duration: 0.18 }}
                        className={`group flex w-full gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-surface ${alert.read ? "" : "bg-surface/60"}`}
                      >
                        <button type="button" onClick={() => openAlert(alert)} className="flex min-w-0 flex-1 gap-3 text-left">
                          <span
                            className={`mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
                              alert.type === "backup_failed" || alert.type === "security" ? "bg-red-500/12 text-red-500" : "bg-surface text-primary"
                            }`}
                          >
                            <Icon size={15} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className={`truncate text-small ${alert.read ? "text-secondary" : "font-semibold"}`}>{alert.title}</span>
                              {!alert.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-chart-1)]" aria-label="Unread" />}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{alert.body}</span>
                            <span className="mt-1 block text-[11px] text-muted">
                              {timeAgo(alert.createdAt)}
                              {alert.emailedAt ? " · emailed" : ""}
                            </span>
                          </span>
                        </button>
                        {/* Always visible on touch screens, on hover elsewhere */}
                        <span className="flex shrink-0 flex-col gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition">
                          <IconBtn label={alert.read ? "Mark as unread" : "Mark as read"} onClick={() => toggleRead(alert)}>
                            {alert.read ? <Circle size={13} /> : <Check size={15} />}
                          </IconBtn>
                          <IconBtn label="Delete" onClick={() => remove(alert)} danger>
                            <Trash2 size={14} />
                          </IconBtn>
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            <div className="border-t border-border px-3 py-2.5">
              <PushToggle compact />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell;
