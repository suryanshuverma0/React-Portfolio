// src/components/Experience.jsx
import TitleContainer from "./TitleComponent";
import ExperienceCard from "./ExperienceCard";
import { experience_data } from "../constants/experience_data";

const Experience = () => {
  return (
    <div className="flex flex-col justify-center items-center px-4">
      <div className="mb-6">
        <TitleContainer title="Professional Experiences" />
      </div>

      {/* Centered grid */}
      <div className="w-full flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-10 w-full max-w-6xl p-5">
          {experience_data.map((item) => (
            <ExperienceCard key={item.id} data={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Experience;
