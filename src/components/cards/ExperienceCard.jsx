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

      {/* TOP */}

      <div
        className="
          flex
          items-start
          justify-between

          gap-4

          mb-5
        "
      >

        {/* LEFT */}

        <div>

          {/* DATE */}

          <p
            className="
              text-muted

              mb-3
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

              gap-2
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
              h-control

              px-control

              rounded-control

              border
              border-border

              inline-flex
              items-center
              justify-center

              gap-2

              text-label

              shrink-0

              transition-all
              duration-300

              hover:bg-black/[0.03]
              dark:hover:bg-white/[0.04]
            "
          >

            Visit

            <ArrowUpRight
              size={16}
            />

          </a>

        )}

      </div>

      {/* EMPLOYMENT TYPE */}

      {experience.employmentType && (

        <div
          className="
            mb-5
          "
        >

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

        </div>

      )}

      {/* DESCRIPTION */}

      <p
        className="
          text-body

          mb-6
        "
      >

        {experience.description}

      </p>

      {/* TECH STACK */}

      <div
        className="
          flex
          flex-wrap

          gap-3

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
                px-4
                py-2

                rounded-2xl

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
