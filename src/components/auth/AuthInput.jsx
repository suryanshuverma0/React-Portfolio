import { forwardRef } from "react";
import { Mail, User, Hash, AlertCircle } from "lucide-react";

import { authFieldClass } from "./authFieldClass";

/* Text / email input for the auth pages: leading icon, soft focus glow,
   inline error. Works with react-hook-form's register() (ref + onChange)
   or as a controlled input. */

const iconFor = (type, name) => (type === "email" || /email/i.test(name || "") ? Mail : /code|otp/i.test(name || "") ? Hash : User);

const AuthInput = forwardRef(({ label, type = "text", name, value, onChange, onBlur, placeholder, autoComplete, error, disabled = false, required = false, icon, autoFocus }, ref) => {
  const Icon = icon || iconFor(type, name);
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={name} className="text-[13px] font-medium text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={typeof placeholder === "string" ? placeholder.trim() : placeholder}
          autoComplete={typeof autoComplete === "string" ? autoComplete.trim() : autoComplete}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={authFieldClass(error)}
          style={{ outline: "none" }}
        />
        <Icon size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors peer-focus:text-primary" />
      </div>
      {error && (
        <p id={`${name}-error`} className="flex items-center gap-1.5 text-[13px] text-red-500">
          <AlertCircle size={13} /> {error}
        </p>
      )}
    </div>
  );
});

AuthInput.displayName = "AuthInput";

export default AuthInput;
