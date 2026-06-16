function AuthDivider({
  text = "or continue with",
}) {

  return (

    <div
      className="
        relative

        flex
        items-center
        justify-center
      "
    >

      {/* LINE */}

      <div
        className="
          absolute
          inset-0

          flex
          items-center
        "
      >

        <div
          className="
            w-full

            border-t
            border-border
          "
        />

      </div>

      {/* TEXT */}

      <span
        className="
          relative
          z-10

          px-3

          bg-background

          text-[13px]

          tracking-tight

          text-muted
        "
      >
        {text}
      </span>

    </div>
  );
}

export default AuthDivider;
