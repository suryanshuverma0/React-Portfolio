import TitleContainer from "./TitleComponent";
import ContactForm from "./ContactForm";
import { FaEnvelope } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";

const Contact = () => {
  return (
    <>
      <div className="flex justify-center items-center flex-col gap-2">
        <div>
          <TitleContainer title="Contact" />
        </div>
        <div className="w-full md:w-1/2 p-8">
          <ContactForm />
        </div>

        <div className="flex items-center flex-col gap-3 bg-white text-black dark:bg-neutral-900 rounded-2xl w-[80%] m-4">
          <div className="text-black dark:text-white text-lg">
            <p>Let&apos;s Collaborate!</p>
          </div>
          <div className="flex gap-6 justify-center items-center px-4 pb-8">
            <button
            onClick={() => window.open("mailto:veenasa676@gmail.com", "_blank")}
              className={`px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded:md cursor-pointer`}
            >
              <FaEnvelope className="inline-block" /> veenasa676@gmail.com
            </button>
            <button onClick={() => window.open("https://www.linkedin.com/in/suryanshu-verma0/")}
              className={`px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white rounded:md cursor-pointer`}
            >
              <FaLinkedin className="inline-block text-blue-400" /> LinkedIn
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
