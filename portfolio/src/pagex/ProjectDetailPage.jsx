import ProjectCard from "../components/ProjectCard";
import TitleComponent from "../components/TitleComponent";
import { projects_data } from "../constants/projects";
import SocialMedia from "../components/SocialMedia";
import Footer from "../components/Footer";
import BlogCard from "../components/BlogCard";
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

        <div className="flex justify-center items-center m-8">
          <div className="flex items-center flex-col gap-5 bg-gray-200 text-gray-800 dark:bg-neutral-900 rounded-2xl max-w-xl shadow-lg  dark:shadow-glow w-4/5 md:w-full lg:w-full">
            <div className="text-black dark:text-white text-lg">
              <p className="text-2xl pt-4 font-semibold">Connect With Me!</p>
            </div>
            <div className="py-4 pb-5 bg-gray-200 dark:bg-neutral-900 ">
              <SocialMedia />
            </div>
          </div>
        </div>

        <div className=" flex justify-center items-center max-w-4xl m-8 ">
          <div className="lg:ml-96 lg:pl-24 md:pl-16 sm:pl-0 md:ml-96 sm:ml-0">
            <BlogCard />
          </div>
        </div>
        <div>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default ProjectDetailPage;
