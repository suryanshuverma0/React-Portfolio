import SkillCard from "./SkillCard";
import { FaHtml5 } from "react-icons/fa";
import { FaCss3 } from "react-icons/fa";
import { BiLogoJavascript } from "react-icons/bi";
import { FaReact } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import { RiTailwindCssFill } from "react-icons/ri";
import { FaBootstrap } from "react-icons/fa";
import { FaFigma } from "react-icons/fa";
import { SiTypescript } from "react-icons/si";
import { IoLogoFirebase } from "react-icons/io5";
import { FaSass } from "react-icons/fa";
import { TbBrandCpp } from "react-icons/tb";

const SkillContainer = () => {
  return (
    <>
      <div className="">
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 place-items-center gap-8">
          <SkillCard
            icon={<FaHtml5 className="text-red-500 text-xl md:text-3xl" />}
            title="HTML"
          />
          <SkillCard
            icon={<FaCss3 className="text-blue-500 text-xl md:text-3xl" />}
            title="CSS"
          />
          <SkillCard
            icon={
              <BiLogoJavascript className="text-yellow-500 text-3xl md:text-3xl" />
            }
            title="JavaScript"
          />
          <SkillCard
            icon={<FaReact className="text-blue-400 text-3xl md:text-3xl" />}
            title="React"
          />
          <SkillCard
            icon={
              <FaGithub className="text-black dark:text-white text-3xl md:text-3xl" />
            }
            title="GitHub"
          />
          <SkillCard
            icon={
              <RiTailwindCssFill className="text-blue-300 text-3xl md:text-3xl" />
            }
            title="Tailwind"
          />
          <SkillCard
            icon={
              <FaBootstrap className="text-[#7952B3] text-3xl md:text-3xl" />
            }
            title="Bootstrap"
          />
        
          <SkillCard
            icon={<FaFigma className="text-[#F24E1E] text-3xl md:text-3xl" />}
            title="Figma"
          />
          <SkillCard
            icon={
              <SiTypescript className="text-[#007ACC] text-3xl md:text-3xl" />
            }
            title="TypeScript"
          />
          <SkillCard
            icon={
              <IoLogoFirebase className="text-[#FFCA28] text-3xl md:text-3xl" />
            }
            title="Firebase"
          />
          <SkillCard
            icon={<FaSass className="text-pink-500 text-3xl md:text-3xl" />}
            title="SASS"
          />
          <SkillCard
            icon={<TbBrandCpp className="text-blue-500 text-5xl md:text-3xl" />}
            title="C++"
          />
        </div>
      </div>
    </>
  );
};

export default SkillContainer;
