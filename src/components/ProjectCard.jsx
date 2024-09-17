import PropTypes from "prop-types";
const ProjectCard = ({ data }) => {
  return (
    <>
      <div className="flex flex-col gap-4 bg-gray-200 justify-center items-center dark:bg-neutral-800 text-black dark:text-white rounded-xl shadow-lg dark:shadow-glow p-4">
        <div className="">
          <img
            src={data?.project_image}
            className="w-auto h-48 md:h-56 "
            alt="pixel studio"
          />
        </div>
        <div className="flex flex-col justify-center items-center gap-2">
          <h1 className=" text-xl md:text-2xl font-bold">{data?.name}</h1>
          <p className="text-md md:text-lg">{data?.description}</p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            className={`px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded:md cursor-pointer`}
          >
            View in GitHub
          </button>
          {data?.is_deployed && (
            <button
              className={`px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded:md cursor-pointer`}
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
