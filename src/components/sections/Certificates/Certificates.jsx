import { motion } from "framer-motion";

import { ArrowUpRight, BadgeCheck } from "lucide-react";

import { useEffect, useState } from "react";

import Container from "../../ui/Container";

import SectionTitle from "../../ui/SectionTitle";

import { certificatesContent } from "../../content/certificatesContent";

import { getPublicCertificates } from "../../../services/public.certificate.service";

import { trackPointer } from "../../../lib/pointer";

function Certificates() {
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const data = await getPublicCertificates();

        setCertificates(data);
      } catch (error) {
        console.error("Failed to load certificates", error);
      }
    };

    loadCertificates();
  }, []);

  const displayCertificates =
    certificates.length > 0 ? certificates : certificatesContent;

  return (
    <section id="certificates" className="section">
      <Container>
        <SectionTitle
          index="07"
          eyebrow="Certificates"
          title={
            <>
              Certifications and{" "}
              <span className="text-accent">learning milestones.</span>
            </>
          }
          description="Selected certifications across backend engineering, blockchain systems, and software development — each one independently verifiable."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayCertificates.map((item, index) => (
            <motion.article
              key={item._id || index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: (index % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              onMouseMove={trackPointer}
              className="panel panel-hover spotlight group p-3 flex flex-col"
            >
              <div className="overflow-hidden rounded-[20px] border border-border bg-surface">
                <img
                  src={item.image?.url || item.image}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="
                    w-full

                    aspect-[16/11]

                    object-cover

                    transition-transform
                    duration-700

                    group-hover:scale-[1.03]
                  "
                />
              </div>

              <div className="flex-1 flex flex-col p-3 pt-5">
                <p className="text-eyebrow mb-3">
                  {item.issuer}
                  {item.year && ` · ${item.year}`}
                </p>

                <h3 className="text-[17px] font-semibold tracking-[-0.02em] leading-snug text-balance mb-6">
                  {item.title}
                </h3>

                {item.verifyUrl && (
                  <a
                    href={item.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Verify ${item.title} (opens in a new tab)`}
                    className="
                      mt-auto

                      inline-flex
                      items-center
                      justify-between

                      gap-2

                      pt-4

                      border-t
                      border-border

                      text-[13px]
                      font-medium

                      text-secondary

                      transition-colors

                      hover:text-primary
                    "
                  >
                    <span className="inline-flex items-center gap-2">
                      <BadgeCheck size={15} aria-hidden="true" />
                      Verify credential
                    </span>

                    <ArrowUpRight
                      size={15}
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Certificates;
