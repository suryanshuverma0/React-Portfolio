import PropTypes from 'prop-types';
const ExperienceCard = ({ data }) => {
  return (
    <div className="flex flex-col gap-4 bg-gray-200 dark:bg-neutral-800 text-neutral-800 dark:text-gray-200 rounded-xl shadow-lg dark:shadow-glow p-6 w-full h-full">
      {/* Company Logo */}
      <div className="flex justify-center">
        <img
          src={data.logo}
          alt={`${data.company} logo`}
          className="h-20 w-auto object-contain"
        />
      </div>

      {/* Text Content */}
      <div className="flex flex-col gap-2 items-center text-center">
        <h1 className="text-xl md:text-2xl font-bold">{data.role}</h1>
        <p className="text-md font-semibold">{data.company}</p>
        <p className="text-md">{data.description}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {data.duration} · {data.location}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-center items-center gap-4 mt-4 flex-wrap">
        {data.company_url && (
          <button
            onClick={() => window.open(data.company_url, "_blank")}
            className="px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded-md cursor-pointer"
          >
            Company Site
          </button>
        )}
        {data.certificate_url ? (
          <button
            onClick={() => window.open(data.certificate_url, "_blank")}
            className="px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded-md cursor-pointer"
          >
            View Certificate
          </button>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Certificate available on request
          </p>
        )}
      </div>
    </div>
  );
};

export default ExperienceCard;


ExperienceCard.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.number.isRequired,
    role: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    logo: PropTypes.string.isRequired,
    company_url: PropTypes.string,
    certificate_url: PropTypes.string,
  })
}