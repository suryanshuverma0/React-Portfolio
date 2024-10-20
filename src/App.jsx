import { useRef } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import About from "./components/About";
import Skills from "./components/Skills";
import Services from "./components/Services";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Certificate from "./components/Certificate";
import TitleComponent from "./components/TitleComponent";

function App() {
  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const skillsRef = useRef(null);
  const servicesRef = useRef(null);
  const projectsRef = useRef(null);
  const contactRef = useRef(null);
  const certificateRef = useRef(null);

  return (
    <div className="bg-gray-200 dark:bg-neutral-950 w-full min-h-screen">
      <header className="flex justify-center items-center pt-6 flex-grow sticky top-0 left-0 z-50">
        <Navbar
          homeRef={homeRef}
          aboutRef={aboutRef}
          skillsRef={skillsRef}
          servicesRef={servicesRef}
          projectsRef={projectsRef}
          contactRef={contactRef}
          certificateRef={certificateRef}
        />
      </header>
      <section className="pt-12" ref={homeRef}>
        <Home />
      </section>
      <div className="flex justify-center items-center m-8">
        <div className="h-20 w-px bg-gray-600"></div>
      </div>
      <section className="pt-2" ref={aboutRef}>
        <About />
      </section>
      <section className="pt-2" ref={skillsRef}>
        <Skills />
      </section>
      <section className="pt-2" ref={servicesRef}>
        <Services />
      </section>
      <section className="pt-2" ref={projectsRef}>
        <Projects />
      </section>
      <section className="flex justify-center items-center flex-col">
        <div>
          <TitleComponent title="Certificates" />
        </div>
        <div>
          <Certificate />
        </div>
      </section>
      <section className="pt-2" ref={contactRef}>
        <Contact />
      </section>
      <section className="pt-2">
        <Footer />
      </section>
    </div>
  );
}

export default App;
