import { useState, useEffect } from "react";

import Navbar from "../components/layout/Navbar";

import Hero from "../components/home/Hero";

import TechMarquee from "../components/home/TechMarquee";

import SmoothScroll from "../components/motion/SmoothScroll";

import Cursor from "../components/motion/Cursor";

import FAQ from "../components/sections/FAQ/FAQ";

import About from "../components/sections/About";

import Experience from "../components/sections/Experience/Experience";

import Skills from "../components/sections/Skills/Skills";

import Services from "../components/sections/Services/Services";

import Projects from "../components/sections/Projects/Projects";

import Research from "../components/sections/Research/Research";

import Certificates from "../components/sections/Certificates/Certificates";

import CodingActivity from "../components/sections/CodingActivity/CodingActivity";

import Contact from "../components/sections/Contact/Contact";

import Footer from "../components/layout/Footer";

import SEO from "../components/common/SEO";

import { getPublicSettings } from "../services/public.settings.service";

import { useAppearance } from "../lib/appearance";

import { SectionIndexContext } from "../components/ui/sectionIndex";

// Homepage sections by id. Order and visibility come from
// admin → Appearance (see SECTION_DEFS in lib/appearance.js).
const SECTIONS = {
  marquee: TechMarquee,
  research: Research,
  about: About,
  experience: Experience,
  projects: Projects,
  skills: Skills,
  services: Services,
  certificates: Certificates,
  "coding-activity": CodingActivity,
  faq: FAQ,
  contact: Contact,
};

// Sections without a numbered heading.
const UNNUMBERED = new Set(["marquee"]);

// Kept in step with the static <head> in index.html.
const DEFAULT_TITLE =
  "Suryanshu Verma — Blockchain Engineer, Researcher & Full-Stack Developer";
const DEFAULT_DESCRIPTION =
  "Suryanshu Verma is a computer engineer from Nepal building verifiable blockchain systems and production-grade backends. His pharmaceutical supply-chain blockchain paper was accepted for oral presentation at ICTDsC 2026.";
const DEFAULT_KEYWORDS =
  "Suryanshu Verma, blockchain developer Nepal, MERN developer Nepal, web3 developer, backend engineer, computer engineer Nepal, portfolio, smart contract developer";

function HomePage() {
  const [settings, setSettings] = useState(null);

  const { sections, effects } = useAppearance();

  // Visible sections in order, each with its heading number (01, 02…).
  const visibleSections = sections
    .filter((section) => section.visible && SECTIONS[section.id])
    .reduce((list, { id }) => {
      const numbered = list.filter((item) => item.index).length;
      return [...list, { id, index: UNNUMBERED.has(id) ? null : numbered + 1 }];
    }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getPublicSettings();

        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };

    loadSettings();
  }, []);

  const seo = (
    <SEO
      title={settings?.siteTitle || DEFAULT_TITLE}
      description={settings?.siteDescription || DEFAULT_DESCRIPTION}
      keywords={
        settings?.siteKeywords?.length
          ? settings.siteKeywords.join(", ")
          : DEFAULT_KEYWORDS
      }
      image={settings?.ogImage || "/og-image.png"}
      type="profile"
    />
  );

  return (
    <>
      {seo}

      {effects.smoothScroll && <SmoothScroll />}

      {effects.cursor && <Cursor />}

      {effects.grain && <div aria-hidden="true" className="grain" />}

      <Navbar />

      <main>
        <Hero />

        {visibleSections.map(({ id, index }) => {
          const Section = SECTIONS[id];

          return (
            <SectionIndexContext.Provider key={id} value={index}>
              <Section />
            </SectionIndexContext.Provider>
          );
        })}
      </main>

      <Footer />
    </>
  );
}

export default HomePage;
