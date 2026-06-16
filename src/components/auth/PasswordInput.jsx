import { forwardRef, useState } from "react";

import {
  Eye,
  EyeOff,
} from "lucide-react";

const PasswordInput = forwardRef(
  (
    {
      label,
      name,
      value,
      onChange,
      placeholder,
      autoComplete,
      error,
      disabled = false,
      required = false,
    },
    ref
  ) => {
    const [
      showPassword,
      setShowPassword,
    ] = useState(false);

    return (
      <div
        className="
          flex
          flex-col

          gap-2
        "
      >
        {/* LABEL */}

        <label
          htmlFor={name}
          className="
            text-label
          "
        >
          {label}
        </label>

        {/* INPUT WRAPPER */}

        <div
          className="
            relative
          "
        >
          <input
            ref={ref}
            id={name}
            name={name}
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete={autoComplete}
            disabled={disabled}
            required={required}
            className={`
              h-control
              w-full

              rounded-control

              px-control
              pr-12

              bg-surface

              border

              text-[15px]

              outline-none

              transition-all
              duration-200

              placeholder:text-muted

              disabled:opacity-50
              disabled:cursor-not-allowed

              ${
                error
                  ? `
                    border-red-500/70

                    focus:border-red-500
                  `
                  : `
                    border-border

                    focus:border-primary
                  `
              }
            `}
          />

          {/* TOGGLE BUTTON */}

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }
            disabled={disabled}
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
            className="
              absolute

              top-1/2
              right-4

              -translate-y-1/2

              text-muted

              hover:text-primary

              transition-colors

              disabled:opacity-50
            "
          >
            {showPassword ? (
              <EyeOff
                size={18}
                strokeWidth={2}
              />
            ) : (
              <Eye
                size={18}
                strokeWidth={2}
              />
            )}
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <p
            className="
              text-sm

              text-red-500

              leading-none
            "
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

export default PasswordInput;