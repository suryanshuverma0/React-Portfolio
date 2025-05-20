import { useNavigate } from "react-router-dom";
const ShowMoreProjectCard = () => {
  const navigate = useNavigate();
  return (
    <>
      <div>
        <div className="flex flex-col gap-6 bg-gray-200 dark:bg-neutral-800 text-neutral-800 dark:text-gray-200 rounded-xl shadow-lg dark:shadow-glow p-4 max-w-2xl w-full items-center text-center">
          <h1 className="text-2xl">View More Projects </h1>
          <p className="text-sm">
            Take a look at more of my work, where creativity meets
            functionality. Explore projects that highlight my skills in design,
            development, and problem-solving.
          </p>
          <div>
            <button onClick={()=>{navigate("/projects")}} className="px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded-md cursor-pointer">
              View More
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShowMoreProjectCard;
