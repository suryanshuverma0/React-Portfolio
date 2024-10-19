import ServicesCard from "./ServicesCard";
import TitleContainer from "./TitleComponent";
import { CgWebsite } from "react-icons/cg";
import { SiNodedotjs, SiExpress, SiMongodb } from "react-icons/si";
import { FaReact } from "react-icons/fa";
const servicesData = [
  {
    icon: (
      <div className="flex items-center">
        <SiNodedotjs className="text-green-500 text-3xl" />
        <SiMongodb className="text-green-600 text-3xl ml-2" />
        <SiExpress className="text-gray-600 text-3xl ml-2" />
        <FaReact className="text-blue-400 text-3xl ml-2" />
      </div>
    ),
    title: "MERN Stack Development",
    description:
      "Creating full-stack applications using MongoDB, Express, React, and Node.js, I deliver end-to-end solutions that are both powerful and user-friendly.",
  },
  {
    icon: <CgWebsite className="text-red-500 text-3xl" />,
    title: "Full-Stack Development",
    description:
      "Delivering comprehensive web solutions that encompass both frontend and backend development, ensuring a seamless user experience and efficient data management.",
  },
];

const Services = () => {
  return (
    <>
      <div className="text-center">
        <TitleContainer title="Services" />
      </div>
      <div className="flex justify-center items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-27 w-[80%] md:w-1/2 lg:w-[80%] items-center place-items-center p-6">
          {servicesData.map((service, index) => (
            <ServicesCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Services;
