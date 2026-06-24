import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Container from "../ui/Container";
import SectionTitle from "../ui/SectionTitle";
import { aboutContent } from "../content/aboutContent";
import { getPublicProfile } from "../../services/public.profile.service";
import { getPublicEducations } from "../../services/public.education.service";
import { getPublicStats } from "../../services/public.stats.service";
function About() {
  const aboutData = aboutContent;
  const [profile, setProfile] = useState(null);
  const [educations, setEducations] = useState([]);
  const [stats, setStats] = useState([]);
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

  useEffect(() => {
    loadData();
  }, []);

  const displayProfile = profile || aboutContent;

  const displayEducations =
    educations.length > 0 ? educations : aboutContent.education;

  const displayStats = stats.length > 0 ? stats : aboutContent.stats;
  return (
    <section
      id="about"
      className="
        section
      "
    >
      <Container>
        {/* TITLE */}

        <SectionTitle
          eyebrow="About"
          title={aboutData.title}
          description={displayProfile.description}
        />

        {/* EDUCATION */}

        <div
          className="
    grid

    grid-cols-1
    md:grid-cols-2

    gap-8

    mb-12
  "
        >
          {displayEducations.map((item, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
              }}
              className="
          card

          h-full
        "
            >
              {/* YEARS */}

              <div
                className="
            flex
            items-center

            gap-2

            mb-5
          "
              >
                <div
                  className="
              h-2
              w-2

              rounded-full

              bg-blue-500
            "
                />

                <p
                  className="
              text-muted
            "
                >
                  {item.startYear}
                  {" — "}
                  {item.current ? "Present" : item.endYear}
                </p>
              </div>

              {/* DEGREE */}

              <h3
                className="
            text-title

            mb-2
          "
              >
                {item.degree}
              </h3>

              {/* INSTITUTION */}

              <p
                className="
            text-label

            text-secondary

            mb-4
          "
              >
                {item.institution}
              </p>

              {/* DESCRIPTION */}

              <p
                className="
            text-body
          "
              >
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* STATS */}

        <div
          className="
            grid

            grid-cols-2
            md:grid-cols-4

            gap-6
          "
        >
          {displayStats
            .filter((item) => item.section === "about")
            .map((item, index) => (
              <motion.div
                key={item._id || index}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.08,
                }}
                className="
                  card

                  text-center
                "
              >
                <div
                  className="
                    text-heading

                    mb-1
                  "
                >
                  {item.value}
                </div>

                <p
                  className="
                    text-small
                  "
                >
                  {item.label}
                </p>
              </motion.div>
            ))}
        </div>
      </Container>
    </section>
  );
}

export default About;
