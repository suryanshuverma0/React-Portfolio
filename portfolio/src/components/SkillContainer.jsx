import SkillCard from "./SkillCard";
import {
  FaHtml5,
  FaCss3,
  FaReact,
  FaGithub,
  FaBootstrap,
  FaFigma,
  FaPython
} from "react-icons/fa";
import { BiLogoJavascript } from "react-icons/bi";
import { RiTailwindCssFill } from "react-icons/ri";
import { SiTypescript } from "react-icons/si";
import { IoLogoFirebase } from "react-icons/io5";
import { TbBrandCpp } from "react-icons/tb";
import { SiNodedotjs, SiExpress, SiMongodb, SiPostman } from "react-icons/si";


const skills = [
  {
    icon: <FaHtml5 className="text-red-500 text-xl md:text-3xl" />,
    title: "HTML",
  },
  {
    icon: <FaCss3 className="text-blue-500 text-xl md:text-3xl" />,
    title: "CSS",
  },
  {
    icon: <BiLogoJavascript className="text-yellow-500 text-3xl md:text-3xl" />,
    title: "JS",
  },
  {
    icon: <FaReact className="text-blue-400 text-3xl md:text-3xl" />,
    title: "React",
  },
  {
    icon: (
      <FaGithub className="text-black dark:text-white text-3xl md:text-3xl" />
    ),
    title: "GitHub",
  },
  {
    icon: <RiTailwindCssFill className="text-blue-300 text-3xl md:text-3xl" />,
    title: "Tailwind",
  },
  {
    icon: <FaBootstrap className="text-[#7952B3] text-3xl md:text-3xl" />,
    title: "Bootstrap",
  },
  {
    icon: <FaFigma className="text-[#F24E1E] text-3xl md:text-3xl" />,
    title: "Figma",
  },
  {
    icon: <SiTypescript className="text-[#007ACC] text-3xl md:text-3xl" />,
    title: "TS",
  },
  {
    icon: <IoLogoFirebase className="text-[#FFCA28] text-3xl md:text-3xl" />,
    title: "Firebase",
  },
  {
    icon: <TbBrandCpp className="text-blue-500 text-5xl md:text-3xl" />,
    title: "C++",
  },
  {
    icon: <SiNodedotjs className="text-green-500 text-3xl md:text-3xl" />,
    title: "Node.js",
  },
  {
    icon: <SiExpress className="text-gray-500 text-3xl md:text-3xl" />
    ,
    title: "Express",
  },
  {
    icon: <SiMongodb className="text-green-700 text-3xl md:text-3xl" />,
    title: "MongoDB",
  },
  {
    icon: <SiPostman className="text-orange-500 text-3xl md:text-3xl" />,
    title: "Postman",
  },
  {
    icon: <FaPython className="text-yellow-400 text-3xl md:text-3xl"  />,
    title: "Python",
  },
];

const SkillContainer = () => (
  <div>
    <div className="grid grid-cols-3 md:grid-cols-8 lg:grid-cols-8 place-items-center gap-8 ">
      {skills.map((skill, index) => (
        <SkillCard key={index} icon={skill.icon} title={skill.title} />
      ))}
    </div>
  </div>
);

export default SkillContainer;
