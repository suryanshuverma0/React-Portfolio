import { useId, useState } from "react";

import PropTypes from "prop-types";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { ArrowUpRight, ChevronDown, FileText } from "lucide-react";

import { Link } from "react-router-dom";

import { trackPointer } from "../../../lib/pointer";

const EASE = [0.22, 1, 0.36, 1];

const toNumber = (value) => Number(String(value).replace(/[^\d.]/g, "")) || 0;

function DetailHeading({ children, note }) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-5">
      <h4 className="text-eyebrow text-primary!">{children}</h4>
      {note && <span className="text-eyebrow">{note}</span>}
    </div>
  );
}

DetailHeading.propTypes = {
  children: PropTypes.node.isRequired,
  note: PropTypes.string,
};

/* Three contracts drawn as a pipeline: authorization → lifecycle → lookup. */
function ArchitectureDiagram({ contracts }) {
  return (
    <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-0">
      {contracts.map((contract, index) => (
        <li key={contract.name} className="relative flex md:block">
          <div
            className="
              relative z-[1]

              w-full

              rounded-2xl

              border
              border-border

              bg-background

              p-5

              md:mr-6
            "
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-eyebrow">C{index + 1}</span>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>

            <p className="font-mono text-[14px] font-medium text-primary mb-1.5">
              {contract.name}
              <span className="text-muted">.sol</span>
            </p>

            <p className="text-small">{contract.description}</p>
          </div>

          {/* CONNECTOR */}
          {index < contracts.length - 1 && (
            <span
              aria-hidden="true"
              className="
                hidden
                md:block

                absolute

                top-1/2
                right-0

                h-px
                w-6

                bg-border-strong
              "
            />
          )}
        </li>
      ))}
    </ol>
  );
}

ArchitectureDiagram.propTypes = {
  contracts: PropTypes.array.isRequired,
};

/* Average gas per operation, bars scaled to the most expensive one. */
function GasChart({ rows }) {
  const max = Math.max(...rows.map((row) => toNumber(row.value)), 1);

  return (
    <dl className="flex flex-col gap-4">
      {rows.map((row, index) => {
        const share = (toNumber(row.value) / max) * 100;

        return (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-4 mb-2">
              <dt className="text-small">{row.label}</dt>
              <dd className="font-mono text-[13px] text-primary tabular-nums">
                {row.value}
              </dd>
            </div>

            <div aria-hidden="true" className="h-1.5 rounded-full bg-surface overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                style={{ opacity: 1 - index * 0.14 }}
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(share, 2)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.08, ease: EASE }}
              />
            </div>
          </div>
        );
      })}
    </dl>
  );
}

GasChart.propTypes = {
  rows: PropTypes.array.isRequired,
};

