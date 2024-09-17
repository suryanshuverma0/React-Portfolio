
import TitleContainer from "./TitleComponent";
import ProjectCard from "./ProjectCard";
import { projects_data } from "../constants/projects";

const Projects = () => {
  return (
    <>
      <div className="flex flex-col justify-center items-center px-8">
        <div>
          <TitleContainer title="Projects" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-9/10 md:w-4/5 p-5">
          {projects_data &&
            projects_data.map((data) => (
              <div key={data.id}>
                <ProjectCard data={data} />
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default Projects;
