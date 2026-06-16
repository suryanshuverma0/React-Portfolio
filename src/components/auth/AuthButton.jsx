function AuthButton({
  children,

  type = "submit",

  loading = false,

  disabled = false,

  className = "",

  ...props
}) {

  return (

    <button

      type={type}

      disabled={
        disabled || loading
      }

      className={`
        h-control
        w-full

        px-control

        inline-flex
        items-center
        justify-center

        gap-2

        rounded-control

        bg-primary
        text-background

        text-label

        tracking-tight

        transition-all
        duration-200

        hover:opacity-90

        active:scale-[0.985]

        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:active:scale-100

        ${className}
      `}

      {...props}
    >

      {/* LOADING SPINNER */}

      {loading && (

        <span
          className="
            h-4
            w-4

            rounded-full

            border-2
            border-current
            border-t-transparent

            animate-spin
          "
        />

      )}

      {children}

    </button>
  );
}

export default AuthButton;