function BulletList({ items, numbered = false }) {
  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item, index) => (
        <li key={item} className="flex gap-4 text-small">
          <span className="font-mono text-[12px] text-muted pt-0.5 shrink-0 tabular-nums">
            {numbered ? String(index + 1).padStart(2, "0") : "—"}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

BulletList.propTypes = {
  items: PropTypes.array.isRequired,
  numbered: PropTypes.bool,
};

/*
  Featured paper. The collapsed view is what a recruiter scans: status,
  title, authors, abstract and headline results. Architecture,
  contributions, gas figures and scope sit behind the details toggle.
*/
function ResearchCard({ paper, index = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const reduceMotion = useReducedMotion();

  const detailsId = useId();

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.06, ease: EASE }}
      className="beam rounded-[32px]"
    >
      <div
        onMouseMove={trackPointer}
        className="
          panel
          spotlight

          rounded-[32px]

          overflow-hidden

          shadow-[0_40px_100px_-50px_rgba(0,0,0,0.35)]
        "
      >
        {/* HEADER BAR */}

        <div
          className="
            flex
            flex-wrap

            items-center
            justify-between

            gap-3

            border-b
            border-border

            bg-surface/60

            px-5
            sm:px-8
            md:px-10

            py-4
          "
        >
          <div className="flex items-center gap-2.5 text-eyebrow">
            <FileText size={13} aria-hidden="true" />
            {paper.paperId && <span>Paper {paper.paperId}</span>}
            <span aria-hidden="true">/</span>
            <span className="text-primary">{paper.venue}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {paper.schedule && (
              <span className="text-eyebrow hidden md:inline">{paper.schedule}</span>
            )}

            <span
              className="
                inline-flex
                items-center

                gap-2

                h-7

                rounded-full

                bg-primary

                px-3

                text-[12px]
                font-medium

                text-background
              "
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-background" />
              {paper.status}
            </span>
          </div>
        </div>

        {/* BODY */}

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
          {/* PAPER */}

          <div className="p-5 sm:p-8 md:p-10 lg:border-r lg:border-border">
            <h3
              className="
                text-[24px]
                sm:text-[28px]
                md:text-[34px]

                font-semibold

                leading-[1.12]

                tracking-[-0.035em]

                text-balance
              "
            >
              {paper.title}
            </h3>

            {/* AUTHORS */}

            <p className="mt-6 flex flex-wrap gap-x-1 gap-y-1 text-small">
              <span className="sr-only">Authors: </span>
              {paper.authors.map((author, i) => (
                <span key={author.name}>
                  {author.self ? (
                    <span className="font-medium text-primary underline decoration-border-strong underline-offset-4">
                      {author.name}
                    </span>
                  ) : (
                    author.name
                  )}
                  {i < paper.authors.length - 1 && ","}
                </span>
              ))}
            </p>

            {/* ABSTRACT */}

            <p className="text-eyebrow mt-9 mb-3">Abstract</p>

            <p className="text-body text-pretty">{paper.summary}</p>
          </div>

          {/* RESULTS */}

          <div className="p-5 sm:p-8 md:p-10 bg-surface/40 border-t border-border lg:border-t-0">
            <p className="text-eyebrow text-primary! mb-7">Headline results</p>

            <div className="flex flex-col gap-8">
              {paper.highlights.map((group) => (
                <div key={group.environment}>
                  <p className="text-eyebrow mb-3">{group.environment}</p>

                  {/* Hairline grid: 1px gaps over a border-coloured backing */}
                  <dl
                    className="
                      grid
                      grid-cols-2

                      gap-px

                      overflow-hidden

                      rounded-2xl

                      border
                      border-border

                      bg-border
                    "
                  >
                    {group.results.map((result, i) => (
                      <div
                        key={result.label}
                        className={`
                          flex
                          flex-col

                          bg-card

                          p-4
                          sm:p-5

                          ${
                            group.results.length % 2 === 1 &&
                            i === group.results.length - 1
                              ? "col-span-2"
                              : ""
                          }
                        `}
                      >
                        <dt className="text-[13px] leading-snug text-secondary order-2">
                          {result.label}
                        </dt>

                        <dd
                          className="
                            order-1

                            mb-2

                            text-[26px]
                            sm:text-[32px]

                            font-semibold

                            leading-none

                            tracking-[-0.045em]

                            tabular-nums
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
          </div>
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
              transition={{ duration: reduceMotion ? 0 : 0.45, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="border-t border-border p-5 sm:p-8 md:p-10 flex flex-col gap-12">
                <section>
                  <DetailHeading note="3 contracts">Architecture</DetailHeading>
                  <ArchitectureDiagram contracts={paper.contracts} />
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section>
                    <DetailHeading>Contributions</DetailHeading>
                    <BulletList items={paper.contributions} numbered />
                  </section>

                  <section>
                    <DetailHeading note="Sepolia · 10 runs">Average gas</DetailHeading>
                    <GasChart rows={paper.gas} />
                  </section>
                </div>

                <section>
                  <DetailHeading>Stack</DetailHeading>

                  <div className="flex flex-wrap gap-2">
                    {paper.technologies.map((tech) => (
                      <span key={tech} className="chip">
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section>
                    <DetailHeading>Evaluation notes</DetailHeading>
                    <BulletList items={paper.evaluationNotes} />
                  </section>

                  <section>
                    <DetailHeading>Scope &amp; limitations</DetailHeading>
                    <BulletList items={paper.limitations} />
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER */}

        <div
          className="
            flex
            flex-wrap

            items-center
            justify-between

            gap-3

            border-t
            border-border

            px-5
            sm:px-8
            md:px-10

            py-5
          "
        >
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-controls={expanded ? detailsId : undefined}
            className="btn btn-primary"
          >
            {expanded ? "Hide details" : "Read the full breakdown"}
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            />
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {paper.projectSlug && (
              <Link to={`/projects/${paper.projectSlug}`} className="btn btn-outline">
                See the project
              </Link>
            )}

            {paper.githubUrl && (
              <a
                href={paper.githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Implementation on GitHub (opens in a new tab)"
                className="btn btn-outline"
              >
                Implementation
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            )}
          </div>
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
