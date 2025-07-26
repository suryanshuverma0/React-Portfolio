// // import PropTypes from "prop-types";
// // import c1 from "../assets/certificates/c1.png";
// // import c2 from "../assets/certificates/c2.png";
// // import c3 from "../assets/certificates/c3.png";
// // import c4 from "../assets/certificates/c4.png";
// // import c5 from "../assets/certificates/c5.png";

// // const certificates = [
// //   {
// //     src: c1,
// //     alt: "certificate 1",
// //     link: "https://www.coursera.org/account/accomplishments/verify/68KUHN49HHBC",
// //     title: "Introduction to Web Development",
// //   },
// //   {
// //     src: c2,
// //     alt: "certificate 2",
// //     link: "https://www.coursera.org/account/accomplishments/verify/6NLRHLXS996J",
// //     title: "JavaScript Basics",
// //   },
// //   {
// //     src: c3,
// //     alt: "certificate 3",
// //     link: "https://www.coursera.org/account/accomplishments/verify/QX3FRKGHR4E5",
// //     title: "Programming With JavaScript",
// //   },
// //   {
// //     src: c4,
// //     alt: "certificate 4",
// //     link: "https://www.coursera.org/account/accomplishments/certificate/2LTMW9BERWZG",
// //     title: "C++ for Programmers",
// //   },
// //   {
// //     src: c5,
// //     alt: "certificate 5",
// //     link: "https://www.freecodecamp.org/certification/suryanshuverma/responsive-web-design",
// //     title: "Responsive Web Design",
// //   },
// // ];

// // const Certificate = () => {
// //   return (
// //     <div className="flex justify-center items-center max-w-sm md:max-w-4xl lg:max-w-4xl w-full shadow-lg dark:shadow-glow">
// //       <div className="mt-8 mx-8 w-full overflow-x-auto px-8 py-6 bg-gray-100 dark:bg-neutral-900 ">
// //         <div className="flex space-x-6">
// //           {certificates.map((certificate, index) => (
// //             <div
// //               key={index}
// //               className="min-w-[100px] md:min-w-[250px] lg:min-w-[250px] flex flex-shrink-0 group shadow-lg rounded-lgtransition-transform transform hover:scale-105 hover:shadow-2xl"
// //             >
// //               <img
// //                 src={certificate.src}
// //                 alt={certificate.alt}
// //                 className="amx-w-full h-64 object-contain rounded-lg"
// //               />
// //               <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold py-1 px-2 rounded-full">
// //                 New
// //               </div>
// //               <div className="absolute inset-0 bg-neutral-800 bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
// //                 <div className="text-center">
// //                   <h3 className="text-gray-100 text-lg font-semibold mb-2">
// //                     {certificate.title}
// //                   </h3>
// //                   <a
// //                     href={certificate.link}
// //                     target="_blank"
// //                     rel="noopener noreferrer"
// //                     className="inline-block bg-white text-black py-2 px-4 rounded-lg font-semibold transition duration-300 hover:bg-gray-200"
// //                   >
// //                     View Certificate
// //                   </a>
// //                 </div>
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // Certificate.propTypes = {
// //   deviceType: PropTypes.string,
// // };

// // export default Certificate;


// // import { useState } from "react";
// // import PropTypes from "prop-types";
// // import Modal from "react-modal";
// // import c1 from "../assets/certificates/c1.png";
// // import c2 from "../assets/certificates/c2.png";
// // import c3 from "../assets/certificates/c3.png";
// // import c4 from "../assets/certificates/c4.png";
// // import c5 from "../assets/certificates/c5.png";

// // const certificates = [
// //   {
// //     src: c1,
// //     alt: "certificate 1",
// //     link: "https://www.coursera.org/account/accomplishments/verify/68KUHN49HHBC",
// //     title: "Introduction to Web Development",
// //   },
// //   {
// //     src: c2,
// //     alt: "certificate 2",
// //     link: "https://www.coursera.org/account/accomplishments/verify/6NLRHLXS996J",
// //     title: "JavaScript Basics",
// //   },
// //   {
// //     src: c3,
// //     alt: "certificate 3",
// //     link: "https://www.coursera.org/account/accomplishments/verify/QX3FRKGHR4E5",
// //     title: "Programming With JavaScript",
// //   },
// //   {
// //     src: c4,
// //     alt: "certificate 4",
// //     link: "https://www.coursera.org/account/accomplishments/certificate/2LTMW9BERWZG",
// //     title: "C++ for Programmers",
// //   },
// //   {
// //     src: c5,
// //     alt: "certificate 5",
// //     link: "https://www.freecodecamp.org/certification/suryanshuverma/responsive-web-design",
// //     title: "Responsive Web Design",
// //   },
// // ];

