/* Primary auth action: full width, subtle sheen on hover, spinner while
   loading. Pass className to restyle (e.g. outline variants). */
function AuthButton({ children, type = "submit", loading = false, disabled = false, className = "", ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`group relative inline-flex h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-5 text-[15px] font-medium tracking-tight text-background shadow-[0_10px_30px_-12px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_16px_36px_-14px_color-mix(in_srgb,var(--color-primary)_60%,transparent)] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${className}`}
      {...props}
    >
      <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 group-hover:left-[110%] group-hover:opacity-100" />
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

export default AuthButton;
