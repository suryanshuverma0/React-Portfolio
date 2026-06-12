function Button({
  children,
  variant = "primary",
  className = "",
}) {

  const baseStyles = `
    h-control
    px-control

    inline-flex
    items-center
    justify-center

    rounded-control

    text-label

    tracking-tight

    transition-all
    duration-200

    active:scale-[0.98]
  `

  const variants = {
    primary: `
      bg-primary
      text-background

      hover:opacity-90
    `,

    secondary: `
      glass

      text-primary

      hover:bg-black/5
      dark:hover:bg-white/5
    `,
  }

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

export default Button