// // const Certificate = () => {
// //   const [modalOpen, setModalOpen] = useState(false);
// //   const [selected, setSelected] = useState(null);

// //   const openModal = (certificate) => {
// //     setSelected(certificate);
// //     setModalOpen(true);
// //   };

// //   const closeModal = () => {
// //     setModalOpen(false);
// //     setSelected(null);
// //   };

// //   return (
// //     <div className="max-w-6xl mx-auto px-4 py-10">
// //       <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white">
// //         Certificates
// //       </h2>

// //       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
// //         {certificates.map((certificate, index) => (
// //           <div
// //             key={index}
// //             onClick={() => openModal(certificate)}
// //             className="relative cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-transform transform hover:scale-105 bg-white dark:bg-neutral-800"
// //           >
// //             <img
// //               src={certificate.src}
// //               alt={certificate.alt}
// //               className="w-full h-48 object-contain p-3"
// //             />
// //             <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-300">
// //               <span className="text-white text-sm font-semibold">
// //                 {certificate.title}
// //               </span>
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Modal for preview */}
// //       {selected && (
// //         <Modal
// //           isOpen={modalOpen}
// //           onRequestClose={closeModal}
// //           className="max-w-2xl mx-auto my-20 bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-xl outline-none"
// //           overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50"
// //           ariaHideApp={false}
// //         >
// //           <img
// //             src={selected.src}
// //             alt={selected.alt}
// //             className="w-full h-auto object-contain mb-4 rounded"
// //           />
// //           <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
// //             {selected.title}
// //           </h3>
// //           <a
// //             href={selected.link}
// //             target="_blank"
// //             rel="noopener noreferrer"
// //             className="inline-block px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-90 transition"
// //           >
// //             View Certificate
// //           </a>
// //         </Modal>
// //       )}
// //     </div>
// //   );
// // };

// // Certificate.propTypes = {
// //   deviceType: PropTypes.string,
// // };

// // export default Certificate;


// import PropTypes from "prop-types";
// import Carousel from "react-multi-carousel";
// import "react-multi-carousel/lib/styles.css";
// import c1 from "../assets/certificates/c1.png";
// import c2 from "../assets/certificates/c2.png";
// import c3 from "../assets/certificates/c3.png";
// import c4 from "../assets/certificates/c4.png";
// import c5 from "../assets/certificates/c5.png";
// const certificates = [
//   { src: c1, title: "Intro to Web Dev", link: "..." },
//   { src: c2, title: "JavaScript Basics", link: "..." },
//   { src: c3, title: "Programming With JS", link: "..." },
//   { src: c4, title: "C++ for Programmers", link: "..." },
//   { src: c5, title: "Responsive Web Design", link: "..." },
// ];

// // const responsive = {
// //   superLargeDesktop: { breakpoint: { max: 4000, min: 1440 }, items: 4 },
// //   desktop: { max: 1440, min: 1024, items: 3 },
// //   tablet: { max: 1024, min: 640, items: 2 },
// //   mobile: { max: 640, min: 0, items: 1 },
// // };

// const responsive = {
//   desktop: {
//     breakpoint: { max: 3000, min: 1024 },
//     items: 1,
//     slidesToSlide: 1
//   },
//   tablet: {
//     breakpoint: { max: 1024, min: 640 },
//     items: 1,
//     slidesToSlide: 1
//   },
//   mobile: {
//     breakpoint: { max: 640, min: 0 },
//     items: 1,
//     slidesToSlide: 1
//   },
// };


// const CertificateCarousel = () => (
//   <div className="max-w-6xl mx-auto py-10">
//     <h2 className="text-3xl font-bold mb-6 text-center">Certificates</h2>
//     <Carousel
//       responsive={responsive}
//       infinite={true}
//       autoPlay={true}
//       autoPlaySpeed={4000}
//       showDots={true}
//       draggable={true}
//       swipeable={true}
//       removeArrowOnDeviceType={["tablet", "mobile"]}
//       containerClass="carousel-container"
//       itemClass="px-2"
//     >
//       {certificates.map((cert, idx) => (
//         <div
//           key={idx}
//           onClick={() => window.open(cert.link, "_blank")}
//           className="relative cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105 bg-white dark:bg-neutral-800"
//         >
//           <img
//             src={cert.src}
//             alt={cert.title}
//             className="w-full h-48 object-contain p-4"
//           />
//           <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-sm font-semibold py-1 px-2 rounded">
//             {cert.title}
//           </div>
//         </div>
//       ))}
//     </Carousel>
//   </div>
// );

