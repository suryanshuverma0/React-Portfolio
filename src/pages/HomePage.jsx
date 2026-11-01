import { useState, useEffect } from "react";

import Navbar from "../components/layout/Navbar";

import Hero from "../components/home/Hero";

import TechMarquee from "../components/home/TechMarquee";

import ScrollScene from "../components/scene/ScrollScene";

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

// Kept in step with the static <head> in index.html.
const DEFAULT_TITLE =
  "Suryanshu Verma — Blockchain Engineer, Researcher & Full-Stack Developer";
const DEFAULT_DESCRIPTION =
  "Suryanshu Verma is a computer engineer from Nepal building verifiable blockchain systems and production-grade backends. His pharmaceutical supply-chain blockchain paper was accepted for oral presentation at ICTDsC 2026.";
const DEFAULT_KEYWORDS =
  "Suryanshu Verma, blockchain developer Nepal, MERN developer Nepal, web3 developer, backend engineer, computer engineer Nepal, portfolio, smart contract developer";

function HomePage() {
  const [settings, setSettings] = useState(null);

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

      <SmoothScroll />

      <ScrollScene />

      <Cursor />

      <div aria-hidden="true" className="grain" />

      <Navbar />

      <main>
        <Hero />

        <TechMarquee />

        {/* Research leads — it's the strongest proof of depth */}
        <Research />

        <About />

        <Experience />

        <Projects />

        <Skills />

        <Services />

        <Certificates />

        <CodingActivity />

        <FAQ />

        <Contact />
      </main>

      <Footer />
    </>
  );
}

export default HomePage;
