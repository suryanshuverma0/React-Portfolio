import ProjectCard from '../components/ProjectCard'
import TitleComponent from '../components/TitleComponent'
import { projects_data } from '../constants/projects'
const ProjectDetailPage = () => {
  return (
    <>
    <div className="bg-slate-200 dark:bg-neutral-900 w-full h-full text-gray-800 dark:text-gray-200">
      <div className="flex flex-col justify-center items-center px-8">
        <div>
          <TitleComponent title="Project Detail" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-24 w-full md:w-1/2 lg:w-[60%] p-5">
          {projects_data &&
            projects_data.map((data) => (
              <div key={data.name}>
                <ProjectCard data={data} />
              </div>
            ))}
        </div>
      </div>
    </div>
    </>
  )
}

export default ProjectDetailPage
