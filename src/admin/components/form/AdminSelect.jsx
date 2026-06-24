function AdminSelect({ label, error, options = [], className = "", ...props }) {
  return (
    <div className="space-y-2">
      {" "}
      <label className="text-label">{label} </label>
      <select
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
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default AdminSelect;
