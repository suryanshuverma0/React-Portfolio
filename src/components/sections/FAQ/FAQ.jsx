import { useId, useState } from "react";

import PropTypes from "prop-types";

import { motion } from "framer-motion";

import { Plus } from "lucide-react";

import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";
import { faqContent } from "../../content/faqContent";

const EASE = [0.22, 1, 0.36, 1];

function FAQItem({ item, open, onToggle }) {
  const id = useId();

  return (
    <li className="border-b border-border">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="
            group

            flex
            w-full
            items-center
            justify-between

            gap-6

            py-6
            md:py-7

            text-left
          "
        >
          <span className="text-[18px] md:text-[22px] font-semibold tracking-[-0.03em] leading-snug">
            {item.question}
          </span>

          <span
            aria-hidden="true"
            className={`
              h-9
              w-9

              shrink-0

              rounded-full

              border

              inline-flex
              items-center
              justify-center

              transition-all
              duration-300

              ${
                open
                  ? "rotate-45 bg-primary border-primary text-background"
                  : "border-border text-secondary group-hover:border-primary group-hover:text-primary"
              }
            `}
          >
            <Plus size={16} />
          </span>
        </button>
      </h3>

      {/* Answers stay in the DOM (just collapsed) so crawlers read them all. */}
      <motion.div
        id={id}
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="overflow-hidden"
      >
        <p className="text-body text-pretty max-w-3xl pb-7">{item.answer}</p>
      </motion.div>
    </li>
  );
}

FAQItem.propTypes = {
  item: PropTypes.shape({
    question: PropTypes.string.isRequired,
    answer: PropTypes.string.isRequired,
  }).isRequired,
  open: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
};

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="section">
      <Container>
        <SectionTitle
          index="09"
          eyebrow="Questions"
          title={
            <>
              Quick answers, <span className="text-accent">straight up.</span>
            </>
          }
          description="The things people most often ask — about the research, the work, and how to get in touch."
        />

        <motion.ul
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="border-t border-border"
        >
          {faqContent.map((item, index) => (
            <FAQItem
              key={item.question}
              item={item}
              open={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}

export default FAQ;
