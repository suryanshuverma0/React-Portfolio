
import PropTypes from "prop-types";
import { IoLogoFirebase } from "react-icons/io5";
import { RiTailwindCssFill } from "react-icons/ri";
import { FaReact } from "react-icons/fa";
import { FaPython } from "react-icons/fa";
import { FaNodeJs } from "react-icons/fa";

const ProjectCard = ({ data }) => {
  const techIcons = {
    Firebase: <IoLogoFirebase className="text-[#FFCA28] text-3xl md:text-3xl" />,
    Tailwind: <RiTailwindCssFill className="text-blue-300 text-3xl md:text-3xl" />,
    React: <FaReact className="text-blue-400 text-3xl md:text-3xl" />,
    Python: <FaPython className="text-yellow-400 text-3xl md:text-3xl" />,
    Node: <FaNodeJs className="text-green-500 text-3xl md:text-3xl" />,
  };

  // Conditional hover effect for Pneumonia project only
  const isPneumonia = data?.name.includes("Pneumonia");

  return (
    <>
      <div
        className={`flex flex-col gap-4 bg-gray-200 dark:bg-neutral-800 text-neutral-800 dark:text-gray-200 rounded-xl shadow-lg dark:shadow-glow p-4 max-h-[1000px] h-full w-full md:w-full lg:w-9/10
        ${
          isPneumonia
            ? "hover:shadow-2xl hover:border-2 hover:border-blue-400 transition-colors duration-300 cursor-pointer"
            : ""
        }`}
      >
        <div className="flex flex-col justify-center items-center">
          <img
            src={data?.project_image}
            className="w-auto h-48 md:h-56 lg:h-72"
            alt="project preview"
          />
        </div>
        <div className="flex flex-col justify-center items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold">{data?.name}</h1>
          <p className="text-md md:text-lg text-center">{data?.description}</p>
          <div className="flex gap-4">
            {data?.technology_used.map((tech) => (
              <p key={tech}>{techIcons[tech]}</p>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            className="px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded:md cursor-pointer"
            onClick={() => window.open(data?.github_link, "_blank")}
          >
            View in GitHub
          </button>
          {data?.is_deployed && (
            <button
              className="px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded:md cursor-pointer"
              onClick={() => window.open(data?.deployment_url, "_blank")}
            >
              Live Demo
            </button>
          )}
        </div>
      </div>
    </>
  );
};

ProjectCard.propTypes = {
  data: PropTypes.object.isRequired,
};

export default ProjectCard;
