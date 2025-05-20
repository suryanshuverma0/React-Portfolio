import PropTypes from "prop-types";
import c1 from "../assets/certificates/c1.png";
import c2 from "../assets/certificates/c2.png";
import c3 from "../assets/certificates/c3.png";
import c4 from "../assets/certificates/c4.png";
import c5 from "../assets/certificates/c5.png";

const certificates = [
  {
    src: c1,
    alt: "certificate 1",
    link: "https://www.coursera.org/account/accomplishments/verify/68KUHN49HHBC",
    title: "Introduction to Web Development",
  },
  {
    src: c2,
    alt: "certificate 2",
    link: "https://www.coursera.org/account/accomplishments/verify/6NLRHLXS996J",
    title: "JavaScript Basics",
  },
  {
    src: c3,
    alt: "certificate 3",
    link: "https://www.coursera.org/account/accomplishments/verify/QX3FRKGHR4E5",
    title: "Programming With JavaScript",
  },
  {
    src: c4,
    alt: "certificate 4",
    link: "https://www.coursera.org/account/accomplishments/certificate/2LTMW9BERWZG",
    title: "C++ for Programmers",
  },
  {
    src: c5,
    alt: "certificate 5",
    link: "https://www.freecodecamp.org/certification/suryanshuverma/responsive-web-design",
    title: "Responsive Web Design",
  },
];

const Certificate = () => {
  return (
    <div className="flex justify-center items-center max-w-xs md:max-w-4xl lg:max-w-4xl w-full shadow-lg dark:shadow-glow">
      <div className="mt-8 mx-8 w-full overflow-x-auto px-8 py-6 bg-gray-100 dark:bg-neutral-900 ">
        <div className="flex space-x-6">
          {certificates.map((certificate, index) => (
            <div
              key={index}
              className="min-w-[100px] md:min-w-[250px] lg:min-w-[250px] flex flex-shrink-0 group shadow-lg rounded-lgtransition-transform transform hover:scale-105 hover:shadow-2xl"
            >
              <img
                src={certificate.src}
                alt={certificate.alt}
                className="amx-w-full h-64 object-contain rounded-lg"
              />
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold py-1 px-2 rounded-full">
                New
              </div>
              <div className="absolute inset-0 bg-neutral-800 bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-center">
                  <h3 className="text-gray-100 text-lg font-semibold mb-2">
                    {certificate.title}
                  </h3>
                  <a
                    href={certificate.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-white text-black py-2 px-4 rounded-lg font-semibold transition duration-300 hover:bg-gray-200"
                  >
                    View Certificate
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Certificate.propTypes = {
  deviceType: PropTypes.string,
};

export default Certificate;
