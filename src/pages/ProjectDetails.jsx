import {
  useParams,
  Link,
} from "react-router-dom";


import {
  useEffect,
} from "react";

import {
  ArrowLeft,
  ArrowUpRight,
} from "lucide-react";

import Container
from "../components/ui/Container";

import ProjectGallery
from "../components/sections/Projects/ProjectGallery";

import {
  projectsContent,
} from "../components/content/projectsContent";

import SEO
from "../components/common/SEO";

import {
  
  Navigate,
} from "react-router-dom";
function ProjectDetails() {

  const { slug } =
    useParams();

  const project =
    projectsContent.find(
      (item) =>
        item.slug === slug
    );

/* ========================================
   SCROLL TO TOP
======================================== */

useEffect(() => {

  window.scrollTo({
    top: 0,
    behavior: "instant",
  });

}, []);


  /* ========================================
     NOT FOUND
  ========================================= */

if (!project) {

  return (
    <Navigate
      to="*"
      replace
    />
  );
}


  return (

    <main
      className="
        section
      "
    >

      {/* SEO */}

      <SEO

        title={`
          ${project.title}
          | Suryanshu Verma
        `}

        description={
          project.description
        }

        keywords={`
          ${project.title},
          blockchain project,
          MERN project,
          ${project.technologies.join(",")}
        `}

        image={
          project.thumbnail
        }
      />

      <Container>

        {/* BACK */}

        <Link

          to="/#projects"

          className="
            inline-flex
            items-center

            gap-2

            text-small

            text-secondary

            hover:text-primary

            transition-all

            mb-8
          "
        >

          <ArrowLeft size={16} />

          Back to Projects

        </Link>

        {/* HERO */}

        <div
          className="
            mb-10
            md:mb-14
          "
        >

          {/* CATEGORY */}

          <div
            className="
              inline-flex
              items-center

              px-3
              py-1.5

              rounded-full

              border
              border-border

              bg-surface

              text-small

              mb-5
            "
          >

            {project.category}

          </div>

          {/* TITLE */}

          <h1
            className="
              text-4xl
              sm:text-5xl
              md:text-6xl

              font-semibold

              tracking-[-0.05em]

              leading-[0.95]

              max-w-4xl

              mb-5
            "
          >

            {project.title}

          </h1>

          {/* DESCRIPTION */}

          <p
            className="
              text-large

              max-w-3xl

              mb-7
            "
          >

            {project.description}

          </p>

          {/* CTA */}

          <div
            className="
              flex
              flex-wrap

              gap-3
            "
          >

            {/* GITHUB */}

            <a

              href={
                project.githubUrl
              }

              target="_blank"

              rel="noreferrer"

              className="
                h-10

                px-4

                rounded-control

                bg-primary

                text-background

                inline-flex
                items-center
                justify-center

                gap-2

                text-small

                transition-all
                duration-300

                hover:opacity-90
              "
            >

              GitHub

              <ArrowUpRight
                size={16}
              />

            </a>

            {/* LIVE */}

            <a

              href={
                project.liveUrl
              }

              target="_blank"

              rel="noreferrer"

              className="
                h-10

                px-4

                rounded-control

                border
                border-border

                bg-surface

                inline-flex
                items-center
                justify-center

                gap-2

                text-small

                transition-all
                duration-300

                hover:bg-background
              "
            >

              Live Demo

              <ArrowUpRight
                size={16}
              />

            </a>

          </div>

        </div>

        {/* GALLERY */}

        <div
          className="
            mb-10
            md:mb-14
          "
        >

          <ProjectGallery

            images={
              project.gallery
            }

            title={
              project.title
            }
          />

        </div>

        {/* FEATURES + TECH */}

        <div
          className="
            grid

            grid-cols-1
            lg:grid-cols-2

            gap-4
            md:gap-5

            mb-10
            md:mb-14
          "
        >

          {/* FEATURES */}

          <div
            className="
              card
            "
          >

            <p
              className="
                text-muted

                uppercase

                tracking-[0.18em]

                mb-5
              "
            >

              Features

            </p>

            <div
              className="
                grid

                gap-4
              "
            >

              {project.features.map(
                (
                  feature,
                  index
                ) => (

                  <div
                    key={index}

                    className="
                      flex
                      items-start

                      gap-3
                    "
                  >

                    <div
                      className="
                        h-1.5
                        w-1.5

                        rounded-full

                        bg-blue-500

                        mt-2

                        shrink-0
                      "
                    />

                    <p
                      className="
                        text-small
                      "
                    >

                      {feature}

                    </p>

                  </div>

                )
              )}

            </div>

          </div>

          {/* TECH */}

          <div
            className="
              card
            "
          >

            <p
              className="
                text-muted

                uppercase

                tracking-[0.18em]

                mb-5
              "
            >

              Technologies

            </p>

            <div
              className="
                flex
                flex-wrap

                gap-2
              "
            >

              {project.technologies.map(
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

        </div>

        {/* EVALUATION */}

        {project.evaluation && (

          <div
            className="
              mb-10
              md:mb-14
            "
          >

            <div
              className="
                card
              "
            >

              <p
                className="
                  text-muted

                  uppercase

                  tracking-[0.18em]

                  mb-6
                "
              >

                Performance Evaluation

              </p>

              <div
                className="
                  grid

                  grid-cols-2
                  md:grid-cols-4

                  gap-3
                "
              >

                {project.evaluation.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      key={index}

                      className="
                        rounded-2xl

                        border
                        border-border

                        bg-surface

                        p-4
                      "
                    >

                      <p
                        className="
                          text-2xl

                          font-semibold

                          mb-1
                        "
                      >

                        {item.value}

                      </p>

                      <p
                        className="
                          text-small
                        "
                      >

                        {item.label}

                      </p>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        )}

        {/* CHALLENGES + LEARNINGS */}

        {(project.challenges ||
          project.learnings) && (

          <div
            className="
              grid

              grid-cols-1
              lg:grid-cols-2

              gap-4
              md:gap-5
            "
          >

            {/* CHALLENGES */}

            {project.challenges && (

              <div
                className="
                  card
                "
              >

                <p
                  className="
                    text-muted

                    uppercase

                    tracking-[0.18em]

                    mb-5
                  "
                >

                  Challenges

                </p>

                <div
                  className="
                    flex
                    flex-col

                    gap-4
                  "
                >

                  {project.challenges.map(
                    (
                      item,
                      index
                    ) => (

                      <p
                        key={index}

                        className="
                          text-small
                        "
                      >

                        {item}

                      </p>

                    )
                  )}

                </div>

              </div>

            )}

            {/* LEARNINGS */}

            {project.learnings && (

              <div
                className="
                  card
                "
              >

                <p
                  className="
                    text-muted

                    uppercase

                    tracking-[0.18em]

                    mb-5
                  "
                >

                  Learnings

                </p>

                <div
                  className="
                    flex
                    flex-col

                    gap-4
                  "
                >

                  {project.learnings.map(
                    (
                      item,
                      index
                    ) => (

                      <p
                        key={index}

                        className="
                          text-small
                        "
                      >

                        {item}

                      </p>

                    )
                  )}

                </div>

              </div>

            )}

          </div>

        )}

      </Container>

    </main>

  );
}

export default ProjectDetails;
