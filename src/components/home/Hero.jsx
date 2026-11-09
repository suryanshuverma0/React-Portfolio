import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import Container from "../ui/Container";
import Magnetic from "../motion/Magnetic";
import { heroContent } from "../content/heroContent";
import { useResearch, featuredPaperOf } from "../../hooks/useResearch";
import { iconMap } from "../constants/iconMap";
import { getPublicProfile } from "../../services/public.profile.service";
import { getPublicSettings } from "../../services/public.settings.service";
import { socialsObjectToArray } from "../../lib/socials";
import { firstVisibleAnchor, isSectionVisible, useAppearance } from "../../lib/appearance";

const EASE = [0.22, 1, 0.36, 1];


/* Cycles through roles with a vertical slide — quieter than a typewriter. */
function RoleRotator({ roles }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (roles.length < 2) return undefined;

    const timer = setInterval(
      () => setIndex((value) => (value + 1) % roles.length),
      2600,
    );

    return () => clearInterval(timer);
  }, [roles.length]);

  if (!roles.length) return null;

  const role = roles[index % roles.length];

  return (
    <span className="relative inline-flex h-[1.5em] overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={role}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="block whitespace-nowrap"
        >
          {role}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

RoleRotator.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

/* One line of the display name, revealed by sliding up from a mask. */
function NameLine({ children, delay }) {
  return (
    <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
      <motion.span
        className="block"
        initial={{ y: "105%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

NameLine.propTypes = {
  children: PropTypes.node.isRequired,
  delay: PropTypes.number,
};

function Hero() {
  // The hero links into Research and Contact — keep them pointing at
  // something real when those sections are hidden in admin → Appearance.
  const { sections } = useAppearance();
  const showResearch = isSectionVisible(sections, "research");
  const showContact = isSectionVisible(sections, "contact");

  // The announced paper comes from admin → Research (featured first).
  const featuredPaper = featuredPaperOf(useResearch());

  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);

  // Scroll-out parallax: copy lifts and fades, the portrait drifts slower.
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -90]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.85], [1, reduceMotion ? 1 : 0.15]);
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -160]);

  useEffect(() => {
    getPublicProfile()
      .then(setProfile)
      .catch((error) => console.error("Failed to load profile", error));

    getPublicSettings()
      .then(setSettings)
      .catch((error) => console.error("Failed to load settings", error));
  }, []);

  const data = { ...heroContent, ...(profile || {}) };

  const imageSrc = data.image?.url || data.image || heroContent.image;

  const [firstName, ...rest] = (data.name || heroContent.name).split(" ");
  const lastName = rest.join(" ");

  const settingsSocials = socialsObjectToArray(settings?.socials);
  const socials = settingsSocials.length ? settingsSocials : heroContent.socials;

  const roles = data.roles?.length ? data.roles : heroContent.roles;

  const fadeUp = (delay) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  const meta = [
    { label: "Status", value: data.availability, live: true },
    { label: "Focus", value: heroContent.focus },
    { label: "Role", value: <RoleRotator roles={roles} /> },
  ];

  return (
    <section
      ref={sectionRef}
      id="home"
      className="
        relative

        overflow-hidden

        pt-28
        md:pt-36

        pb-14
        md:pb-20
      "
    >
      {/* BACKDROP */}

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid mask-radial" />

        <div
          className="
            absolute

            left-1/2
            -top-[30%]

            h-[640px]
            w-[min(1000px,140vw)]

            -translate-x-1/2

            rounded-full

            bg-primary/[0.07]

            blur-[120px]
          "
        />
      </div>

      <Container>
        {/* ANNOUNCEMENT — the paper is the headline news */}

        {featuredPaper && showResearch && (
          <motion.a
            href="#research"
            {...fadeUp(0)}
            className="
              group

              inline-flex
              items-center

              gap-3

              max-w-full

              rounded-full

              border
              border-border

              bg-background/70
              backdrop-blur-md

              py-1.5
              pl-1.5
              pr-4

              text-[13px]
              text-secondary

              transition-colors
              duration-300

              hover:border-border-strong
              hover:text-primary
            "
          >
            <span
              className="
                shrink-0

                rounded-full

                bg-primary

                px-2.5
                py-1

                font-mono
                text-[10.5px]
                font-medium
                uppercase
                tracking-[0.12em]

                text-background
              "
            >
              New paper
            </span>

            <span className="truncate">
              {featuredPaper.status} at{" "}
              <span className="font-medium text-primary">{featuredPaper.venue}</span>
            </span>

            <ArrowRight
              size={14}
              aria-hidden="true"
              className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </motion.a>
        )}

        <div
          className="
            mt-10
            md:mt-14

            grid
            grid-cols-1
            lg:grid-cols-[1fr_auto]

            gap-10
            lg:gap-16

            items-end
          "
        >
          {/* LEFT */}

          <motion.div style={{ y: copyY, opacity: copyOpacity }} className="min-w-0">
            {/* Mobile avatar — the large portrait only fits on wide screens */}

            <motion.img
              {...fadeUp(0.05)}
              src={imageSrc}
              alt=""
              aria-hidden="true"
              className="
                lg:hidden

                mb-8

                h-20
                w-20

                rounded-full

                border
                border-border

                object-cover

                grayscale
              "
            />

            <h1 className="text-display" aria-label={data.name}>
              <NameLine delay={0.1}>{firstName}</NameLine>
              {lastName && (
                <NameLine delay={0.2}>
                  {lastName}
                  <span className="text-muted">.</span>
                </NameLine>
              )}
            </h1>

            <motion.p
              {...fadeUp(0.45)}
              className="
                mt-8
                md:mt-10

                max-w-2xl

                text-lg
                md:text-[22px]

                leading-[1.45]

                tracking-[-0.015em]

                text-secondary

                text-pretty
              "
            >
              {data.headline}
            </motion.p>

            {/* CTA + SOCIALS */}

            <motion.div
              {...fadeUp(0.55)}
              className="
                mt-9

                flex
                flex-wrap

                items-center

                gap-3
              "
            >
              <Magnetic>
                <a href={showResearch ? "#research" : firstVisibleAnchor(sections)} className="btn btn-primary">
                  {showResearch ? "Read the research" : "Explore"}
                  <ArrowDown size={15} aria-hidden="true" />
                </a>
              </Magnetic>

              {showContact && (
                <Magnetic>
                  <a href="#contact" className="btn btn-outline">
                    Get in touch
                  </a>
                </Magnetic>
              )}

              <span aria-hidden="true" className="hidden sm:block mx-1 h-6 w-px bg-border" />

              <div className="flex flex-wrap items-center gap-1">
                {socials.map((item) => {
                  const Icon = iconMap[item.icon];

                  if (!Icon) return null;

                  return (
                    <a
                      key={item.icon}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.icon}
                      className="
                        h-11
                        w-11

                        rounded-full

                        inline-flex
                        items-center
                        justify-center

                        text-muted

                        transition-colors
                        duration-200

                        hover:bg-surface
                        hover:text-primary
                      "
                    >
                      <Icon size={17} />
                    </a>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>

          {/* PORTRAIT */}

          <motion.figure
            initial={{ opacity: 0, y: 30, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: 2 }}
            whileHover={{ rotate: 0 }}
            style={{ y: portraitY }}
            transition={{ duration: 1, delay: 0.3, ease: EASE }}
            className="
              group

              hidden
              lg:block

              w-[290px]
              xl:w-[320px]

              panel

              p-2

              shadow-[0_40px_80px_-40px_rgba(0,0,0,0.35)]
            "
          >
            <div className="overflow-hidden rounded-[calc(21px*var(--radius-scale))] bg-surface">
              <img
                src={imageSrc}
                alt={data.name}
                className="
                  aspect-[4/5]
                  w-full

                  object-cover

                  grayscale
                  contrast-[1.05]

                  transition-[filter,transform]
                  duration-700

                  group-hover:grayscale-0
                  group-hover:scale-[1.03]
                "
              />
            </div>

          </motion.figure>
        </div>

        {/* META STRIP */}

        <motion.dl
          {...fadeUp(0.7)}
          className="
            mt-16
            md:mt-24

            grid
            grid-cols-1
            sm:grid-cols-3

            border-t
            border-border
          "
        >
          {meta.map((item, index) => (
            <div
              key={item.label}
              className={`
                pt-5
                pb-1

                pr-4

                ${index > 0 ? "sm:pl-6 sm:border-l sm:border-border" : ""}
              `}
            >
              <dt className="text-eyebrow mb-2.5">{item.label}</dt>

              <dd className="flex items-center gap-2 text-[14px] font-medium tracking-tight text-primary">
                {item.live && (
                  <span aria-hidden="true" className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-50 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                )}
                <span className="min-w-0 truncate">{item.value}</span>
              </dd>
            </div>
          ))}
        </motion.dl>
      </Container>
    </section>
  );
}

export default Hero;
