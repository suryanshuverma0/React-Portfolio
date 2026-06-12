import {
  motion,
} from "framer-motion";

import Container from "../../ui/Container";

import SectionTitle from "../../ui/SectionTitle";

import {
  servicesContent,
} from "../../content/servicesContent";

function Services() {

  return (

    <section
      id="services"

      className="
        section
      "
    >

      <Container>

        {/* TITLE */}

        <SectionTitle

          eyebrow="Services"

          title="What I can help build."

          description="Focused on scalable backend systems, modern web applications, blockchain integrations, and production-oriented software solutions."
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

          {servicesContent.map(
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

                {/* TOP */}

                <div
                  className="
                    flex
                    items-start
                    justify-between

                    gap-4

                    mb-6
                  "
                >

                  {/* LEFT */}

                  <div>

                    <p
                      className="
                        text-muted

                        uppercase

                        tracking-[0.16em]

                        mb-3
                      "
                    >

                      {item.category}

                    </p>

                    <h3
                      className="
                        text-title

                        leading-tight
                      "
                    >

                      {item.title}

                    </h3>

                  </div>

                  {/* NUMBER */}

                  <span
                    className="
                      text-muted

                      text-sm

                      shrink-0
                    "
                  >

                    0{index + 1}

                  </span>

                </div>

                {/* DESCRIPTION */}

                <p
                  className="
                    text-body

                    mb-6
                  "
                >

                  {item.description}

                </p>

                {/* STACK */}

                <div
                  className="
                    flex
                    flex-wrap

                    items-center

                    gap-x-3
                    gap-y-2
                  "
                >

                  {item.stack.map(
                    (
                      tech,
                      techIndex
                    ) => (

                      <div
                        key={techIndex}

                        className="
                          flex
                          items-center

                          text-small
                        "
                      >

                        <span>

                          {tech}

                        </span>

                        {techIndex !==
                          item.stack.length - 1 && (

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

export default Services;
