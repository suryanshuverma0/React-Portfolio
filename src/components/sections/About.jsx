import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Container from "../ui/Container";
import SectionTitle from "../ui/SectionTitle";
import { aboutContent } from "../content/aboutContent";
import { getPublicProfile } from "../../services/public.profile.service";
import { getPublicEducations } from "../../services/public.education.service";
import { getPublicStats } from "../../services/public.stats.service";
import { trackPointer } from "../../lib/pointer";
import CountUp from "../motion/CountUp";

const EASE = [0.22, 1, 0.36, 1];

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: EASE },
});

function About() {
  const [profile, setProfile] = useState(null);
  const [educations, setEducations] = useState([]);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, educationData, statsData] = await Promise.all([
          getPublicProfile(),
          getPublicEducations(),
          getPublicStats(),
        ]);

        setProfile(profileData);
        setEducations(educationData);
        setStats(statsData);
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
  }, []);

  const description = profile?.description || aboutContent.description;

  const displayEducations =
    educations.length > 0 ? educations : aboutContent.education;

  // API stats are tagged by section; the fallback list has no tag.
  const displayStats =
    stats.length > 0
      ? stats.filter((item) => item.section === "about")
      : aboutContent.stats;

  return (
    <section id="about" className="section">
      <Container>
        <SectionTitle index="02" eyebrow="About" title={aboutContent.title} />

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16">
          {/* STATEMENT */}

          <motion.div {...reveal()}>
            <p
              className="
                text-[20px]
                md:text-[26px]

                leading-[1.45]

                tracking-[-0.02em]

                text-primary

                text-pretty
              "
            >
              {description}
            </p>
          </motion.div>

          {/* EDUCATION */}

          <motion.div
            {...reveal(0.1)}
            onMouseMove={trackPointer}
            className="panel spotlight p-5 sm:p-7 self-start"
          >
            <p className="text-eyebrow text-primary! mb-6">Education</p>

            <ol className="flex flex-col">
              {displayEducations.map((item, index) => (
                <li
                  key={item._id || index}
                  className={`
                    grid
                    grid-cols-[88px_1fr]

                    gap-4

                    py-5

                    ${index === 0 ? "pt-0" : "border-t border-border"}
                  `}
                >
                  <p className="font-mono text-[12px] text-muted tabular-nums pt-1">
                    {item.startYear}
                    {" — "}
                    {item.current || !item.endYear ? "Now" : item.endYear}
                  </p>

                  <div className="min-w-0">
                    <h3 className="text-[17px] font-semibold tracking-[-0.02em] leading-snug">
                      {item.degree}
                    </h3>

                    <p className="text-small mt-1 text-primary/80">{item.institution}</p>

                    {item.description && (
                      <p className="text-small mt-2">{item.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>
        </div>

        {/* STATS */}

        {displayStats.length > 0 && (
          <motion.dl
            {...reveal(0.15)}
            className="
              mt-14
              md:mt-20

              grid
              grid-cols-2
              md:grid-cols-4

              gap-px

              overflow-hidden

              rounded-[calc(28px*var(--radius-scale))]

              border
              border-border

              bg-border
            "
          >
            {displayStats.map((item, index) => (
              <div key={item._id || index} className="flex flex-col bg-background p-6 md:p-8">
                <dt className="text-eyebrow mt-4 order-2">{item.label}</dt>

                <dd
                  className="
                    text-[44px]
                    md:text-[64px]

                    font-semibold

                    leading-none

                    tracking-[-0.06em]

                    tabular-nums

                    order-1
                  "
                >
                  <CountUp value={item.value} />
                </dd>
              </div>
            ))}
          </motion.dl>
        )}
      </Container>
    </section>
  );
}

export default About;
