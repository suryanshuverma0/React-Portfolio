import TitleContainer from "./TitleComponent";
import ProjectCard from "./ProjectCard";
import { projects_data } from "../constants/projects";
import ShowMoreProjectCard from "./ShowMoreProjectCard";
const Projects = () => {
  const displayedData = projects_data.length >2 ? projects_data.slice(0,2) : projects_data;
  return (
    <>
      <div className="flex flex-col justify-center items-center px-8">
        <div>
          <TitleContainer title="Projects" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2  gap-16 w-9/10 md:w-1/2 lg:w-4/5 p-5">
          {displayedData &&
            displayedData.map((data) => (
              <div key={data.name}>
                <ProjectCard data={data} />
              </div>
            ))}
        </div>
        <div className=" my-16 flex justify-center items-center">
            <ShowMoreProjectCard />
        </div>
      </div>
    </>
  );
};

export default Projects;
