import { useState, useEffect } from "react";

import Navbar from "../components/layout/Navbar";

import Hero from "../components/home/Hero";

import About from "../components/sections/About";

import Experience from "../components/sections/Experience/Experience";

import Skills from "../components/sections/Skills/Skills";

import Services from "../components/sections/Services/Services";

import Projects from "../components/sections/Projects/Projects";

import Certificates from "../components/sections/Certificates/Certificates";

import CodingActivity from "../components/sections/CodingActivity/CodingActivity";

import Contact from "../components/sections/Contact/Contact";

import Footer from "../components/layout/Footer";

import SEO from "../components/common/SEO";

import { getPublicSettings } from "../services/public.settings.service";
import { trackPageView } from "../services/public.analytics.service";

const DEFAULT_TITLE =
  "Suryanshu Verma | Blockchain Developer & MERN Engineer";
const DEFAULT_DESCRIPTION =
  "Suryanshu Verma is a Computer Engineering student focused on blockchain systems, scalable MERN applications, backend engineering, and production-oriented software development.";
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

  useEffect(() => {
    trackPageView("/");
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
    />
  );

  return (
    <>
      {seo}

      <Navbar />

      <main>
        <Hero />

        <About />

        <Experience />

        <Skills />

        <Services />

        <Projects />

        <Certificates />

        <CodingActivity />

        <Contact />

        <Footer />
      </main>
    </>
  );
}

export default HomePage;
