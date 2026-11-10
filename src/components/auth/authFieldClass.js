// Shared field style for the auth inputs (soft focus glow, error state).
export const authFieldClass = (error) => `
  peer h-[52px] w-full rounded-2xl border bg-surface/70 pl-11 pr-4 text-[15px]
  outline-none transition-all duration-200 placeholder:text-muted
  hover:border-[color-mix(in_srgb,var(--color-primary)_30%,var(--color-border))]
  focus:bg-background focus:ring-4
  disabled:cursor-not-allowed disabled:opacity-50
  ${error ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/10" : "border-border focus:border-primary focus:ring-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]"}
`;
