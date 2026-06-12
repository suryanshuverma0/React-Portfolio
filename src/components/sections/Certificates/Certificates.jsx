import CarouselModule from "react-multi-carousel";

const Carousel =
  CarouselModule.default;

import "react-multi-carousel/lib/styles.css";

import {
  motion,
} from "framer-motion";

import Container
from "../../ui/Container";

import SectionTitle
from "../../ui/SectionTitle";

import {
  certificatesContent,
} from "../../content/certificatesContent";

/* ========================================
   RESPONSIVE
======================================== */

const responsive = {

  desktop: {
    breakpoint: {
      max: 3000,
      min: 1024,
    },

    items: 1,
  },

  tablet: {
    breakpoint: {
      max: 1024,
      min: 640,
    },

    items: 1,
  },

  mobile: {
    breakpoint: {
      max: 640,
      min: 0,
    },

    items: 1,
  },
};

/* ========================================
   COMPONENT
======================================== */

function Certificates() {

  return (

    <section
      id="certificates"

      className="
        section

        overflow-hidden
      "
    >

      <Container>

        {/* TITLE */}

        <SectionTitle

          eyebrow="Certificates"

          title="
            Technical certifications
            and learning milestones.
          "

          description="
            Selected certifications
            across backend engineering,
            blockchain systems,
            and software development.
          "
        />

        {/* CAROUSEL */}

        <div
          className="
            relative
          "
        >

          {/* GLOW */}

          <div
            className="
              absolute
              inset-0

              bg-blue-500/5

              blur-[120px]

              rounded-full

              pointer-events-none
            "
          />

          <Carousel

            responsive={responsive}

            arrows

            showDots

            infinite

            autoPlay

            autoPlaySpeed={4500}

            swipeable

            draggable

            keyBoardControl

            renderDotsOutside={false}

            containerClass="
              w-full
            "

            itemClass="
              px-0
              sm:px-2
            "
          >

            {certificatesContent.map(
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
                    delay:
                      index * 0.05,
                  }}

                  className="
                    card

                    overflow-hidden

                    mx-auto

                    w-full

                    max-w-[920px]
                  "
                >

                  {/* TOP */}

                  <div
                    className="
                      flex
                      items-center
                      justify-between

                      pb-4

                      border-b
                      border-border
                    "
                  >

                    {/* DOTS */}

                    <div
                      className="
                        flex
                        items-center

                        gap-2
                      "
                    >

                      <div
                        className="
                          h-2
                          w-2

                          rounded-full

                          bg-red-400
                        "
                      />

                      <div
                        className="
                          h-2
                          w-2

                          rounded-full

                          bg-yellow-400
                        "
                      />

                      <div
                        className="
                          h-2
                          w-2

                          rounded-full

                          bg-green-400
                        "
                      />

                    </div>

                    <p
                      className="
                        text-muted

                        uppercase

                        tracking-[0.18em]
                      "
                    >

                      Certificate

                    </p>

                  </div>

                  {/* IMAGE */}

                  <div
                    className="
                      mt-4

                      overflow-hidden

                      rounded-2xl

                      border
                      border-border

                      bg-surface
                    "
                  >

                    <img

                      src={item.image}

                      alt={item.title}

                      loading="lazy"

                      className="
                        w-full

                        aspect-video

                        object-cover
                      "
                    />

                  </div>

                  {/* FOOTER */}

                  <div
                    className="
                      pt-4

                      flex
                      flex-col
                      sm:flex-row

                      sm:items-center
                      sm:justify-between

                      gap-4
                    "
                  >

                    {/* INFO */}

                    <div>

                      <p
                        className="
                          text-muted

                          mb-1
                        "
                      >

                        {item.issuer}
                        {" · "}
                        {item.year}

                      </p>

                      <h3
                        className="
                          text-label
                        "
                      >

                        {item.title}

                      </h3>

                    </div>

                    {/* CTA */}

                    <button
                      type="button"

                      onClick={() =>
                        window.open(
                          item.verifyUrl,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }

                      className="
                        h-control

                        px-control

                        rounded-control

                        bg-primary

                        text-background

                        text-label

                        shrink-0

                        transition-all
                        duration-300

                        hover:opacity-90
                      "
                    >

                      Verify

                    </button>

                  </div>

                </motion.div>

              )
            )}

          </Carousel>

        </div>

      </Container>

    </section>
  );
}

export default Certificates;
