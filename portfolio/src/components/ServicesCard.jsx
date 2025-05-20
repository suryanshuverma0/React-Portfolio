import PropTypes from "prop-types";

const ServicesCard = ({ title, description, icon }) => {
  return (
    <div className="flex flex-col justify-center items-center gap-2 shadow-xl dark:shadow-glow text-black dark:text-white bg-gray-200 dark:bg-neutral-900 w-full max-w-xs md:max-w-sm lg:max-w-md p-4 rounded-lg max-h-60 h-full">
      <span className="pt-2">{icon}</span>
      <h1 className="text-xl md:text-2xl font-bold text-center">{title}</h1>
      <p className="pb-2 text-center text-sm md:text-base lg:text-lg p-2">{description}</p>
    </div>
  );
};

ServicesCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  icon: PropTypes.element.isRequired,
};

export default ServicesCard;
