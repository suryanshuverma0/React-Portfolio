import PropTypes from 'prop-types';
import { useState, useEffect } from "react";
import { FaMoon, FaBars, FaTimes } from "react-icons/fa";
import { LuSun } from "react-icons/lu";
import { navList } from "../constants/constant";

const Navbar = ({
  homeRef,
  aboutRef,
  experienceRef,
  skillsRef,
  servicesRef,
  projectsRef,
  contactRef,
}) => {
  const [active, setActive] = useState("Home");
  const [mode, setMode] = useState(() => localStorage.getItem("theme") || "dark");
  const [isOpen, setIsOpen] = useState(false);

  const handleActive = (navItem) => {
    setActive(navItem);
    setIsOpen(false);

    const refMap = {
      Home: homeRef,
      About: aboutRef,
      Experience: experienceRef,
      Skills: skillsRef,
      Services: servicesRef,
      Projects: projectsRef,
      Contact: contactRef,
    };

    refMap[navItem]?.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    localStorage.setItem("theme", mode);
  }, [mode]);

  const handleToggle = () => {
    setMode(mode === "light" ? "dark" : "light");
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-300 w-full py-4 text-sm md:text-md lg:text-sm">
      <div className="flex justify-between items-center px-4 md:px-6">

      

        {/* Mobile menu icon */}
        <button onClick={toggleMenu} className="md:hidden text-lg">
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Desktop nav list */}
        <ul className="hidden md:flex flex-wrap gap-2 md:gap-4 justify-center items-center w-full">
          {navList.map((navItem) => (
            <li
              key={navItem}
              onClick={() => handleActive(navItem)}
              className={`cursor-pointer px-2 py-1 md:px-3 md:py-2 transition-all rounded-full text-center ${
                active === navItem
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "hover:bg-gray-200 hover:dark:bg-neutral-800"
              }`}
            >
              {navItem}
            </li>
          ))}
        </ul>

        {/* Theme toggle */}
        <div className="text-xl cursor-pointer ml-auto md:ml-0 md:mt-1 lg:mt-1">
          <button onClick={handleToggle}>
            {mode === "dark" ? (
              <span className="text-gray-300">
                <LuSun />
              </span>
            ) : (
              <span className="text-black">
                <FaMoon />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu list */}
      {isOpen && (
        <ul className="flex flex-col md:hidden gap-2 justify-center items-center mt-4 w-full px-4">
          {navList.map((navItem) => (
            <li
              key={navItem}
              onClick={() => handleActive(navItem)}
              className={`cursor-pointer px-3 py-2 w-full text-center transition-all rounded-full ${
                active === navItem
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "hover:bg-gray-200 hover:dark:bg-neutral-800"
              }`}
            >
              {navItem}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

Navbar.propTypes = {
  homeRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  experienceRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  aboutRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  skillsRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  servicesRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  projectsRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  contactRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};

export default Navbar;




