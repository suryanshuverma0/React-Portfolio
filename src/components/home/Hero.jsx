import { useState } from "react";

import { motion } from "framer-motion";

import Typewriter from "typewriter-effect";

import { ArrowUpRight } from "lucide-react";

import { FaShieldAlt } from "react-icons/fa";

import Container from "../ui/Container";

import BlockchainModal from "../modals/BlockchainModal";

import { heroContent } from "../content/heroContent";

import { iconMap } from "../constants/iconMap";

function Hero() {
  const heroData = heroContent;
  const [isBlockchainOpen, setIsBlockchainOpen] = useState(false);

  return (
    <section
      id="home"
      className="
        section
        pt-32 md:p-28

        relative

        overflow-hidden
      "
    >
      {/* BACKGROUND */}

      <div
        className="
          absolute
          inset-0

          -z-10

          overflow-hidden
        "
      >
        {/* GRID */}

        <div
          className="
            absolute
            inset-0

            opacity-[0.03]

            bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]

            dark:bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]

            bg-size:[72px_72px]
          "
        />

        {/* GLOW */}

        <div
          className="
            absolute

            top-20
            left-1/2

            -translate-x-1/2

            h-85
            w-85

            rounded-full

            bg-blue-500/10

            blur-3xl
          "
        />
      </div>

      <Container>
        <motion.div
          initial={{
            opacity: 0,
            y: 24,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="
            max-w-4xl
            mx-auto

            text-center
          "
        >
          {/* IMAGE */}
          <div
            className="
              relative

              w-fit

              mx-auto

              mb-8
            "
          >
            {/* SOFT GLOW */}

            <div
              className="
                absolute
                inset-0

                scale-110

                rounded-full

                bg-blue-500/15

                blur-3xl
              "
            />

            {/* IMAGE */}

            <img
              src={heroData.image}
              alt={heroData.name}
              className="
                relative

                h-40
                w-40

                md:h-52
                md:w-52

                rounded-full

                object-cover


                
              "
            />
          </div>
          {/* NAME */}
          <h1
            className="
              text-hero

              mb-4
            "
          >
            {heroData.name}
          </h1>

          {/* STATUS */}
          <div
            className="
    flex
    justify-center

    mb-6
  "
          >
            <div
              className="
      inline-flex
      items-center

      gap-2

      rounded-full

      border
      border-border

      bg-surface

      px-4
      py-2
    "
            >
              <span
                className="
        h-2
        w-2

        rounded-full

        bg-emerald-500
      "
              />

              <span
                className="
        text-small
      "
              >
                {heroData.availability}
              </span>
            </div>
          </div>

          {/* TYPING */}
          <div
            className="
              h-10

              text-large

              mb-10
            "
          >
            <Typewriter
              options={{
                strings: heroData.roles,

                autoStart: true,

                loop: true,

                delay: 45,

                deleteSpeed: 24,
              }}
            />
          </div>

          {/* SOCIALS */}
          <div
            className="
              flex
              justify-center
              flex-wrap

              gap-3

              mb-14
            "
          >
            {heroData.socials.map((item, index) => {
              const Icon = iconMap[item.icon];

              return (
                <a
                  key={index}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="
                      glass
                      glass-hover

                      h-12
                      w-12

                      rounded-2xl

                      inline-flex
                      items-center
                      justify-center

                      text-secondary
                      hover:text-primary

                      hover:-translate-y-1
                    "
                >
                  <Icon size={18} />
                </a>
              );
            })}
          </div>
          {/* ON CHAIN */}
          <div
            className="
              card

              max-w-2xl
              mx-auto
            "
          >
            <div
              className="
                flex
                flex-col
                sm:flex-row

                gap-6

                sm:items-center
                sm:justify-between
              "
            >
              {/* LEFT */}

              <div
                className="
                  flex
                  items-start

                  gap-4

                  text-left
                "
              >
                <div
                  className="
                    h-12
                    w-12

                    rounded-2xl

                    bg-emerald-500/10

                    flex
                    items-center
                    justify-center

                    text-emerald-500

                    shrink-0
                  "
                >
                  <FaShieldAlt size={20} />
                </div>

                <div>
                  <p
                    className="
                      text-muted

                      uppercase

                      tracking-[0.18em]

                      mb-2
                    "
                  >
                    Verified On-Chain
                  </p>

                  <p
                    className="
                      text-mono

                      text-secondary

                      break-all
                    "
                  >
                    {heroData.blockchain.address}
                  </p>
                </div>
              </div>

              {/* BUTTON */}

              <button
                onClick={() => setIsBlockchainOpen(true)}
                className="
                  h-control

                  px-control

                  rounded-control

                  bg-primary

                  text-background

                  inline-flex
                  items-center
                  justify-center

                  gap-2

                  text-label

                  hover:opacity-90

                  transition-all

                  shrink-0
                "
              >
                Verify
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </Container>

      {/* MODAL */}

      <BlockchainModal
        isOpen={isBlockchainOpen}
        onClose={() => setIsBlockchainOpen(false)}
        blockchain={heroData.blockchain}
      />
    </section>
  );
}

export default Hero;
