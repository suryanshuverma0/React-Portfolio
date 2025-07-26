import { useRef, useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import About from "./components/About";
import Experience from "./components/Experience";
import Skills from "./components/Skills";
import Services from "./components/Services";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Certificate from "./components/Certificate";
import Loading from "./components/Loading";
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);


  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const experienceRef = useRef(null);
  const skillsRef = useRef(null);
  const servicesRef = useRef(null);
  const projectsRef = useRef(null);
  const contactRef = useRef(null);
  const certificateRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="bg-gray-200 dark:bg-neutral-950 w-full min-h-screen">
      <header className="flex justify-center items-center pt-0 flex-grow sticky top-0 left-0 z-50">
        <Navbar
          homeRef={homeRef}
          aboutRef={aboutRef}
          skillsRef={skillsRef}
          servicesRef={servicesRef}
          projectsRef={projectsRef}
          contactRef={contactRef}
          certificateRef={certificateRef}
          experienceRef={experienceRef}
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
      <section className="pt-2" ref={experienceRef}>
        <Experience />
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
      <section ref={certificateRef} className="pt-2">
          <Certificate />
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
