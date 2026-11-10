import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock, AlertCircle, ArrowBigUp } from "lucide-react";

import { authFieldClass } from "./authFieldClass";

/* Password input: show/hide, caps-lock warning and (for new passwords) a
   live strength meter. Keeps working with react-hook-form's register(). */

const LEVELS = [
  { label: "Too short", color: "bg-red-500" },
  { label: "Weak", color: "bg-red-500" },
  { label: "Fair", color: "bg-amber-500" },
  { label: "Good", color: "bg-emerald-500" },
  { label: "Strong", color: "bg-emerald-500" },
];

const score = (p) => {
  if (!p || p.length < 8) return 0;
  let s = 1;
  if (p.length >= 12) s += 1;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s += 1;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s += 1;
  if (/^(.)\1+$/.test(p) || /^(password|12345678|qwerty)/i.test(p)) s = 1;
  return Math.min(s, 4);
};

const PasswordInput = forwardRef(({ label, name, value, onChange, onBlur, placeholder, autoComplete, error, disabled = false, required = false, showStrength = false, autoFocus }, ref) => {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [typed, setTyped] = useState("");
  const strength = score(value ?? typed);
  const level = LEVELS[strength];
  const hasInput = Boolean(value ?? typed);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={name} className="text-[13px] font-medium text-secondary">
          {typeof label === "string" ? label.trim() : label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={name}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => {
            if (showStrength) setTyped(e.target.value);
            onChange?.(e);
          }}
          onBlur={(e) => {
            setCaps(false);
            onBlur?.(e);
          }}
          onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") || false)}
          placeholder={typeof placeholder === "string" ? placeholder.trim() : placeholder}
          autoComplete={typeof autoComplete === "string" ? autoComplete.trim() : autoComplete}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`${authFieldClass(error)} pr-12`}
          style={{ outline: "none" }}
        />
        <Lock size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors peer-focus:text-primary" />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface hover:text-primary"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {showStrength && hasInput && (
        <div className="flex items-center gap-2" aria-live="polite">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? level.color : "bg-border"}`} />
            ))}
          </div>
          <span className="w-16 text-right text-[12px] text-muted">{level.label}</span>
        </div>
      )}
      {caps && (
        <p className="flex items-center gap-1.5 text-[12px] text-amber-600">
          <ArrowBigUp size={13} /> Caps Lock is on
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="flex items-center gap-1.5 text-[13px] text-red-500">
          <AlertCircle size={13} /> {error}
        </p>
      )}
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
