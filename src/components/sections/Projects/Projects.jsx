import Container
from "../../ui/Container";

import SectionTitle
from "../../ui/SectionTitle";

import ProjectCard
from "./ProjectCard";

import {
  projectsContent,
} from "../../content/projectsContent";

function Projects() {

  return (

    <section
      id="projects"

      className="
        section
      "
    >

      <Container>

        {/* TITLE */}

        <SectionTitle

          eyebrow="Projects"

          title="Selected systems, applications, and engineering projects."

          description="A collection of blockchain systems, AI applications, MERN platforms, and production-oriented software projects focused on scalability, architecture, and real-world problem solving."
        />

        {/* GRID */}

        <div
          className="
            grid

            grid-cols-1
            lg:grid-cols-2

            gap-8
          "
        >

          {projectsContent.map(
            (
              project,
              index
            ) => (

              <ProjectCard

                key={project.slug}

                project={project}

                index={index}
              />

            )
          )}

        </div>

      </Container>

    </section>

  );
}

export default Projects;
