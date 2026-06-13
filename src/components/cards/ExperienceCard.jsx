import PropTypes from "prop-types";

import {
  ArrowUpRight,
} from "lucide-react";

function ExperienceCard({
  experience,
}) {

  return (

    <div
      className="
        card

        h-full

        flex
        flex-col

        transition-all
        duration-300

        hover:-translate-y-1
      "
    >

      {/* HEADER */}

      <div
        className="
          flex
          flex-col

          sm:flex-row
          sm:items-start
          sm:justify-between

          gap-5

          mb-5
        "
      >

        {/* LEFT */}

        <div
          className="
            min-w-0
          "
        >

          {/* DATE */}

          <p
            className="
              text-muted

              mb-2
            "
          >

            {experience.startDate}
            {" — "}
            {experience.endDate}

          </p>

          {/* ROLE */}

          <h3
            className="
              text-title

              mb-2

              leading-tight
            "
          >

            {experience.role}

          </h3>

          {/* COMPANY */}

          <div
            className="
              flex
              flex-wrap

              items-center

              gap-x-2
              gap-y-1
            "
          >

            <p
              className="
                text-label

                text-secondary
              "
            >

              {experience.company}

            </p>

            {experience.location && (

              <span
                className="
                  text-muted
                "
              >

                ·
                {" "}
                {experience.location}

              </span>

            )}

          </div>

        </div>

        {/* CTA */}

        {experience.companyUrl && (

          <a
            href={
              experience.companyUrl
            }

            target="_blank"

            rel="noreferrer"

            className="
              h-10

              px-4

              rounded-control

              border
              border-border

              bg-primary

              inline-flex
              items-center
              justify-center

              gap-2

              text-small
              text-background

              shrink-0

              transition-all
              duration-300

              hover:bg-background
            "
          >

            Visit

            <ArrowUpRight
              size={15}
            />

          </a>

        )}

      </div>

      {/* META */}

      <div
        className="
          flex
          flex-wrap

          items-center

          gap-2

          mb-5
        "
      >

        {/* EMPLOYMENT TYPE */}

        {experience.employmentType && (

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

            {experience.employmentType}

          </div>

        )}

        {/* FEATURED */}

        {/* {experience.featured && (

          <div
            className="
              inline-flex
              items-center

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

            Featured

          </div>

        )} */}

      </div>

      {/* DESCRIPTION */}

      <p
        className="
          text-body

          mb-5
        "
      >

        {experience.description}

      </p>

      {/* TECH STACK */}

      <div
        className="
          flex
          flex-wrap

          gap-2

          mt-auto
        "
      >

        {experience.technologies.map(
          (
            tech,
            index
          ) => (

            <div
              key={index}

              className="
                px-3
                py-1.5

                rounded-xl

                bg-surface

                border
                border-border

                text-small
              "
            >

              {tech}

            </div>

          )
        )}

      </div>

    </div>

  );
}

ExperienceCard.propTypes = {

  experience:
    PropTypes.shape({

      role:
        PropTypes.string,

      company:
        PropTypes.string,

      startDate:
        PropTypes.string,

      endDate:
        PropTypes.string,

      location:
        PropTypes.string,

      employmentType:
        PropTypes.string,

      description:
        PropTypes.string,

      technologies:
        PropTypes.array,

      companyUrl:
        PropTypes.string,

      featured:
        PropTypes.bool,
    }).isRequired,
};

export default ExperienceCard;
