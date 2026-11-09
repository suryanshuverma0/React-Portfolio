import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";
import { ShieldCheck, ShieldOff, Copy, Download, Loader2, KeyRound, RefreshCw, CheckCircle2 } from "lucide-react";

import api from "../../../lib/axios";
import ConfirmModal from "../ui/ConfirmModal";

/* ========================================
   TWO-FACTOR (MFA) — authenticator app codes
   for password and Google sign-ins, with 10
   one-time backup codes. Turning it off or
   making new backup codes needs a code.
========================================= */

const data = (r) => r.data.data;
const groupKey = (k) => k.replace(/(.{4})/g, "$1 ").trim();

function BackupCodes({ codes, onDone }) {
  const text = `Suryanshu Verma admin — backup codes\nEach code works once. Keep them somewhere safe.\n\n${codes.join("\n")}\n`;
  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-small font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={17} /> Save these backup codes now — they won&apos;t be shown again.
      </p>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-4 font-mono text-sm sm:grid-cols-5">
        {codes.map((c) => (
          <span key={c} className="text-center tracking-wider">{c}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => navigator.clipboard.writeText(text).then(() => toast.success("Copied"))} className="inline-flex h-10 items-center gap-2 rounded-control border border-border px-4 text-small hover:bg-surface">
          <Copy size={15} /> Copy
        </button>
        <button
          type="button"
          onClick={() => {
            const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "admin-backup-codes.txt";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-control border border-border px-4 text-small hover:bg-surface"
        >
          <Download size={15} /> Download .txt
        </button>
        <button type="button" onClick={onDone} className="ml-auto inline-flex h-10 items-center rounded-control bg-primary px-5 text-small font-medium text-background">
          I&apos;ve saved them
        </button>
      </div>
    </div>
  );
}

function CodePrompt({ label, onSubmit, busy, cta }) {
  const [code, setCode] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim().length >= 6) onSubmit(code.trim());
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.slice(0, 20))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder={label}
        className="h-11 w-44 rounded-control border border-border bg-surface px-4 text-center font-mono tracking-widest outline-none focus:border-primary"
        aria-label={label}
      />
      <button type="submit" disabled={busy || code.trim().length < 6} className="inline-flex h-11 items-center gap-2 rounded-control bg-primary px-5 text-small font-medium text-background disabled:opacity-40">
        {busy && <Loader2 size={15} className="animate-spin" />} {cta}
      </button>
    </form>
  );
}

function MfaCard() {
  const [status, setStatus] = useState(null);
  const [setup, setSetup] = useState(null); // { secret, otpauthUrl }
  const [codes, setCodes] = useState(null);
  const [action, setAction] = useState(null); // "disable" | "regenerate"
  const [busy, setBusy] = useState(false);
  const [confirmOff, setConfirmOff] = useState(null);

  const load = () => api.get("/account/mfa").then((r) => setStatus(data(r))).catch(() => setStatus({ enabled: false }));

  useEffect(() => {
    load();
  }, []);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0]?.message || e.response?.data?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const start = () => run(async () => setSetup(data(await api.post("/account/mfa/setup"))));

  const enable = (code) =>
    run(async () => {
      const result = data(await api.post("/account/mfa/enable", { code }));
      setSetup(null);
      setCodes(result.backupCodes);
      toast.success("Two-factor sign-in is on");
      load();
    });

  const regenerate = (code) =>
    run(async () => {
      const result = data(await api.post("/account/mfa/backup-codes", { code }));
      setAction(null);
      setCodes(result.backupCodes);
      load();
    });

  const disable = (code) =>
    run(async () => {
      await api.post("/account/mfa/disable", { code });
      setAction(null);
      setConfirmOff(null);
      toast.success("Two-factor sign-in is off");
      load();
    });

  const enabled = status?.enabled;

  return (
    <section className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${enabled ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-surface"}`}>
            {enabled ? <ShieldCheck size={19} /> : <ShieldOff size={19} />}
          </span>
          <div>
            <h2 className="text-title">Two-factor sign-in</h2>
            <p className="text-small mt-0.5">
              {enabled
                ? `On since ${new Date(status.enabledAt).toLocaleDateString(undefined, { dateStyle: "medium" })} · ${status.backupCodesLeft} backup code${status.backupCodesLeft === 1 ? "" : "s"} left`
                : "After your password or Google, also ask for a code from an authenticator app (Google Authenticator, Microsoft Authenticator, Authy…). Passkeys stay one-tap."}
            </p>
          </div>
        </div>
        {status && !enabled && !setup && !codes && (
          <button type="button" onClick={start} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-5 text-small font-medium text-background disabled:opacity-50">
            {busy && <Loader2 size={15} className="animate-spin" />} Turn on
          </button>
        )}
      </div>

      {codes && <BackupCodes codes={codes} onDone={() => setCodes(null)} />}

      {setup && (
        <div className="grid items-center gap-6 rounded-2xl border border-border p-5 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="mx-auto rounded-2xl bg-white p-3">
            <QRCode value={setup.otpauthUrl} size={168} level="M" />
          </div>
          <div className="space-y-4">
            <ol className="space-y-1.5 text-small">
              <li>1. Open your authenticator app and add an account.</li>
              <li>2. Scan the code — or type this key:</li>
            </ol>
            <button type="button" onClick={() => navigator.clipboard.writeText(setup.secret).then(() => toast.success("Key copied"))} className="flex w-full items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 font-mono text-sm tracking-wider" title="Copy key">
              {groupKey(setup.secret)} <Copy size={14} className="shrink-0 text-muted" />
            </button>
            <p className="text-small">3. Enter the 6-digit code it shows:</p>
            <CodePrompt label="123456" onSubmit={enable} busy={busy} cta="Confirm & turn on" />
            <button type="button" onClick={() => setSetup(null)} className="text-xs text-muted hover:text-primary">Cancel</button>
          </div>
        </div>
      )}

      {enabled && !codes && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setAction(action === "regenerate" ? null : "regenerate")} className="inline-flex h-10 items-center gap-2 rounded-control border border-border px-4 text-small hover:bg-surface">
              <RefreshCw size={15} /> New backup codes
            </button>
            <button type="button" onClick={() => setConfirmOff(true)} className="inline-flex h-10 items-center gap-2 rounded-control border border-border px-4 text-small text-red-600 hover:bg-red-500/10 dark:text-red-400">
              <ShieldOff size={15} /> Turn off
            </button>
          </div>
          {action && (
            <div className="space-y-2 rounded-2xl border border-border p-4">
              <p className="flex items-center gap-2 text-small">
                <KeyRound size={15} /> {action === "disable" ? "Enter a current code to turn two-factor off." : "Enter a current code to replace your backup codes (old ones stop working)."}
              </p>
              <CodePrompt label="Code" onSubmit={action === "disable" ? disable : regenerate} busy={busy} cta={action === "disable" ? "Turn off" : "Make new codes"} />
            </div>
          )}
          {status.backupCodesLeft <= 3 && <p className="text-xs text-amber-600 dark:text-amber-400">You&apos;re low on backup codes — make new ones.</p>}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmOff)}
        title="Turn off two-factor sign-in?"
        message="Your password (or Google) alone will be enough to sign in. You'll need a current code to confirm."
        confirmText="Continue"
        onConfirm={() => {
          setConfirmOff(null);
          setAction("disable");
        }}
        onCancel={() => setConfirmOff(null)}
      />
    </section>
  );
}

export default MfaCard;
