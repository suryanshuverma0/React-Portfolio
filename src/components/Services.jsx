import ServicesCard from "./ServicesCard";
import TitleContainer from "./TitleComponent";
import { CgWebsite } from "react-icons/cg";
import { FaReact } from "react-icons/fa";

const Services = () => {
  return (
    <>
      <div className="text-center">
        <TitleContainer title="Services" />
      </div>
      <div className="flex justify-center items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-[80%] md:w-1/2 lg:w-[80%] items-center place-items-center p-6">
          <ServicesCard
            icon={<CgWebsite className="text-red-500 text-3xl" />}
            title="Frontend Development"
            description="Crafting responsive web experiences with React, Tailwind CSS, and JavaScript, I ensure sleek designs and smooth performance across all devices."
          />

          <ServicesCard
            title="Web Application"
            description="Building scalable web apps with React and Firebase, I create robust solutions tailored to user needs.

"
            icon={<FaReact className="text-blue-500 text-3xl" />}
          />
        </div>
      </div>
    </>
  );
};

export default Services;
