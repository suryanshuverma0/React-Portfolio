
import PropTypes from 'prop-types';

const ExperienceCard = ({ data }) => {
  const openInNewTab = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col justify-between gap-3 bg-gray-200 dark:bg-neutral-800 text-neutral-800 dark:text-gray-200 rounded-xl shadow-lg dark:shadow-glow p-4 max-w-md h-full transform transition-transform hover:scale-[1.015] mx-auto">
      {/* Company Logo */}
      <div className="flex justify-center">
        <img
          src={data.logo}
          alt={`${data.company} logo`}
          className="h-8 w-auto object-contain"
        />
      </div>

      {/* Text Content */}
      <div className="flex flex-col gap-1 items-center text-center">
        <h1 className="text-base md:text-lg font-bold">{data.role}</h1>
        <p className="text-sm font-semibold">{data.company}</p>
        <p className="text-sm">{data.description}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {data.duration} · {data.location}
        </p>
      </div>

      {/* Divider */}
      <hr className="border-t border-gray-400 dark:border-gray-600 my-1 w-full" />

      {/* Buttons */}
      <div className="flex justify-center items-center gap-2 mt-2 flex-wrap">
        {data.company_url && (
          <button
            onClick={() => openInNewTab(data.company_url)}
            className="px-3 py-1.5 text-sm bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded-md cursor-pointer"
          >
            Company Site <span className="ml-1">↗</span>
          </button>
        )}
        {data.certificate_url ? (
          <button
            onClick={() => openInNewTab(data.certificate_url)}
            className="px-3 py-1.5 text-sm bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded-md cursor-pointer"
          >
            View Certificate <span className="ml-1">📄</span>
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
  }).isRequired,
};

export default ExperienceCard;
