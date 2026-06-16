import { motion } from "framer-motion";

function AuthLayout({
  title,
  subtitle,
  children,
}) {

  return (

    <main
      className="
        min-h-screen

        bg-background

        relative
        overflow-hidden

        flex
        items-center
        justify-center

        px-4
        py-8
      "
    >

      {/* BACKGROUND GLOW */}

      <div
        className="
          pointer-events-none

          absolute
          inset-0
          overflow-hidden
        "
      >

        {/* TOP GLOW */}

        <div
          className="
            absolute

            top-[-120px]
            left-1/2
            -translate-x-1/2

            h-[280px]
            w-[280px]

            md:h-[420px]
            md:w-[420px]

            rounded-full

            bg-primary/[0.04]

            blur-3xl
          "
        />

        {/* BOTTOM GLOW */}

        <div
          className="
            absolute

            bottom-[-180px]
            right-[-120px]

            h-[240px]
            w-[240px]

            rounded-full

            bg-primary/[0.03]

            blur-3xl
          "
        />

      </div>

      {/* AUTH CARD */}

      <motion.div

        initial={{
          opacity: 0,
          y: 18,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        transition={{
          duration: 0.35,
        }}

        className="
          glass

          relative
          z-10

          w-full
          max-w-[420px]

          rounded-[32px]

          p-5
          sm:p-7
          md:p-8
        "
      >

        {/* LOGO */}

        <div
          className="
            mb-8

            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              h-11
              w-11

              rounded-2xl

              bg-primary

              text-background

              flex
              items-center
              justify-center

              text-sm
              font-semibold

              tracking-tight

              shrink-0
            "
          >
            SV
          </div>

          <div>

            <h1
              className="
                text-[17px]
                font-semibold
                tracking-tight
              "
            >
              Suryanshu
            </h1>

            <p
              className="
                text-[13px]
                text-muted
              "
            >
              Authentication Portal
            </p>

          </div>

        </div>

        {/* HEADER */}

        <div
          className="
            mb-7
          "
        >

          <h2
            className="
              text-[28px]

              font-semibold

              tracking-[-0.03em]

              leading-none
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-3

              text-small

              max-w-[320px]
            "
          >
            {subtitle}
          </p>

        </div>

        {/* CONTENT */}

        {children}

      </motion.div>

    </main>
  );
}

export default AuthLayout;
