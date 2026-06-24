function AdminSwitch({
  checked,
  onChange,
  label,
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
      "
    >
      <div>
        <p className="text-label">
          {label}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          onChange(!checked)
        }
        className={`
          relative

          h-7
          w-12

          rounded-full

          transition

          ${
            checked
              ? "bg-primary"
              : "bg-surface"
          }
        `}
      >
        <span
          className={`
            absolute

            top-1
            left-1

            h-5
            w-5

            rounded-full

            bg-background

            transition-transform

            ${
              checked
                ? "translate-x-5"
                : ""
            }
          `}
        />
      </button>
    </div>
  );
}

export default AdminSwitch;