import {useState,useEffect} from "react"
import { motion } from "framer-motion";
import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";
import ExperienceCard from "../../cards/ExperienceCard";
import { experienceContent } from "../../content/experienceContent";
import { getPublicExperiences } from "../../../services/public.experience.service";

function Experience() {
  const [experiences, setExperiences] = useState([]);

  useEffect(() => {
    const loadExperiences = async () => {
      try {
        const data = await getPublicExperiences();

        setExperiences(data);
      } catch (error) {
        console.error("Failed to load experiences", error);
      }
    };

    loadExperiences();
  }, []);

  const displayExperiences =
    experiences.length > 0 ? experiences : experienceContent;
  return (
    <section
      id="experience"
      className="
        section
      "
    >
      <Container>
        <SectionTitle
          eyebrow="Experience"
          title="
            Professional experience
            and engineering work.
          "
          description="
            Hands-on work focused
            on backend systems,
            scalable applications,
            and blockchain development.
          "
        />

        {/* GRID */}

        <div
          className="
            grid

            grid-cols-1
            md:grid-cols-2

            gap-5
          "
        >
          {displayExperiences.map((item, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
              }}
            >
              <ExperienceCard experience={item} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Experience;
