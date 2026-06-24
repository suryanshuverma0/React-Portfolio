function AdminInput({
  label,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="space-y-2">
      <label className="text-label">
        {label}
      </label>

      <input
        {...props}
        className={`
          w-full

          h-control

          px-control

          rounded-control

          bg-surface

          border
          border-border

          outline-none

          transition

          focus:border-primary

          ${className}
        `}
      />

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export default AdminInput;