import { useState, useEffect } from "react";
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
    <section id="experience" className="section">
      <Container>
        <SectionTitle
          index="03"
          eyebrow="Experience"
          title={
            <>
              Professional experience and{" "}
              <span className="text-accent">engineering work.</span>
            </>
          }
          description="Hands-on work focused on backend systems, scalable applications, and blockchain development."
        />

        <ol>
          {displayExperiences.map((item, index) => (
            <motion.li
              key={item._id || index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <ExperienceCard
                experience={item}
                last={index === displayExperiences.length - 1}
              />
            </motion.li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export default Experience;
