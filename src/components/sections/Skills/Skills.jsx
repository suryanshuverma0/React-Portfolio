import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";
import { trackPointer } from "../../../lib/pointer";

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
    <section id="skills" className="section">
      <Container>
        <SectionTitle
          index="05"
          eyebrow="Skills"
          title={
            <>
              Technologies and systems{" "}
              <span className="text-accent">I work with.</span>
            </>
          }
          description="Focused on backend engineering, scalable MERN applications, blockchain systems, and production-oriented software development."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {groupedSkills.map((item, index) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: (index % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              onMouseMove={trackPointer}
              className="panel panel-hover spotlight h-full p-5 sm:p-7 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-eyebrow">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-eyebrow">
                  {item.skills.length} {item.skills.length === 1 ? "tool" : "tools"}
                </span>
              </div>

              <h3 className="text-[21px] font-semibold tracking-[-0.03em] mb-5">
                {item.category}
              </h3>

              <ul className="flex flex-wrap gap-2 mt-auto">
                {item.skills.map((skill) => (
                  <li
                    key={skill._id || skill.name}
                    className={
                      skill.featured
                        ? "chip text-primary! border-border-strong! font-medium"
                        : "chip"
                    }
                  >
                    {skill.featured && (
                      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-primary" />
                    )}
                    {skill.name}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Skills;
