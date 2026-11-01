import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Container from "../../ui/Container";
import SectionTitle from "../../ui/SectionTitle";
import { servicesContent } from "../../content/servicesContent";
import { getPublicServices } from "../../../services/public.service.service";

function Services() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await getPublicServices();

        setServices(data);
      } catch (error) {
        console.error("Failed to load services", error);
      }
    };

    loadServices();
  }, []);

  const displayServices = services.length > 0 ? services : servicesContent;

  return (
    <section id="services" className="section">
      <Container>
        <SectionTitle
          index="06"
          eyebrow="Services"
          title={
            <>
              What I can help <span className="text-accent">build.</span>
            </>
          }
          description="Focused on scalable backend systems, modern web applications, blockchain integrations, and production-oriented software solutions."
        />

        {/* Editorial index — one row per service */}

        <ol className="border-t border-border">
          {displayServices.map((item, index) => (
            <motion.li
              key={item._id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="
                group

                relative
                isolate

                grid
                grid-cols-1
                md:grid-cols-[72px_1fr_1.15fr]

                gap-x-8
                gap-y-4

                border-b
                border-border

                py-8
                md:py-10

                transition-colors
                duration-300
              "
            >
              {/* Hover wash */}
              <span
                aria-hidden="true"
                className="
                  pointer-events-none

                  absolute
                  inset-y-0
                  -inset-x-4
                  md:-inset-x-6

                  -z-10

                  rounded-3xl

                  bg-surface

                  opacity-0

                  transition-opacity
                  duration-300

                  group-hover:opacity-100
                "
              />

              <span className="font-mono text-[13px] text-muted tabular-nums md:pt-1.5">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                {item.category && <p className="text-eyebrow mb-3">{item.category}</p>}

                <h3 className="text-[22px] md:text-[28px] font-semibold leading-[1.1] tracking-[-0.035em] text-balance">
                  {item.title}
                </h3>
              </div>

              <div>
                <p className="text-body text-pretty">{item.description}</p>

                {item.technologies?.length > 0 && (
                  <p className="mt-4 font-mono text-[12.5px] text-muted">
                    {item.technologies.join("  ·  ")}
                  </p>
                )}
              </div>

            </motion.li>
          ))}
        </ol>

      </Container>
    </section>
  );
}

export default Services;
