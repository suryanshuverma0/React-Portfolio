import TitleComponent from "./TitleComponent";
import EducationCard from "./EducationCard";
import BlogCard from "./BlogCard";
const About = () => {
  return (
    <>
      <div className="text-center text-black dark:text-white flex justify-center items-center flex-col">
        <TitleComponent title="About Me" />
        <div className="w-[80%] md:w-1/2 text-lg">
          <p>
            I&apos;m <strong>Suryanshu Verma</strong>, a Computer Engineering
            student at Advanced College of Engineering and Management. I&apos;ve
            explored the <b>MERN stack</b>, focusing on <b>React</b> and 
             <b> Node.js</b>, and have a strong foundation in <b>C</b>, <b>C++</b>
            , and
            <b>Python</b>.
          </p>
          <p>
            I&apos;m currently deepening my knowledge of the <b>MERN stack</b>{" "}
            and continue building efficient, scalable applications. Let&apos;s
            connect and create something great together!
          </p>
        </div>
        <TitleComponent title="Education" />
        <div className="grid grid-cols-1 md:grid-cols-2  gap-12 items-stretch w-full md:w-[50%] lg:w-[50%] p-16">
          <EducationCard
            title="Khwopa Secondary School"
            description="Graduated with an impressive A grade in Computer Science."
            status="Higher Secondary"
          />
          <EducationCard
            title="Advanced College of Engineering"
            description="Currently studying Computer Engineering at Tribhuwan University"
            status="Bachelor's Degree (Ongoing)
"
          />
        </div>
        <div className="w-3/4 md:w-1/2 lg:w-1/2 p-6">
          <BlogCard />
        </div>
      </div>
    </>
  );
};

export default About;
