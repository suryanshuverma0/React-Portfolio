import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Lock, LockOpen, Fingerprint, KeyRound, ShieldCheck, Loader2, Copy, Download, Eye, EyeOff, ArrowLeft, Smartphone, LifeBuoy } from "lucide-react";

import {
  useLifeLock, refreshLifeLock, setupLifeLock, unlockWithPassphrase, unlockWithFingerprint, startReset, finishReset, lockNow, noteLifeActivity,
} from "./lifeLockStore";

/* ========================================
   LIFE GATE — wraps every personal page
   (notes, life dashboard, planner …). Shows
   set-up, unlock or recovery until the
   server confirms the area is open, then a
   slim "unlocked" bar with Lock now.
========================================= */

const message = (e, fallback) => e?.response?.data?.message || (e?.name === "NotAllowedError" ? "Fingerprint was cancelled" : fallback);

function PassInput({ value, onChange, placeholder, autoFocus, name = "passphrase", autoComplete = "current-password" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center rounded-xl border border-border bg-surface px-3 focus-within:border-primary">
      <KeyRound size={16} className="shrink-0 text-muted" />
      <input
        type={show ? "text" : "password"}
        name={name}
        autoComplete={autoComplete}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 min-w-0 flex-1 bg-transparent px-2.5 text-[15px] outline-none focus-visible:outline-none"
      />
      <button type="button" onClick={() => setShow((s) => !s)} className="p-1 text-muted hover:text-primary" aria-label={show ? "Hide passphrase" : "Show passphrase"}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

const strength = (p) => {
  let score = 0;
  if (p.length >= 8) score += 1;
  if (p.length >= 14) score += 1;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
  if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) score += 1;
  if (/\s/.test(p) && p.length >= 16) score += 1;
  return Math.min(score, 4);
};

function Shell({ icon: Icon = Lock, title, subtitle, children }) {
  return (
    <div className="flex min-h-[calc(100dvh-10rem)] items-center justify-center px-2 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-md">
        <div className="mb-7 flex justify-center" style={{ perspective: 600 }}>
          <motion.div
            initial={{ rotateY: -35, rotateX: 12 }}
            animate={{ rotateY: [-35, 20, -10, 0], rotateX: [12, -6, 4, 0] }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-border bg-gradient-to-br from-surface to-background shadow-[0_25px_50px_-20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <span className="absolute inset-2 rounded-[22px] bg-[conic-gradient(from_0deg,transparent,var(--color-chart-1),transparent_40%)] opacity-25 blur-md motion-safe:animate-[spin_6s_linear_infinite]" aria-hidden />
            <Icon size={38} strokeWidth={1.6} style={{ transform: "translateZ(24px)" }} />
          </motion.div>
        </div>
        <h1 className="text-center text-[26px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mx-auto mt-2 max-w-sm text-center text-small text-muted">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </motion.div>
    </div>
  );
}

function RecoveryCode({ code, onDone }) {
  const [saved, setSaved] = useState(false);
  const download = () => {
    const blob = new Blob([`Life lock recovery code\n\n${code}\n\nKeep this somewhere safe and offline. It resets your life passphrase once.\nCreated ${new Date().toLocaleString()}\n`], { type: "text/plain" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "life-lock-recovery-code.txt" });
    a.click();
    URL.revokeObjectURL(a.href);
    setSaved(true);
  };
  return (
    <Shell icon={LifeBuoy} title="Save your recovery code" subtitle="If you ever forget the passphrase, this code lets you set a new one. It's shown only now.">
      <div className="space-y-4">
        <p className="select-all rounded-2xl border border-border bg-surface px-4 py-5 text-center font-mono text-[18px] tracking-[0.12em]">{code}</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-outline" onClick={() => navigator.clipboard.writeText(code).then(() => { toast.success("Copied"); setSaved(true); })}>
            <Copy size={15} /> Copy
          </button>
          <button type="button" className="btn btn-outline" onClick={download}>
            <Download size={15} /> Download
          </button>
        </div>
        <label className="flex items-start gap-2.5 text-small text-secondary">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-1" />
          I&apos;ve stored it somewhere safe (password manager, paper) — not in these notes.
        </label>
        <button type="button" disabled={!saved} onClick={onDone} className="btn btn-primary w-full disabled:opacity-40">
          Continue
        </button>
      </div>
    </Shell>
  );
}

function Setup({ onRecovery }) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [minutes, setMinutes] = useState(15);
  const [busy, setBusy] = useState(false);
  const score = strength(p1);

  const submit = async (e) => {
    e.preventDefault();
    if (p1.length < 8) return toast.error("Use at least 8 characters");
    if (p1 !== p2) return toast.error("The two passphrases don't match");
    setBusy(true);
    try {
      const { recoveryCode } = await setupLifeLock(p1, minutes);
      onRecovery(recoveryCode);
    } catch (err) {
      toast.error(message(err, "Couldn't set up the lock"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell icon={ShieldCheck} title="Lock your personal space" subtitle="Notes, planner, vault and the rest of your life pages get a second lock — a passphrase only you know, separate from your admin password.">
      <form onSubmit={submit} className="space-y-3">
        <PassInput value={p1} onChange={setP1} placeholder="New passphrase" autoFocus name="new-life-passphrase" autoComplete="new-password" />
        <div className="flex gap-1 px-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i < score ? (score >= 3 ? "bg-emerald-500" : "bg-amber-500") : "bg-border"}`} />
          ))}
        </div>
        <PassInput value={p2} onChange={setP2} placeholder="Repeat it" name="confirm-life-passphrase" autoComplete="new-password" />
        <p className="px-1 text-[12px] text-muted">Tip: a short sentence only you would say is strong and easy to remember.</p>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-small">
          Lock again after
          <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="rounded-lg border border-border bg-surface px-2 py-1 text-small">
            {[5, 10, 15, 30, 60, 120].map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${m / 60} h`} idle
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Set up the lock
        </button>
      </form>
    </Shell>
  );
}

function Recover({ status, onBack, onRecovery }) {
  const [method, setMethod] = useState(null);
  const [code, setCode] = useState("");
  const [grant, setGrant] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(message(e, "That didn't work"));
    } finally {
      setBusy(false);
    }
  };

  if (grant) {
    return (
      <Shell icon={KeyRound} title="Choose a new passphrase" subtitle="Verified. Set the new passphrase — other devices will be locked.">
        <form onSubmit={(e) => { e.preventDefault(); run(async () => onRecovery((await finishReset(grant, next)).recoveryCode)); }} className="space-y-3">
          <PassInput value={next} onChange={setNext} placeholder="New passphrase" autoFocus name="new-life-passphrase" autoComplete="new-password" />
          <button type="submit" disabled={busy || next.length < 8} className="btn btn-primary w-full disabled:opacity-40">
            {busy && <Loader2 size={16} className="animate-spin" />} Save and unlock
          </button>
        </form>
      </Shell>
    );
  }

  const options = [
    status.passkeys > 0 && { id: "fingerprint", icon: Fingerprint, label: "Fingerprint / face / device PIN", hint: "Uses a passkey on this account" },
    { id: "recovery", icon: LifeBuoy, label: "Recovery code", hint: "The code you saved when you set this up" },
    status.mfa && { id: "mfa", icon: Smartphone, label: "Authenticator code", hint: "6 digits from your authenticator app" },
  ].filter(Boolean);

  return (
    <Shell icon={LifeBuoy} title="Forgot your passphrase?" subtitle="Prove it's you another way, then set a new one.">
      {!method || method === "fingerprint" ? (
        <div className="space-y-2">
          {options.map(({ id, icon: Icon, label, hint }) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              onClick={() => (id === "fingerprint" ? run(async () => setGrant((await unlockWithFingerprint("reset")).grant)) : setMethod(id))}
              className="flex w-full items-center gap-3 rounded-2xl border border-border p-4 text-left transition hover:border-primary"
            >
              <Icon size={20} />
              <span className="flex-1">
                <span className="block text-small font-medium">{label}</span>
                <span className="text-xs text-muted">{hint}</span>
              </span>
              {busy && id === "fingerprint" && <Loader2 size={16} className="animate-spin" />}
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); run(async () => setGrant(await startReset(method, code))); }} className="space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            inputMode={method === "mfa" ? "numeric" : "text"}
            autoComplete="one-time-code"
            placeholder={method === "mfa" ? "123 456" : "XXXXX-XXXXX-XXXXX-XXXXX"}
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-center font-mono tracking-widest outline-none focus:border-primary"
          />
          <button type="submit" disabled={busy || code.trim().length < 6} className="btn btn-primary w-full disabled:opacity-40">
            {busy && <Loader2 size={16} className="animate-spin" />} Verify
          </button>
        </form>
      )}
      <button type="button" onClick={method ? () => setMethod(null) : onBack} className="mx-auto mt-5 flex items-center gap-1.5 text-xs text-muted hover:text-primary">
        <ArrowLeft size={13} /> Back
      </button>
    </Shell>
  );
}

function Unlock({ status, onForgot }) {
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState("");
  const [shake, setShake] = useState(0);
  const lockedOut = status.lockedUntil && new Date(status.lockedUntil) > new Date();

  const go = async (kind, fn) => {
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      setShake((n) => n + 1);
      setPassphrase("");
      toast.error(message(e, "Couldn't unlock"));
      refreshLifeLock();
    } finally {
      setBusy("");
    }
  };

  return (
    <Shell title="Personal space locked" subtitle={lockedOut ? `Too many wrong tries — passphrase unlock is paused until ${new Date(status.lockedUntil).toLocaleTimeString()}.` : "Enter your life passphrase to continue."}>
      <motion.form
        key={shake}
        animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (passphrase) go("pass", () => unlockWithPassphrase(passphrase));
        }}
        className="space-y-3"
      >
        <PassInput value={passphrase} onChange={setPassphrase} placeholder="Passphrase" autoFocus={!lockedOut} />
        <button type="submit" disabled={Boolean(busy) || !passphrase || lockedOut} className="btn btn-primary w-full disabled:opacity-40">
          {busy === "pass" ? <Loader2 size={16} className="animate-spin" /> : <LockOpen size={16} />} Unlock
        </button>
        {status.passkeys > 0 && (
          <button type="button" disabled={Boolean(busy)} onClick={() => go("finger", () => unlockWithFingerprint("unlock"))} className="btn btn-outline w-full">
            {busy === "finger" ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />} Use fingerprint
          </button>
        )}
      </motion.form>
      <button type="button" onClick={onForgot} className="mx-auto mt-5 block text-xs text-muted hover:text-primary">
        Forgot your passphrase?
      </button>
    </Shell>
  );
}

function UnlockedBar({ status, bleed }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, []);
  const minutesLeft = status.expiresAt ? Math.max(0, Math.round((status.expiresAt - now) / 60000)) : status.autoLockMinutes;
  return (
    <div className={`flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface/60 px-3 py-1.5 text-[12px] text-muted ${bleed ? "m-2 mb-0" : "mb-4"}`}>
      <LockOpen size={13} className="text-emerald-500" />
      <span className="flex-1 truncate">Personal space unlocked · locks after {status.autoLockMinutes} min idle{minutesLeft <= 2 ? ` · ${minutesLeft} min left` : ""}</span>
      <button type="button" onClick={lockNow} className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-medium text-primary hover:bg-background">
        <Lock size={12} /> Lock now
      </button>
    </div>
  );
}

// `bleed` = edge-to-edge pages (the notes workspace) that fill the height.
function LifeGate({ children, bleed = false }) {
  const status = useLifeLock();
  const [view, setView] = useState("main");
  const [recovery, setRecovery] = useState("");
  const throttle = useRef(0);

  useEffect(() => {
    refreshLifeLock();
  }, []);

  // Activity on a personal page keeps the area open (and the server in step).
  useEffect(() => {
    if (!status.unlocked) return undefined;
    const onActivity = () => {
      if (Date.now() - throttle.current < 5000) return;
      throttle.current = Date.now();
      noteLifeActivity();
    };
    noteLifeActivity();
    const events = ["pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onActivity));
  }, [status.unlocked]);

  const screen = (node) => <div className={bleed ? "h-full overflow-y-auto px-4" : ""}>{node}</div>;

  if (recovery) {
    return screen(
      <RecoveryCode
        code={recovery}
        onDone={() => {
          setRecovery("");
          setView("main");
        }}
      />,
    );
  }
  if (status.loading) {
    return screen(
      <div className="flex min-h-[50vh] items-center justify-center text-muted">
        <Loader2 className="animate-spin" />
      </div>,
    );
  }
  if (!status.configured) return screen(<Setup onRecovery={setRecovery} />);
  if (!status.unlocked) {
    return screen(view === "forgot" ? <Recover status={status} onBack={() => setView("main")} onRecovery={setRecovery} /> : <Unlock status={status} onForgot={() => setView("forgot")} />);
  }
  if (!bleed) {
    return (
      <>
        <UnlockedBar status={status} />
        {children}
      </>
    );
  }
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <UnlockedBar status={status} bleed />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

export default LifeGate;
