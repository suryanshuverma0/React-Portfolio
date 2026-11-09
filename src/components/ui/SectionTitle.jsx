import PropTypes from "prop-types";

import { motion } from "framer-motion";

import { useContext } from "react";

import { SectionIndexContext } from "./sectionIndex";

import { useAppearance } from "../../lib/appearance";

/*
  Editorial section header: a hairline rule carrying the section number
  and name, then the heading with its description set beside it on wide
  screens. `align="center"` keeps the stacked, centred layout for pages
  that still use it.
*/
function SectionTitle({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  large = false,
}) {
  const centered = align === "center";

  // On the homepage the number comes from the section's position (so it
  // follows the admin's custom order); elsewhere the `index` prop is used.
  const position = useContext(SectionIndexContext);
  const { effects } = useAppearance();
  const number = effects.sectionNumbers
    ? position
      ? String(position).padStart(2, "0")
      : index
    : null;

  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`mb-12 md:mb-16 ${centered ? "text-center" : ""}`}
    >
      {eyebrow && (
        <div
          className={`
            flex items-center gap-4

            pb-5 mb-8 md:mb-10

            border-b border-border

            ${centered ? "justify-center" : ""}
          `}
        >
          <span className="text-eyebrow text-primary!">
            {number && <span className="text-muted mr-3">{number}</span>}
            {eyebrow}
          </span>

        </div>
      )}

      <div
        className={
          centered
            ? "max-w-3xl mx-auto"
            : description
              ? "grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6 lg:gap-16 items-end"
              : "max-w-4xl"
        }
      >
        <motion.h2
          initial={{ clipPath: "inset(0% 0% 100% 0%)", y: 40 }}
          whileInView={{ clipPath: "inset(-20% -10% -25% -10%)", y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={`${large ? "text-display" : "text-section"} text-balance`}
        >
          {title}
        </motion.h2>

        {description && (
          <p
            className={`
              text-body text-pretty

              ${centered ? "mt-5" : "lg:pb-1.5 max-w-xl"}
            `}
          >
            {description}
          </p>
        )}
      </div>
    </motion.header>
  );
}

SectionTitle.propTypes = {
  index: PropTypes.string,
  eyebrow: PropTypes.string,
  title: PropTypes.node.isRequired,
  description: PropTypes.string,
  align: PropTypes.oneOf(["center", "left"]),
  large: PropTypes.bool,
};

export default SectionTitle;
