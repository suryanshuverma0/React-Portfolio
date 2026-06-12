import {
  motion,
} from "framer-motion";

import Container from "../../ui/Container";

import SectionTitle from "../../ui/SectionTitle";

import {
  skillsContent,
} from "../../content/skillsContent";

function Skills() {

  return (

    <section
      id="skills"

      className="
        section
      "
    >

      <Container>

        {/* TITLE */}

        <SectionTitle

          eyebrow="Skills"

          title="Technologies and systems I work with."

          description="Focused on backend engineering, scalable MERN applications, blockchain systems, and production-oriented software development."
        />

        {/* GRID */}

        <div
          className="
            grid

            grid-cols-1
            md:grid-cols-2

            gap-8
          "
        >

          {skillsContent.map(
            (
              item,
              index
            ) => (

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
                  delay: index * 0.06,
                }}

                className="
                  card

                  h-full
                "
              >

                {/* HEADER */}

                <div
                  className="
                    flex
                    items-center

                    gap-2

                    mb-6
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

                  <h3
                    className="
                      text-title
                    "
                  >

                    {item.category}

                  </h3>

                </div>

                {/* PRIMARY */}

                <div
                  className="
                    flex
                    flex-wrap

                    gap-2.5

                    mb-5
                  "
                >

                  {item.primary.map(
                    (
                      skill,
                      skillIndex
                    ) => (

                      <div
                        key={skillIndex}

                        className="
                          px-4
                          py-2

                          rounded-2xl

                          bg-surface

                          border
                          border-border

                          text-label

                          transition-all
                          duration-300

                          hover:-translate-y-0.5
                        "
                      >

                        {skill}

                      </div>

                    )
                  )}

                </div>

                {/* SECONDARY */}

                <div
                  className="
                    flex
                    flex-wrap

                    items-center

                    gap-x-3
                    gap-y-2
                  "
                >

                  {item.secondary.map(
                    (
                      skill,
                      skillIndex
                    ) => (

                      <div
                        key={skillIndex}

                        className="
                          flex
                          items-center

                          text-small
                        "
                      >

                        <span>

                          {skill}

                        </span>

                        {skillIndex !==
                          item.secondary.length - 1 && (

                          <span
                            className="
                              ml-3

                              text-muted
                            "
                          >

                            •

                          </span>

                        )}

                      </div>

                    )
                  )}

                </div>

              </motion.div>

            )
          )}

        </div>

      </Container>

    </section>
  );
}

export default Skills;
