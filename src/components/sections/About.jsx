import { motion } from "framer-motion";

import Container from "../ui/Container";

import SectionTitle from "../ui/SectionTitle";

import { aboutContent } from "../content/aboutContent";

function About() {
  const aboutData = aboutContent;

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
          description={aboutData.description}
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
          {aboutData.education.map((item, index) => (
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
                  {item.endYear}
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
          {aboutData.stats.map((item, index) => (
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
