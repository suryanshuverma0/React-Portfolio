import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, KeyRound, Loader2, ArrowLeft } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

/* ========================================
   MFA STEP — after a correct password or
   Google sign-in on an account with two-
   factor on: a 6-digit authenticator code
   (submits itself at 6 digits, one-time-code
   autofill) or a one-time backup code.
========================================= */

function MfaStep({ challenge, onDone, onCancel }) {
  const { verifyMfa } = useAuth();
  const [mode, setMode] = useState("totp");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const submit = async (value = code) => {
    const clean = value.trim();
    if (busy || (mode === "totp" ? clean.length !== 6 : clean.length < 10)) return;
    setBusy(true);
    setError("");
    try {
      const user = await verifyMfa(challenge, clean);
      onDone(user);
    } catch (e) {
      const status = e.response?.status;
      setError(e.response?.data?.message || "That code didn't work");
      setCode("");
      if (status === 401) setTimeout(onCancel, 1800); // challenge gone: back to sign-in
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Two-factor verification">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-7 shadow-2xl"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
          {mode === "totp" ? <ShieldCheck size={26} /> : <KeyRound size={24} />}
        </div>
        <h2 className="text-center text-title">{mode === "totp" ? "Enter your code" : "Use a backup code"}</h2>
        <p className="mt-1.5 text-center text-small">
          {mode === "totp" ? "Open your authenticator app and type the 6-digit code for this account." : "Type one of the backup codes you saved. Each works once."}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-6 space-y-4"
        >
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => {
              const v = mode === "totp" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value.slice(0, 20);
              setCode(v);
              setError("");
              if (mode === "totp" && v.length === 6) submit(v);
            }}
            inputMode={mode === "totp" ? "numeric" : "text"}
            autoComplete="one-time-code"
            placeholder={mode === "totp" ? "123456" : "abcde-12345"}
            className={`h-14 w-full rounded-2xl border bg-surface text-center font-mono outline-none transition focus:border-primary ${mode === "totp" ? "text-3xl tracking-[0.45em]" : "text-xl tracking-wider"} ${error ? "border-red-500" : "border-border"}`}
            aria-label={mode === "totp" ? "6-digit code" : "Backup code"}
            aria-invalid={Boolean(error)}
          />
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-medium text-background disabled:opacity-60">
            {busy && <Loader2 size={17} className="animate-spin" />} Verify
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs">
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 text-muted hover:text-primary">
            <ArrowLeft size={13} /> Back
          </button>
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "totp" ? "backup" : "totp"));
              setCode("");
              setError("");
            }}
            className="text-muted underline-offset-2 hover:text-primary hover:underline"
          >
            {mode === "totp" ? "Use a backup code instead" : "Use the authenticator app"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default MfaStep;
