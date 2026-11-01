import PropTypes from "prop-types";

import { ArrowUpRight, MapPin } from "lucide-react";

import { formatExperienceRange } from "../../lib/date";
import { trackPointer } from "../../lib/pointer";

/*
  One row of the experience timeline: dates and duration in a mono rail on
  the left, the role on a panel to the right. Dates arrive as ISO strings
  from the API (or labels in the fallback content) and are normalised to
  "Jan 2025 — Jun 2025".
*/
function ExperienceCard({ experience, last = false }) {
  const range = formatExperienceRange(experience);

  const technologies = experience.technologies || [];

  return (
    <div className="relative grid grid-cols-[20px_1fr] md:grid-cols-[200px_28px_1fr] gap-x-4 md:gap-x-6">
      {/* DATE RAIL (desktop) */}

      <div className="hidden md:block pt-7 text-right">
        <p className="font-mono text-[13px] text-primary tabular-nums">
          {range.start} — {range.end}
        </p>

        {range.duration && <p className="text-eyebrow mt-2">{range.duration}</p>}
      </div>

      {/* NODE + LINE */}

      <div aria-hidden="true" className="relative flex justify-center">
        <span
          className={`
            absolute

            top-[34px]
            -bottom-[30px]

            w-px

            bg-border

            ${last ? "hidden" : ""}
          `}
        />

        <span className="relative mt-[30px] flex h-2.5 w-2.5">
          {range.current && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-40 animate-ping" />
          )}

          <span
            className={`
              relative

              inline-flex

              h-2.5
              w-2.5

              rounded-full

              ${range.current ? "bg-primary" : "border-2 border-primary bg-background"}
            `}
          />
        </span>
      </div>

      {/* PANEL */}

      <article
        onMouseMove={trackPointer}
        className={`
          panel
          panel-hover
          spotlight

          p-5
          sm:p-7

          ${last ? "" : "mb-6"}
        `}
      >
        {/* Mobile dates — the rail is hidden below md */}

        <p className="md:hidden font-mono text-[12px] text-primary tabular-nums mb-3">
          {range.start} — {range.end}
          {range.duration && <span className="text-muted"> · {range.duration}</span>}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[20px] md:text-[24px] font-semibold tracking-[-0.03em] leading-tight">
              {experience.role}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-small">
              {experience.companyUrl ? (
                <a
                  href={experience.companyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1 font-medium text-primary"
                >
                  {experience.company}
                  <ArrowUpRight
                    size={14}
                    aria-hidden="true"
                    className="text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              ) : (
                <span className="font-medium text-primary">{experience.company}</span>
              )}

              {experience.location && (
                <span className="inline-flex items-center gap-1 text-muted">
                  <MapPin size={13} aria-hidden="true" />
                  {experience.location}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {range.current && (
              <span className="chip bg-primary! text-background! border-primary!">Current</span>
            )}

            {experience.employmentType && <span className="chip">{experience.employmentType}</span>}
          </div>
        </div>

        <p className="text-body mt-5 text-pretty">{experience.description}</p>

        {technologies.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <span key={tech} className="chip">
                {tech}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

ExperienceCard.propTypes = {
  experience: PropTypes.shape({
    role: PropTypes.string,
    company: PropTypes.string,
    startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    isCurrent: PropTypes.bool,
    location: PropTypes.string,
    employmentType: PropTypes.string,
    description: PropTypes.string,
    technologies: PropTypes.array,
    companyUrl: PropTypes.string,
    featured: PropTypes.bool,
  }).isRequired,
  last: PropTypes.bool,
};

export default ExperienceCard;
