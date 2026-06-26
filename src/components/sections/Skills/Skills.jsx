import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";

import { skillsContent } from "../../content/skillsContent";
import { getPublicSkills } from "../../../services/public.skill.service";

function Skills() {
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const data = await getPublicSkills();

        setSkills(data);
      } catch (error) {
        console.error("Failed to load skills", error);
      }
    };

    loadSkills();
  }, []);

  const groupedSkills = useMemo(() => {
    if (skills.length === 0) return skillsContent;

    const groups = {};

    skills.forEach((skill) => {
      if (!groups[skill.category]) {
        groups[skill.category] = {
          category: skill.category,
          skills: [],
        };
      }

      groups[skill.category].skills.push(skill);
    });

    return Object.values(groups);
  }, [skills]);
  return (
    <section
      id="skills"
      className="
        section
      "
    >
      <Container>
        {/* TITLE */}

        <SectionTitle
          eyebrow="Skills"
          title="Technologies and systems I work with."
          description="Focused on backend engineering, scalable MERN applications, blockchain systems, and production-oriented software development."
        />

        {/* GRID */}

        <div
          className="
            grid

            grid-cols-1
            md:grid-cols-2

            gap-8
          "
        >
          {groupedSkills.map((item, index) => (
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
                delay: index * 0.06,
              }}
              className="
                  card

                  h-full
                "
            >
              {/* HEADER */}

              <div
                className="
                    flex
                    items-center

                    gap-2

                    mb-6
                  "
              >
                <div
                  className="
                      h-2
                      w-2

                      rounded-full

                      bg-blue-500
                    "
                />

                <h3
                  className="
                      text-title
                    "
                >
                  {item.category}
                </h3>
              </div>

              <div
                className="
    flex
    flex-wrap

    gap-3
  "
              >
                {item.skills.map((skill) => (
                  <div
                    key={skill._id}
                    className={`
        px-4
        py-2

        rounded-2xl

        border

        transition-all

        ${
          skill.featured
            ? "bg-surface text-primary border-none"
            : "bg-surface border-border"
        }
      `}
                  >
                    {skill.name}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Skills;
