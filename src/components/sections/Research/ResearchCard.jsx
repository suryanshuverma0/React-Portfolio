import { useId, useState } from "react";

import PropTypes from "prop-types";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { ArrowUpRight, ChevronDown } from "lucide-react";

import { Link } from "react-router-dom";

const secondaryLinkClass = `
  h-11
  px-4

  rounded-2xl

  border
  border-border

  bg-surface

  text-small

  inline-flex
  items-center
  justify-center

  gap-2

  transition-all
  duration-300

  hover:bg-background
  hover:text-primary
`;

const chipClass = `
  px-3
  py-1.5

  rounded-xl

  bg-surface

  border
  border-border

  text-small

  leading-none
`;

function DetailHeading({ children }) {
  return (
    <h4
      className="
        text-muted

        uppercase

        tracking-[0.18em]

        mb-3
      "
    >
      {children}
    </h4>
  );
}

DetailHeading.propTypes = {
  children: PropTypes.node.isRequired,
};

/*
  Collapsed view is what a recruiter scans: status, title, authors,
  summary, and headline results. Architecture, contributions, gas figures,
  and scope sit behind the details toggle.
*/
function ResearchCard({ paper, index = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const reduceMotion = useReducedMotion();

  const detailsId = useId();

  return (
    <motion.article
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
        glass-hover

        flex
        flex-col

        transition-[border-color,box-shadow]
        duration-300

        hover:border-secondary/40
        hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)]
      "
    >
      {/* STATUS + VENUE */}

      <div
        className="
          flex
          flex-wrap

          items-center

          gap-2

          mb-5
        "
      >
        <div
          className="
            inline-flex
            items-center

            gap-2

            px-3
            py-1.5

            rounded-full

            bg-blue-500/10

            border
            border-blue-500/20

            text-blue-600
            dark:text-blue-400

            text-small
          "
        >
          <span
            aria-hidden="true"
            className="
              h-1.5
              w-1.5

              rounded-full

              bg-blue-500
            "
          />
          {paper.status}
        </div>

        <div
          className="
            inline-flex
            items-center

            px-3
            py-1.5

            rounded-full

            bg-surface

            border
            border-border

            text-small
          "
        >
          {paper.venue}
        </div>

        <p
          className="
            text-muted
          "
        >
          {paper.schedule}
          {paper.paperId && ` · Paper ID ${paper.paperId}`}
        </p>
      </div>

      {/* TITLE */}

      <h3
        className="
          text-title

          leading-snug

          mb-3
        "
      >
        {paper.title}
      </h3>

      {/* AUTHORS */}

      <p
        className="
          text-small

          mb-5
        "
      >
        <span className="sr-only">Authors: </span>
        {paper.authors.map((author, i) => (
          <span key={author.name}>
            {author.self ? (
              <span
                className="
                  text-primary

                  font-semibold
                "
              >
                {author.name}
              </span>
            ) : (
              author.name
            )}
            {i < paper.authors.length - 1 && ", "}
          </span>
        ))}
      </p>

      {/* SUMMARY */}

      <p
        className="
          text-body

          mb-6
        "
      >
        {paper.summary}
      </p>

      {/* HEADLINE RESULTS — grouped by environment so local and
          public-network numbers are never read as the same thing */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-5

          gap-5

          mb-6
        "
      >
        {paper.highlights.map((group) => (
          <div
            key={group.environment}
            className={
              group.results.length > 2 ? "lg:col-span-3" : "lg:col-span-2"
            }
          >
            <p
              className="
                text-muted

                mb-3
              "
            >
              {group.environment}
            </p>

            <dl
              className={`
                grid
                grid-cols-1

                ${group.results.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}

                gap-3
              `}
            >
              {group.results.map((result) => (
                <div
                  key={result.label}
                  className="
                    rounded-2xl

                    border
                    border-border

                    bg-surface

                    p-4

                    flex
                    flex-col
                  "
                >
                  <dt
                    className="
                      text-small

                      order-2
                    "
                  >
                    {result.label}
                  </dt>

                  <dd
                    className="
                      text-xl

                      font-semibold

                      tracking-tight

                      mb-1

                      order-1
                    "
                  >
                    {result.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {/* TECH STACK */}

      <div
        className="
          flex
          flex-wrap

          gap-2

          mb-6
        "
      >
        {paper.technologies.map((tech) => (
          <div key={tech} className={chipClass}>
            {tech}
          </div>
        ))}
      </div>

      {/* DETAILS */}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={detailsId}
            key="details"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
            className="
              overflow-hidden
            "
          >
            <div
              className="
                border-t
                border-border

                pt-6
                mb-6

                grid
                grid-cols-1
                md:grid-cols-2

                gap-8
              "
            >
              {/* ARCHITECTURE */}

              <section>
                <DetailHeading>Architecture</DetailHeading>

                <ul
                  className="
                    flex
                    flex-col

                    gap-3
                  "
                >
                  {paper.contracts.map((contract) => (
                    <li key={contract.name}>
                      <p
                        className="
                          text-mono

                          text-primary

                          mb-0.5
                        "
                      >
                        {contract.name}
                      </p>

                      <p className="text-small">{contract.description}</p>
                    </li>
                  ))}
                </ul>
              </section>

              {/* CONTRIBUTIONS */}

              <section>
                <DetailHeading>Contributions</DetailHeading>

                <ul
                  className="
                    flex
                    flex-col

                    gap-2

                    list-disc

                    pl-5

                    marker:text-muted
                  "
                >
                  {paper.contributions.map((item) => (
                    <li key={item} className="text-small">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* GAS */}

              <section>
                <DetailHeading>Average gas · Sepolia</DetailHeading>

                <dl
                  className="
                    rounded-2xl

                    border
                    border-border

                    bg-surface

                    divide-y
                    divide-border
                  "
                >
                  {paper.gas.map((item) => (
                    <div
                      key={item.label}
                      className="
                        flex
                        items-center
                        justify-between

                        gap-4

                        px-4
                        py-2.5
                      "
                    >
                      <dt className="text-small">{item.label}</dt>

                      <dd
                        className="
                          text-mono

                          text-primary

                          tabular-nums
                        "
                      >
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* EVALUATION + SCOPE */}

              <section>
                <DetailHeading>Evaluation notes</DetailHeading>

                <ul
                  className="
                    flex
                    flex-col

                    gap-2

                    list-disc

                    pl-5

                    marker:text-muted

                    mb-6
                  "
                >
                  {paper.evaluationNotes.map((item) => (
                    <li key={item} className="text-small">
                      {item}
                    </li>
                  ))}
                </ul>

                <DetailHeading>Scope &amp; limitations</DetailHeading>

                <ul
                  className="
                    flex
                    flex-col

                    gap-2

                    list-disc

                    pl-5

                    marker:text-muted
                  "
                >
                  {paper.limitations.map((item) => (
                    <li key={item} className="text-small">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}

      <div
        className="
          mt-auto

          flex
          flex-wrap

          items-center
          justify-between

          gap-3
        "
      >
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={expanded ? detailsId : undefined}
          className="
            h-control

            px-control

            rounded-control

            bg-primary

            text-background

            inline-flex
            items-center
            justify-center

            gap-2

            text-label

            transition-all
            duration-300

            hover:opacity-90
          "
        >
          {expanded ? "Hide details" : "Research details"}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`
              transition-transform
              duration-300

              ${expanded ? "rotate-180" : ""}
            `}
          />
        </button>

        <div
          className="
            flex
            flex-wrap

            items-center

            gap-2
          "
        >
          {paper.projectSlug && (
            <Link
              to={`/projects/${paper.projectSlug}`}
              className={secondaryLinkClass}
            >
              Project
            </Link>
          )}

          {paper.githubUrl && (
            <a
              href={paper.githubUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="PharmaTrace implementation on GitHub (opens in a new tab)"
              className={secondaryLinkClass}
            >
              Implementation
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

ResearchCard.propTypes = {
  paper: PropTypes.shape({
    title: PropTypes.string.isRequired,
    status: PropTypes.string,
    venue: PropTypes.string,
    paperId: PropTypes.string,
    schedule: PropTypes.string,
    authors: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        self: PropTypes.bool,
      }),
    ).isRequired,
    summary: PropTypes.string,
    highlights: PropTypes.array.isRequired,
    contracts: PropTypes.array.isRequired,
    contributions: PropTypes.array.isRequired,
    gas: PropTypes.array.isRequired,
    evaluationNotes: PropTypes.array.isRequired,
    limitations: PropTypes.array.isRequired,
    technologies: PropTypes.array.isRequired,
    githubUrl: PropTypes.string,
    projectSlug: PropTypes.string,
  }).isRequired,
  index: PropTypes.number,
};

export default ResearchCard;
