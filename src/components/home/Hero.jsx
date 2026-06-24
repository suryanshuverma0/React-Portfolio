import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Typewriter from "typewriter-effect";
import Container from "../ui/Container";
import { heroContent } from "../content/heroContent";
import { iconMap } from "../constants/iconMap";
import { getPublicProfile } from "../../services/public.profile.service";
function Hero() {
  const heroData = heroContent;
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getPublicProfile();

        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };

    loadProfile();
  }, []);
  const displayData = profile || heroContent;

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
              src={displayData.image?.url || displayData.image}
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
            {displayData.name}
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
                {displayData.availability}
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
                strings: displayData.roles || [],

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
        </motion.div>
      </Container>

      {/* MODAL */}
    </section>
  );
}

export default Hero;
