import TitleComponent from "./TitleComponent";
import SkillContainer from "./SkillContainer";
const Skills = () => {
  return (
    <>
      <div className="flex justify-center items-center flex-col gap-4">
        <TitleComponent title="Skills" />
        <div className="flex justify-center items-center py-8 px-10 mx-6  lg:w-[900px] bg-gray-200 dark:bg-neutral-900 shadow-lg rounded-lg  dark:shadow-glow">
          <SkillContainer />
        </div>
       
      </div>
    </>
  );
};

export default Skills;