// CertificateCarousel.propTypes = {
//   deviceType: PropTypes.string,
// };

// export default CertificateCarousel;


// import PropTypes from "prop-types";
// import Carousel from "react-multi-carousel";
// import "react-multi-carousel/lib/styles.css";
// import c1 from "../assets/certificates/c1.png";
// import c2 from "../assets/certificates/c2.png";
// import c3 from "../assets/certificates/c3.png";
// import c4 from "../assets/certificates/c4.png";
// import c5 from "../assets/certificates/c5.png";

// const certificates = [
//   {
//     src: c1,
//     title: "Introduction to Web Development",
//     link: "https://www.coursera.org/account/accomplishments/verify/68KUHN49HHBC",
//   },
//   {
//     src: c2,
//     title: "JavaScript Basics",
//     link: "https://www.coursera.org/account/accomplishments/verify/6NLRHLXS996J",
//   },
//   {
//     src: c3,
//     title: "Programming With JavaScript",
//     link: "https://www.coursera.org/account/accomplishments/verify/QX3FRKGHR4E5",
//   },
//   {
//     src: c4,
//     title: "C++ for Programmers",
//     link: "https://www.coursera.org/account/accomplishments/certificate/2LTMW9BERWZG",
//   },
//   {
//     src: c5,
//     title: "Responsive Web Design",
//     link: "https://www.freecodecamp.org/certification/suryanshuverma/responsive-web-design",
//   },
// ];

// // ✅ One slide per frame at all breakpoints
// const responsive = {
//   desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
//   tablet: { breakpoint: { max: 1024, min: 640 }, items: 1 },
//   mobile: { breakpoint: { max: 640, min: 0 }, items: 1 },
// };

// const CertificateCarousel = () => (
//   <div className="max-w-4xl mx-auto py-10 px-4">
//     <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
//       Certificates
//     </h2>

//     <Carousel
//       responsive={responsive}
//       infinite
//       autoPlay
//       autoPlaySpeed={4000}
//       showDots
//       draggable
//       swipeable
//       keyBoardControl
//       containerClass="carousel-container"
//       itemClass="px-2"
//       removeArrowOnDeviceType={["tablet", "mobile"]}
//     >
//       {certificates.map((cert, idx) => (
//         <div
//           key={idx}
//           onClick={() => window.open(cert.link, "_blank")}
//           className="relative cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105 bg-white dark:bg-neutral-900"
//         >
//           <img
//             src={cert.src}
//             alt={cert.title}
//             className="w-full h-[400px] object-contain p-6"
//           />
//           <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white text-sm font-medium py-1 px-3 rounded">
//             {cert.title}
//           </div>
//         </div>
//       ))}
//     </Carousel>
//   </div>
// );

// CertificateCarousel.propTypes = {
//   deviceType: PropTypes.string,
// };

// export default CertificateCarousel;


import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

// Import your certificate images
import c1 from "../assets/certificates/c1.png";
import c2 from "../assets/certificates/c2.png";
import c3 from "../assets/certificates/c3.png";
import c4 from "../assets/certificates/c4.png";
import c5 from "../assets/certificates/c5.png";

// Certificate image list
const certificates = [c1, c2, c3, c4, c5];

// Show only one item per screen
const responsive = {
  all: {
    breakpoint: { max: 4000, min: 0 },
    items: 1,
  },
};

const CertificateCarousel = () => {
  return (
    <div className="w-full max-w-xl mx-auto">
      <Carousel
        responsive={responsive}
        arrows={true}
        showDots={false}
        infinite={false}
        autoPlay={false}
        swipeable={true}
        draggable={true}
        keyBoardControl={true}
        containerClass="w-full"
        itemClass="w-full"
        removeArrowOnDeviceType={[]}
      >
        {certificates.map((src, index) => (
          <div key={index} className="w-full flex justify-center items-center">
            <img
              src={src}
              alt={`Certificate ${index + 1}`}
              className="w-full max-h-[400px] object-contain"
            />
          </div>
        ))}
      </Carousel>


      
    </div>
  );
};

export default CertificateCarousel;
