import PropTypes from "prop-types";

import { motion } from "framer-motion";

import { ArrowUpRight } from "lucide-react";

import { FaGithub } from "react-icons/fa";

import { Link } from "react-router-dom";

import { trackPointer } from "../../../lib/pointer";
import { useReadyImage } from "../Products/productMedia";

const iconLinkClass = `
  h-10
  w-10

  rounded-full

  border
  border-border

  inline-flex
  items-center
  justify-center

  text-secondary

  transition-colors
  duration-200

  hover:border-primary
  hover:text-primary
`;

/*
  `lead` renders the first featured project full-width with its summary,
  so the most substantial work is easy to find without shrinking the rest
  of the grid.
*/
function ProjectCard({ project, index, lead = false }) {
  const technologies = project.technologies || [];
  const cover = useReadyImage(project.thumbnail || "");

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={trackPointer}
      className={`
        panel
        panel-hover
        spotlight

        group

        h-full

        p-3

        flex
        flex-col

        ${lead ? "lg:col-span-2 lg:grid lg:grid-cols-[1.25fr_1fr] lg:gap-2" : ""}
      `}
    >
      {/* THUMBNAIL */}

      <Link
        to={`/projects/${project.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className={`
          relative

          block

          w-full

          self-start

          ${lead ? "aspect-[16/10]" : "aspect-[16/9]"}

          overflow-hidden

          rounded-[calc(20px*var(--radius-scale))]

          border
          border-border

          bg-surface
        `}
      >
        {cover ? (
        <img
          src={cover}
          alt=""
          loading="lazy"
          decoding="async"
          className={`
            absolute
            inset-0

            h-full
            w-full

            object-cover
            object-top

            transition-transform
            duration-700
            ease-out

            group-hover:scale-[1.03]
          `}
        />
        ) : (
          <span className="absolute inset-0 animate-pulse bg-surface" aria-hidden="true" />
        )}

        <span
          className="
            absolute
            top-3
            left-3

            chip

            bg-background/85!
            backdrop-blur-md

            text-primary!
          "
        >
          {project.category}
        </span>
      </Link>

      {/* CONTENT */}

      <div className={`flex-1 flex flex-col p-3 pt-5 ${lead ? "lg:p-6" : ""}`}>
        {lead && <p className="text-eyebrow text-primary! mb-4">Featured project</p>}

        <h3
          className={`
            ${lead ? "text-[26px] md:text-[32px]" : "text-[21px] md:text-[23px]"}

            font-semibold

            leading-[1.15]

            tracking-[-0.035em]

            text-balance
          `}
        >
          <Link to={`/projects/${project.slug}`} className="hover:opacity-75 transition-opacity">
            {project.title}
          </Link>
        </h3>

        {lead && project.description && (
          <p className="text-body mt-4 line-clamp-5 text-pretty">{project.description}</p>
        )}

        {/* TECH STACK */}

        <div className="mt-5 mb-7 flex flex-wrap gap-2">
          {technologies.slice(0, lead ? 6 : 3).map((tech) => (
            <span key={tech} className="chip">
              {tech}
            </span>
          ))}
        </div>

        {/* CTA */}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5 border-t border-border">
          <Link
            to={`/projects/${project.slug}`}
            aria-label={`Case study: ${project.title}`}
            className="group/cta inline-flex items-center gap-2 text-[14px] font-medium tracking-tight"
          >
            View case study
            <span
              className="
                h-8
                w-8

                rounded-full

                bg-primary

                text-background

                inline-flex
                items-center
                justify-center

                transition-transform
                duration-300

                group-hover/cta:rotate-45
              "
            >
              <ArrowUpRight size={15} aria-hidden="true" />
            </span>
          </Link>

          {/* LINKS — only rendered when the project actually has them */}

          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`GitHub: ${project.title}`}
                className={iconLinkClass}
              >
                <FaGithub size={16} />
              </a>
            )}

            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Live: ${project.title}`}
                className="btn btn-outline h-10! px-4! text-[13px]!"
              >
                Live
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

ProjectCard.propTypes = {
  project: PropTypes.shape({
    slug: PropTypes.string,
    title: PropTypes.string,
    category: PropTypes.string,
    description: PropTypes.string,
    thumbnail: PropTypes.string,
    technologies: PropTypes.array,
    githubUrl: PropTypes.string,
    liveUrl: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  lead: PropTypes.bool,
};

export default ProjectCard;
