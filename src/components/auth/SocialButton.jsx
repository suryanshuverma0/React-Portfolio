function SocialButton({
  children = "Continue with Google",

  icon,

  loading = false,

  disabled = false,

  onClick,
}) {

  return (

    <button

      type="button"

      onClick={onClick}

      disabled={
        disabled || loading
      }

      className="
        glass

        h-control
        w-full

        px-control

        inline-flex
        items-center
        justify-center

        gap-3

        rounded-control

        text-label

        tracking-tight

        transition-all
        duration-200

        hover:bg-black/[0.03]
        dark:hover:bg-white/[0.04]

        active:scale-[0.985]

        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:active:scale-100
      "
    >

      {/* LOADING */}

      {loading ? (

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

      ) : (

        icon

      )}

      <span>
        {children}
      </span>

    </button>
  );
}

export default SocialButton;
