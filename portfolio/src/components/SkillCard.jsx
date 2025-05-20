import PropTpyes from "prop-types";
const SkillCard = ({ icon, title }) => {
  return (
    <>
      <div className=" flex justify-center items-center flex-col dark:text-white rounded-full w-16 h-16 bg-gray-100 dark:bg-neutral-800 shadow-lg hover:transition-all hover:scale-105 cursor-pointer transform transition-transform duration-500">
        <span className="text-[10px]  ">{icon}</span>
        <span className="text-[10px]">{title}</span>
      </div> 
    </>
  );
};
SkillCard.propTypes = {
  icon: PropTpyes.element.isRequired,
  title: PropTpyes.string.isRequired,
};
export default SkillCard;
