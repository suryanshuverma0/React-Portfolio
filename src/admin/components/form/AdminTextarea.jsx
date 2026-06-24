function AdminTextarea({
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

      <textarea
        {...props}
        className={`
          w-full

          min-h-40

          p-5

          rounded-3xl

          bg-surface

          border
          border-border

          outline-none

          resize-none

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

export default AdminTextarea;