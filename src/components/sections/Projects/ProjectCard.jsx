import { motion } from "framer-motion";

import { ArrowUpRight } from "lucide-react";

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

  transition-all
  duration-300

  hover:bg-background
  hover:text-primary
`;

/*
  `lead` renders the first featured project full-width with its summary,
  so the most substantial work is easy to find without shrinking the rest
  of the grid.
*/
function ProjectCard({ project, index, lead = false }) {
  const technologies = project.technologies || [];

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
      className={`
        card
        glass-hover

        group

        h-full

        overflow-hidden

        flex
        flex-col

        transition-[border-color,box-shadow]
        duration-300

        hover:border-secondary/40
        hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)]

        ${lead ? "lg:col-span-2 lg:flex-row lg:gap-8" : ""}
      `}
    >
      {/* THUMBNAIL */}

      <div
        className={`
          relative

          overflow-hidden

          rounded-2xl

          border
          border-border

          bg-surface

          mb-5

          ${lead ? "lg:mb-0 lg:w-[55%] lg:shrink-0" : ""}
        `}
      >
        <img
          src={project.thumbnail}
          alt={project.title}
          loading="lazy"
          decoding="async"
          className={`
            w-full

            aspect-[16/6]

            object-cover

            transition-transform
            duration-500

            group-hover:scale-[1.02]

            ${lead ? "lg:h-full lg:aspect-[16/10]" : ""}
          `}
        />

        {/* CATEGORY */}

        <div
          className="
            absolute
            top-3
            left-3
          "
        >
          <div
            className="
              px-3
              py-1.5

              rounded-full

              bg-background/90

              backdrop-blur-xl

              border
              border-border

              text-[12px]

              font-medium

              tracking-tight
            "
          >
            {project.category}
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div
        className={`
          flex-1

          flex
          flex-col

          ${lead ? "lg:py-2" : ""}
        `}
      >
        {lead && (
          <p
            className="
              text-muted

              mb-3
            "
          >
            Featured project
          </p>
        )}

        {/* TITLE */}

        <h3
          className="
            text-title

            mb-3
          "
        >
          {project.title}
        </h3>

        {lead && project.description && (
          <p
            className="
              text-body

              line-clamp-4

              mb-5
            "
          >
            {project.description}
          </p>
        )}

        {/* TECH STACK */}

        <div
          className="
            flex
            flex-wrap

            gap-2

            mb-6
          "
        >
          {technologies.slice(0, lead ? 6 : 4).map((tech) => (
            <div
              key={tech}
              className="
                  px-3
                  py-1.5

                  rounded-xl

                  bg-surface

                  border
                  border-border

                  text-small

                  leading-none
                "
            >
              {tech}
            </div>
          ))}
        </div>

        {/* CTA */}

        <div
          className="
            mt-auto

            flex
            items-center
            justify-between

            gap-3
          "
        >
          {/* DETAILS */}

          <Link
            to={`/projects/${project.slug}`}
            aria-label={`Detail: ${project.title}`}
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
            Detail
            <ArrowUpRight
              size={16}
              className="
                transition-transform
                duration-300

                group-hover:translate-x-0.5
                group-hover:-translate-y-0.5
              "
            />
          </Link>

          {/* LINKS — only rendered when the project actually has them */}

          <div
            className="
              flex
              items-center

              gap-2
            "
          >
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`GitHub: ${project.title}`}
                className={secondaryLinkClass}
              >
                GitHub
              </a>
            )}

            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Live: ${project.title}`}
                className={secondaryLinkClass}
              >
                Live
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default ProjectCard;
