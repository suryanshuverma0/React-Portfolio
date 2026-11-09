import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";
import ProjectCard from "./ProjectCard";
import { projectsContent } from "../../content/projectsContent";
import { getPublicProjects } from "../../../services/public.projects.service";

const INITIAL = 6;

function Projects() {
  const [projects, setProjects] = useState([]);
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getPublicProjects()
      .then(setProjects)
      .catch((error) => console.error("Failed to load projects", error));
  }, []);

  const displayProjects = projects.length > 0 ? projects : projectsContent;

  // Categories that actually have work, most-used first.
  const categories = useMemo(() => {
    const counts = displayProjects.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] || 0) + 1 }), {});
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  }, [displayProjects]);

  const filtered = category === "All" ? displayProjects : displayProjects.filter((p) => p.category === category);
  const shown = expanded ? filtered : filtered.slice(0, INITIAL);

  // First featured project (in the admin-defined order) gets the wide card.
  const leadSlug = category === "All" ? displayProjects.find((project) => project.featured)?.slug : null;

  return (
    <section id="projects" className="section">
      <Container>
        <SectionTitle
          index="04"
          eyebrow="Selected work"
          title={
            <>
              Systems, applications, and{" "}
              <span className="text-accent">engineering projects.</span>
            </>
          }
          description="A collection of blockchain systems, AI applications, MERN platforms, and production-oriented software projects focused on scalability, architecture, and real-world problem solving."
        />

        {categories.length > 1 && (
          <LayoutGroup id="project-filter">
            <div role="tablist" aria-label="Filter projects by category" className="-mx-1 mb-8 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {["All", ...categories].map((c) => {
                const active = c === category;
                const count = c === "All" ? displayProjects.length : displayProjects.filter((p) => p.category === c).length;
                return (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setCategory(c);
                      setExpanded(false);
                    }}
                    className={`relative shrink-0 rounded-full border px-4 py-2 text-[13px] transition-colors ${active ? "border-transparent text-background" : "border-border text-secondary hover:text-primary"}`}
                  >
                    {active && <motion.span layoutId="project-filter-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    <span className="relative">
                      {c} <span className={active ? "opacity-70" : "text-muted"}>{count}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        )}

        <motion.div layout className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((project, index) => (
              <motion.div
                key={project.slug}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={project.slug === leadSlug ? "lg:col-span-2" : ""}
              >
                <ProjectCard project={project} index={index} lead={project.slug === leadSlug} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length > INITIAL && (
          <div className="mt-10 flex justify-center">
            <button type="button" onClick={() => setExpanded((x) => !x)} className="btn btn-outline">
              {expanded ? "Show fewer" : `Show all ${filtered.length} projects`}
              <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </div>
        )}
      </Container>
    </section>
  );
}

export default Projects;
