// import main from "../assets/main.png"
import fav from "../assets/fav.jpg";
import { FaLinkedin } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import Typewriter from 'typewriter-effect';
// import merofav from "../assets/merofav.png"
const Home = () => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "../../public/cv.pdf";
    link.download = "Suryanshu_Verma_CV.pdf";
    link.click();
  };

  return (
    <>
      <div className="flex flex-col items-center gap-6 text-black dark:text-white ">
        <div className="overflow-hidden rounded-full hover:scale-105 transition-transform duration-700">
          {/* <img className="" src={main} alt="image"/> */}
          <img
            className="
            rounded-full w-56 h-56 object-cover  shadow-md"
            src={fav}
            alt="image"
          />
        </div>
        <div className="flex justify-center flex-col items-center gap-2">
          <h4 className="text-xl font-boldbold">Hello, I&apos;m</h4>
          <h1 className="text-4xl font-boldbold">Suryanshu Verma</h1>
          <h3 className="text-2xl font-semibold text-red-500">
            <Typewriter
              options={{
                strings: ["a Software Developer", "a MERN Stack Developer"],
                autoStart: true,
                loop: true,
                delay: 75,
              }}
            />
          </h3>
        </div>

        <div className="flex gap-6 justify-center items-center text-xl transition-transform">
          <a
            href="https://www.linkedin.com/in/suryanshu-verma0/"
            target="_blank"
            className="cursor-pointer hover:scale-125"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://github.com/suryanshuverma0"
            target="_blank"
            className="cursor-pointer hover:scale-125"
          >
            <FaGithub />
          </a>
          <a
            href="https://x.com/SuryanshuVerma5"
            target="_blank"
            className="cursor-pointer hover:scale-125"
          >
            <FaSquareXTwitter />
          </a>
        </div>

        <div className="p-2">
          <button
            onClick={handleDownload}
            className={`px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded:md cursor-pointer`}
          >
            Download Resume
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;
