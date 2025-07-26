import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import TitleComponent from "./TitleComponent"
import c1 from "../assets/certificates/c1.png";
import c2 from "../assets/certificates/c2.png";
import c3 from "../assets/certificates/c3.png";
import c4 from "../assets/certificates/c4.png";
import c5 from "../assets/certificates/c5.png";

const certificates = [c1, c2, c3, c4, c5];

const responsive = {
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 1,
  },
  tablet: {
    breakpoint: { max: 1024, min: 640 },
    items: 1,
  },
  mobile: {
    breakpoint: { max: 640, min: 0 },
    items: 1,
  },
};

const Certificate = () => {
  return (
    <div className="w-full max-w-3xl mx-auto py-8 flex justify-center items-center flex-col">
         <TitleComponent title="Certificates" />
      <Carousel
        responsive={responsive}
        arrows={true}
        showDots={true}
        infinite={true}
        autoPlay={true}
        autoPlaySpeed={4000}
        swipeable={true}
        draggable={true}
        keyBoardControl={true}
        containerClass="w-full"
        itemClass="w-full"
      >
        {certificates.map((src, index) => (
          <div
            key={index}
            className="w-full flex justify-center items-center"
          >
            <img
              src={src}
              alt={`Certificate ${index + 1}`}
              className="w-full max-h-[380px] object-contain"
            />
          </div>
        ))}
      </Carousel>

    </div>
    
  );
};

export default Certificate;
