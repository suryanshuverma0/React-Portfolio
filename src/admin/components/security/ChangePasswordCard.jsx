import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { Lock, Eye, EyeOff, Check, X, Loader2, Smartphone } from "lucide-react";

import { getPasswordStatus, changePassword } from "../../services/account.service";

/* ========================================
   CHANGE PASSWORD — needs the current one
   (unless the account never had a password,
   e.g. Google-only). Can sign out every
   other device at the same time.
========================================= */

const RULES = [
  { test: (p) => p.length >= 8, label: "8+ characters" },
  { test: (p) => /[A-Z]/.test(p), label: "Uppercase letter" },
  { test: (p) => /[a-z]/.test(p), label: "Lowercase letter" },
  { test: (p) => /[0-9]/.test(p), label: "Number" },
];

function PasswordField({ id, label, value, onChange, autoComplete, show, onToggle }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-label">
        {label}
      </label>
      <div className="flex items-center rounded-control border border-border bg-surface focus-within:border-primary">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="h-control min-w-0 flex-1 bg-transparent px-4 outline-none"
        />
        {onToggle && (
          <button type="button" onClick={onToggle} className="px-3 text-muted hover:text-primary" aria-label={show ? "Hide passwords" : "Show passwords"}>
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [hasPassword, setHasPassword] = useState(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPasswordStatus()
      .then((d) => setHasPassword(d.hasPassword))
      .catch(() => setHasPassword(true));
  }, []);

  const strong = RULES.every((r) => r.test(next));
  const matches = next && next === confirm;
  const canSubmit = strong && matches && (!hasPassword || current) && !busy;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const result = await changePassword({ currentPassword: hasPassword ? current : undefined, newPassword: next, signOutOthers });
      toast.success(
        result.signedOut ? `Password changed · ${result.signedOut} other device${result.signedOut === 1 ? "" : "s"} signed out` : "Password changed",
      );
      setCurrent("");
      setNext("");
      setConfirm("");
      setHasPassword(true);
    } catch (error) {
      toast.error(error.response?.data?.errors?.[0]?.message || error.response?.data?.message || "Couldn't change your password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface">
          <Lock size={18} />
        </span>
        <div>
          <h2 className="text-title">{hasPassword === false ? "Set a password" : "Change password"}</h2>
          <p className="text-small mt-0.5">
            {hasPassword === false ? "Your account signs in with Google or a passkey. Add a password as another way in." : "You'll need your current password. Other sign-in methods keep working."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {hasPassword !== false && (
          <PasswordField id="pw-current" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" show={show} onToggle={() => setShow((s) => !s)} />
        )}
        <PasswordField id="pw-new" label="New password" value={next} onChange={setNext} autoComplete="new-password" show={show} onToggle={hasPassword === false ? () => setShow((s) => !s) : undefined} />
        <PasswordField id="pw-confirm" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" show={show} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {RULES.map((rule) => {
          const ok = rule.test(next);
          return (
            <span key={rule.label} className={`inline-flex items-center gap-1 text-xs ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}`}>
              {ok ? <Check size={13} /> : <X size={13} />} {rule.label}
            </span>
          );
        })}
        {confirm && (
          <span className={`inline-flex items-center gap-1 text-xs ${matches ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
            {matches ? <Check size={13} /> : <X size={13} />} {matches ? "Passwords match" : "Passwords don't match"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-small">
          <input type="checkbox" checked={signOutOthers} onChange={(e) => setSignOutOthers(e.target.checked)} className="h-4 w-4 accent-current" />
          Sign out my other devices
        </label>
        <div className="flex items-center gap-3">
          <Link to="/dashboard/devices" className="hidden items-center gap-1.5 text-xs text-muted hover:text-primary sm:inline-flex">
            <Smartphone size={13} /> Manage devices
          </Link>
          <button type="submit" disabled={!canSubmit} className="inline-flex h-control items-center gap-2 rounded-control bg-primary px-6 font-medium text-background transition hover:opacity-90 disabled:opacity-40">
            {busy && <Loader2 size={16} className="animate-spin" />}
            {hasPassword === false ? "Set password" : "Change password"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default ChangePasswordCard;
