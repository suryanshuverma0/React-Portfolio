import { useState, useEffect } from "react";
import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";
import ProjectCard from "./ProjectCard";
import { projectsContent } from "../../content/projectsContent";
import { getPublicProjects } from "../../../services/public.projects.service";

function Projects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await getPublicProjects();
        setProjects(data);
      } catch (error) {
        console.error("Failed to load projects", error);
      }
    };
    loadProjects();
  }, []);

  const displayProjects = projects.length > 0 ? projects : projectsContent;

  return (
    <section id="projects" className="section">
      <Container>
        <SectionTitle
          eyebrow="Projects"
          title="Selected systems, applications, and engineering projects."
          description="A collection of blockchain systems, AI applications, MERN platforms, and production-oriented software projects focused on scalability, architecture, and real-world problem solving."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {displayProjects.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Projects;
