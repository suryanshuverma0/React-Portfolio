// import PropTypes from "prop-types";

// const EducationCard = ({ title, description, status }) => {
//   return (
//     <div className="bg-gray-200 dark:bg-neutral-900 rounded-lg flex flex-col gap-3 items-center shadow-xl dark:shadow:lg dark:shadow-glow  px-4 py-2 hover:scale-105 delay-100 transition-transform duration-500 max-h-44 h-full">
//       <h1 className="text-2xl pt-2 font-semibold">{title}</h1>
//       <p className="text-md flex-1 flex items-center justify-center">{description}</p>
//       <span className="text-gray-400 flex-1 flex items-center justify-center">{status}</span>
//     </div>
//   );
// };

// EducationCard.propTypes = {
//   title: PropTypes.string.isRequired,
//   description: PropTypes.string.isRequired,
//   status: PropTypes.string.isRequired,
// };

// export default EducationCard;


import PropTypes from "prop-types";

const EducationCard = ({ title, description, status }) => {
  return (
    <div className="bg-gray-200 dark:bg-neutral-900 rounded-lg flex flex-col gap-3 items-center shadow-xl dark:shadow-glow px-4 py-4 hover:scale-105 delay-100 transition-transform duration-500 max-full mx-auto">
      <h1 className="text-lg md:text-2xl font-semibold text-center">{title}</h1>
      <p className="text-sm md:text-md flex-1 flex items-center justify-center text-center">{description}</p>
      <span className="text-gray-400 text-xs md:text-sm flex-1 flex items-center justify-center text-center">{status}</span>
    </div>
  );
};

EducationCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
};

export default EducationCard;

