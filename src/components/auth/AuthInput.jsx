import { forwardRef } from "react";

const AuthInput = forwardRef(
  (
    {
      label,
      type = "text",
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

        {/* INPUT */}

        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
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

export default AuthInput;