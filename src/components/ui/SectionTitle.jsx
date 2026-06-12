import PropTypes from "prop-types";

import {
  motion,
} from "framer-motion";

function SectionTitle({

  eyebrow,

  title,

  description,

  align = "center",

  large = false,
}) {

  const alignment = {

    center:
      "text-center items-center",

    left:
      "text-left items-start",
  };

  return (

    <motion.div

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
      }}

      className={`
        flex
        flex-col

        ${alignment[align]}

        max-w-2xl

        ${
          align === "center"
            ? "mx-auto"
            : ""
        }

        mb-12
      `}
    >

      {/* EYEBROW */}

      {eyebrow && (

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

            mb-5
          "
        >

          <span
            className="
              h-2
              w-2

              rounded-full

              bg-blue-500
            "
          />

          <span
            className="
              text-small

              uppercase

              tracking-[0.18em]
            "
          >

            {eyebrow}

          </span>

        </div>

      )}

      {/* TITLE */}

      <h2
        className={`
          ${
            large
              ? "text-hero"
              : "text-heading"
          }

          tracking-tight
        `}
      >

        {title}

      </h2>

      {/* DESCRIPTION */}

      {description && (

        <p
          className="
            text-body

            mt-5
          "
        >

          {description}

        </p>

      )}

    </motion.div>
  );
}

SectionTitle.propTypes = {

  eyebrow:
    PropTypes.string,

  title:
    PropTypes.string
      .isRequired,

  description:
    PropTypes.string,

  align:
    PropTypes.oneOf([
      "center",
      "left",
    ]),

  large:
    PropTypes.bool,
};

export default SectionTitle;
