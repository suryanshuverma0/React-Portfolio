import {
  motion,
} from "framer-motion";

import {
  ArrowUpRight,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

function ProjectCard({
  project,
  index,
}) {

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

        h-full

        overflow-hidden

        flex
        flex-col
      "
    >

      {/* THUMBNAIL */}

      <div
        className="
          relative

          overflow-hidden

          rounded-2xl

          border
          border-border

          bg-surface

          mb-5
        "
      >

        <img
          src={project.thumbnail}

          alt={project.title}

          className="
            w-full

            aspect-[16/9]

            object-cover

            transition-transform
            duration-500

            hover:scale-[1.02]
          "
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
        className="
          flex-1

          flex
          flex-col
        "
      >

        {/* TITLE */}

        <h3
          className="
            text-title

            mb-3
          "
        >

          {project.title}

        </h3>

        {/* DESCRIPTION */}

        <p
          className="
            text-body

            mb-5
          "
        >

          {project.shortDescription}

        </p>

        {/* TECH STACK */}

        <div
          className="
            flex
            flex-wrap

            gap-2

            mb-6
          "
        >

          {project.technologies
            .slice(0, 4)
            .map((tech) => (

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
            />

          </Link>

          {/* LINKS */}

          <div
            className="
              flex
              items-center

              gap-2
            "
          >

            <a
              href={project.githubUrl}

              target="_blank"

              rel="noreferrer"

              className="
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
              "
            >

              GitHub

            </a>

            <a
              href={project.liveUrl}

              target="_blank"

              rel="noreferrer"

              className="
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
              "
            >

              Live

            </a>

          </div>

        </div>

      </div>

    </motion.article>

  );
}

export default ProjectCard;
