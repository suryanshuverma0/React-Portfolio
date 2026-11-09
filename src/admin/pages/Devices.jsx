import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";
import {
  Smartphone,
  Monitor,
  Tablet,
  Download,
  QrCode,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Share,
  PlusSquare,
  BellRing,
  Trash2,
  ShieldCheck,
  MapPin,
  KeyRound,
  Fingerprint,
  Globe,
  Clock3,
} from "lucide-react";

import PushToggle from "../components/devices/PushToggle";
import ConfirmModal from "../components/ui/ConfirmModal";
import { canPromptInstall, promptInstall, onInstallChange, isStandalone, isIOS } from "../../lib/pwa";
import {
  getSessions,
  revokeSession,
  revokeOtherSessions,
  createQrLogin,
  getQrStatus,
  getPushDevices,
  removePushDevice,
} from "../services/account.service";
import { countryFlag, countryName } from "../components/dashboard/format";

/* ========================================
   DEVICES — use the admin like an app on any
   device, sign a new device in by QR, and see
   / remove every device that's signed in or
   receiving notifications.
========================================= */

const timeAgo = (date) => {
  if (!date) return "—";
  const s = Math.round((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};

const METHOD = {
  password: { label: "Password", icon: KeyRound },
  google: { label: "Google", icon: Globe },
  passkey: { label: "Passkey", icon: Fingerprint },
  qr: { label: "QR code", icon: QrCode },
  legacy: { label: "Earlier sign-in", icon: KeyRound },
};

// Rendered as one component (not chosen during render) — phone / tablet / desktop.
function DeviceIcon({ kind = "", size = 18, className }) {
  if (/mobile|phone|iphone|android/i.test(kind)) return <Smartphone size={size} className={className} />;
  if (/tablet|ipad/i.test(kind)) return <Tablet size={size} className={className} />;
  return <Monitor size={size} className={className} />;
}

function Card({ icon: Icon, title, subtitle, right, children }) {
  return (
    <section className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface">
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-title">{title}</h2>
            {subtitle && <p className="text-small mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/* ---------- install ---------- */

function InstallCard() {
  const [, force] = useState(0);
  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);

  const installed = isStandalone();
  const ios = isIOS();

  return (
    <Card icon={Download} title="Use it like an app" subtitle="Home-screen icon, full screen, notifications — no app store needed.">
      {installed ? (
        <p className="flex items-center gap-2 rounded-control bg-emerald-500/10 px-4 py-3 text-small text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={18} /> You&apos;re using the installed app on this device.
        </p>
      ) : canPromptInstall() ? (
        <button
          type="button"
          onClick={async () => {
            const outcome = await promptInstall();
            if (outcome === "accepted") toast.success("Installed — find SV Admin on your home screen");
          }}
          className="inline-flex h-11 items-center gap-2 rounded-control bg-primary px-5 font-medium text-background"
        >
          <Download size={17} /> Install SV Admin
        </button>
      ) : ios ? (
        <ol className="space-y-3 text-small">
          <li className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-xs font-semibold">1</span>
            Open this page in <b>Safari</b>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-xs font-semibold">2</span>
            Tap <Share size={16} className="inline" /> <b>Share</b>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-xs font-semibold">3</span>
            Choose <PlusSquare size={16} className="inline" /> <b>Add to Home Screen</b>
          </li>
        </ol>
      ) : (
        <p className="text-small text-muted">
          Open your browser menu and choose <b className="text-primary">Install app</b> (or <b className="text-primary">Add to Home screen</b>). On a phone, the easiest way is to sign it in with the QR code below, then install from there.
        </p>
      )}
    </Card>
  );
}

/* ---------- QR sign-in ---------- */

function QrSignIn({ onLinked }) {
  const [qr, setQr] = useState(null); // { id, url, expiresAt }
  const [status, setStatus] = useState("idle"); // idle | loading | pending | approved | expired
  const [device, setDevice] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef(null);

  const stop = () => clearInterval(pollRef.current);

  const create = async () => {
    stop();
    setStatus("loading");
    try {
      const data = await createQrLogin();
      setQr(data);
      setStatus("pending");
    } catch (error) {
      setStatus("idle");
      toast.error(error.response?.data?.message || "Couldn't create a sign-in code");
    }
  };

  useEffect(() => {
    if (status !== "pending" || !qr) return undefined;
    pollRef.current = setInterval(async () => {
      setNow(Date.now());
      if (Date.now() > new Date(qr.expiresAt).getTime()) {
        stop();
        setStatus("expired");
        return;
      }
      try {
        const s = await getQrStatus(qr.id);
        if (s.status === "approved") {
          stop();
          setDevice(s.device || "Your device");
          setStatus("approved");
          onLinked?.();
        }
      } catch {
        /* keep polling */
      }
    }, 1500);
    return stop;
  }, [status, qr, onLinked]);

  const left = qr ? Math.max(0, Math.round((new Date(qr.expiresAt).getTime() - now) / 1000)) : 0;

  return (
    <Card icon={QrCode} title="Sign in on your phone or tablet" subtitle="Scan with the camera — no password typing on a small screen.">
      <div className="grid items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="relative mx-auto flex h-56 w-56 items-center justify-center rounded-3xl border border-border bg-white p-4">
          <AnimatePresence mode="wait">
            {status === "pending" && qr ? (
              <motion.div key={qr.id} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <QRCode value={qr.url} size={192} level="M" fgColor="#0a0a0a" bgColor="#ffffff" />
              </motion.div>
            ) : status === "approved" ? (
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-2 text-center text-[#0a0a0a]">
                <CheckCircle2 size={56} className="text-emerald-600" />
                <p className="text-sm font-semibold">Signed in</p>
                <p className="text-xs text-neutral-600">{device}</p>
              </motion.div>
            ) : (
              <motion.button
                key="start"
                type="button"
                onClick={create}
                disabled={status === "loading"}
                className="flex flex-col items-center gap-2 text-[#0a0a0a]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <QrCode size={64} className={status === "loading" ? "animate-pulse" : ""} />
                <span className="text-sm font-semibold">{status === "expired" ? "Code expired — tap for a new one" : "Show sign-in code"}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <ol className="space-y-2.5 text-small">
            <li>1. Open the camera on your phone or tablet.</li>
            <li>2. Point it at the code and tap the link that appears.</li>
            <li>3. Tap <b>Sign in</b> — you&apos;re in, then install it as an app.</li>
          </ol>
          {status === "pending" && (
            <div className="space-y-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-[var(--color-chart-1)] transition-[width] duration-1000 ease-linear" style={{ width: `${(left / 120) * 100}%` }} />
              </div>
              <p className="flex items-center justify-between text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-chart-1)]" /> Waiting for your device… expires in {left}s
                </span>
                <button type="button" onClick={create} className="inline-flex items-center gap-1 hover:text-primary">
                  <RefreshCw size={12} /> New code
                </button>
              </p>
            </div>
          )}
          {status === "approved" && (
            <button type="button" onClick={create} className="inline-flex items-center gap-2 rounded-control border border-border px-4 py-2 text-small hover:bg-surface">
              <QrCode size={15} /> Sign in another device
            </button>
          )}
          <p className="flex items-start gap-2 text-xs text-muted">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            Each code works once and only for 2 minutes. You&apos;ll get a security alert whenever a device signs in this way.
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ---------- signed-in sessions ---------- */

function SessionRow({ session, onRevoke }) {
  const method = METHOD[session.method] || METHOD.password;
  const place = [session.location?.city, session.location?.country && countryName(session.location.country)].filter(Boolean).join(", ");

  return (
    <motion.li layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 rounded-2xl border border-border p-3 sm:p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${session.current ? "bg-[color-mix(in_srgb,var(--color-chart-1)_15%,transparent)] text-[var(--color-chart-1)]" : "bg-surface"}`}>
        <DeviceIcon kind={session.device} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-small font-medium text-primary">
          <span className="truncate">{[session.browser, session.os].filter(Boolean).join(" · ") || "Unknown device"}</span>
          {session.current && <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">This device</span>}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
          {place && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} /> {session.location?.country ? `${countryFlag(session.location.country)} ` : ""}
              {place}
            </span>
          )}
          {session.ip && <span className="font-mono">{session.ip}</span>}
          <span className="inline-flex items-center gap-1">
            <method.icon size={11} /> {method.label}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 size={11} /> {session.current ? "Active now" : `Active ${timeAgo(session.lastUsedAt)}`}
          </span>
        </p>
      </div>
      {!session.current && (
        <button type="button" onClick={() => onRevoke(session)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-red-500/50 hover:text-red-500">
          <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
        </button>
      )}
    </motion.li>
  );
}

function Devices() {
  const [sessions, setSessions] = useState(null);
  const [pushDevices, setPushDevices] = useState([]);
  const [confirm, setConfirm] = useState(null); // { type: "one", session } | { type: "others" }
  const [busy, setBusy] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  const load = useCallback(() => {
    getSessions()
      .then(setSessions)
      .catch(() => toast.error("Couldn't load signed-in devices"));
    getPushDevices()
      .then(setPushDevices)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runConfirm = async () => {
    setBusy(true);
    try {
      if (confirm.type === "one") {
        await revokeSession(confirm.session.id);
        toast.success("That device was signed out");
      } else {
        const result = await revokeOtherSessions();
        toast.success(result?.count ? `Signed out ${result.count} other device${result.count === 1 ? "" : "s"}` : "No other devices were signed in");
      }
      setConfirm(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't sign that device out");
    } finally {
      setBusy(false);
    }
  };

  const removePush = async (device) => {
    try {
      await removePushDevice(device.id);
      setPushDevices((list) => list.filter((d) => d.id !== device.id));
      toast.success("That device won't get notifications any more");
    } catch {
      toast.error("Couldn't remove it");
    }
  };

  const active = sessions?.active || [];
  const others = active.filter((s) => !s.current).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section>
        <h1 className="text-heading">Devices</h1>
        <p className="text-body mt-2">Your admin on every screen — install it, sign in with a QR code, and control who&apos;s signed in.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <InstallCard />
        <Card icon={BellRing} title="Notifications" subtitle="Visitor, message and security alerts on this device.">
          <PushToggle onChange={load} />
        </Card>
      </div>

      <QrSignIn onLinked={load} />

      <Card
        icon={ShieldCheck}
        title="Signed-in devices"
        subtitle={sessions ? `${active.length} active session${active.length === 1 ? "" : "s"} · sessions last 7 days from their last use` : "Loading…"}
        right={
          others > 0 && (
            <button type="button" onClick={() => setConfirm({ type: "others" })} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-red-500/50 hover:text-red-500">
              <LogOut size={14} /> Sign out all others
            </button>
          )
        }
      >
        {!sessions ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-surface" />
            ))}
          </div>
        ) : (
          <>
            <ul className="space-y-2.5">
              <AnimatePresence initial={false}>
                {active.map((s) => (
                  <SessionRow key={s.id} session={s} onRevoke={(session) => setConfirm({ type: "one", session })} />
                ))}
              </AnimatePresence>
            </ul>
            {sessions.recent?.length > 0 && (
              <div>
                <button type="button" onClick={() => setShowRecent((v) => !v)} className="text-xs text-muted underline-offset-2 hover:text-primary hover:underline">
                  {showRecent ? "Hide" : "Show"} recently signed out ({sessions.recent.length})
                </button>
                {showRecent && (
                  <ul className="mt-3 space-y-2">
                    {sessions.recent.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface/60 px-3 py-2 text-xs text-muted">
                        <span className="truncate">{[s.browser, s.os].filter(Boolean).join(" · ") || "Device"} · {s.ip}</span>
                        <span className="shrink-0">{s.revokedReason || "Expired"} · {timeAgo(s.revokedAt || s.expiresAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      <Card icon={BellRing} title="Devices getting notifications" subtitle="Remove one to stop sending it alerts.">
        {!pushDevices.length ? (
          <p className="text-small text-muted">No devices yet. Turn notifications on above, on each device you use.</p>
        ) : (
          <ul className="space-y-2">
            {pushDevices.map((d) => {
              return (
                <li key={d.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                  <DeviceIcon kind={d.label} size={18} className="shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-medium text-primary">{d.label || "Device"}</p>
                    <p className="text-xs text-muted">Added {timeAgo(d.createdAt)}{d.lastSuccessAt ? ` · last alert ${timeAgo(d.lastSuccessAt)}` : ""}</p>
                  </div>
                  <button type="button" onClick={() => removePush(d)} aria-label="Remove device" className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <ConfirmModal
        isOpen={Boolean(confirm)}
        title={confirm?.type === "others" ? "Sign out all other devices?" : "Sign out this device?"}
        message={
          confirm?.type === "others"
            ? "Every device except this one will be signed out immediately."
            : `${[confirm?.session?.browser, confirm?.session?.os].filter(Boolean).join(" · ") || "That device"} will be signed out immediately.`
        }
        confirmText="Sign out"
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
        loading={busy}
      />
    </div>
  );
}

export default Devices;
