import TitleContainer from "./TitleComponent";
import ContactForm from "./ContactForm";
import SocialMedia from "./SocialMedia";

const Contact = () => {
  return (
    <>
      <div className="flex justify-center items-center flex-col gap-4 mb-8">
        <div>
          <TitleContainer title="Contact" />
        </div>
        <div className="w-full md:w-1/2 p-8">
          <ContactForm />
        </div>

        <div className="flex items-center flex-col gap-5 bg-gray-200 text-gray-800 dark:bg-neutral-900 rounded-2xl max-w-xl shadow-lg  dark:shadow-glow w-4/5 md:w-full lg:w-full">
          <div className="text-black dark:text-white text-lg">
            <p className="text-2xl pt-4 font-semibold">Connect With Me!</p>
          </div>
          <div className="py-4 pb-5 bg-gray-200 dark:bg-neutral-900 ">
          <SocialMedia />
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
