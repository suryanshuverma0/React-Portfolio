import TitleComponent from "./TitleComponent";
import SkillContainer from "./SkillContainer";

const Skills = () => {
  return (
    <>
     <div className="flex justify-center items-center flex-col px-12">
      <TitleComponent title="Skills" />
      <div className="flex justify-center items-center w-full lg:w-3/4 bg-gray-200 dark:bg-neutral-900 shadow-md rounded-lg m-4 py-4 dark:shadow-glow">
      <SkillContainer/>
      </div>
      </div> 
    </>
  )
}

export default Skills
