import Navbar from "../components/layout/Navbar";

import Hero from "../components/home/Hero";

import About from "../components/sections/About";

import Experience from "../components/sections/Experience/Experience";

import Skills from "../components/sections/Skills/Skills";

import Services from "../components/sections/Services/Services";

import Projects from "../components/sections/Projects/Projects";

import Certificates from "../components/sections/Certificates/Certificates";

import Contact from "../components/sections/Contact/Contact";

import Footer from "../components/layout/Footer";

import SEO from "../components/common/SEO";

function HomePage() {
  return (
    <>
      <SEO
        title="
    Suryanshu Verma |
    Blockchain Developer
    & MERN Engineer
  "
        description="
    Suryanshu Verma is a
    Computer Engineering
    student focused on
    blockchain systems,
    scalable MERN applications,
    backend engineering,
    and production-oriented
    software development.
  "
        keywords="
    Suryanshu Verma,
    blockchain developer Nepal,
    MERN developer Nepal,
    web3 developer,
    backend engineer,
    computer engineer Nepal,
    portfolio,
    smart contract developer
  "
        image="/og-image.png"
      />

      <Navbar />

      <main>
        <Hero />

        <About />

        <Experience />

        <Skills />

        <Services />

        <Projects />

        <Certificates />

        <Contact />

        <Footer />
      </main>
    </>
  );
}

export default HomePage;
