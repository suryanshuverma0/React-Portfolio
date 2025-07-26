import pixel_studio_img from "../assets/pixel_studio.png";
import note from "../assets/note.png";
import library_management from "../assets/library_management.png";
import pneumoniaImg from "../assets/pneumonia.jpg";
import interview from "../assets/interview.png"
import InstantDomainChecker from "../assets/instant_domain_checker.png"
export const projects_data = [
  {
    id: 1,
    name: "Pneumonia Detection System using Deep Learning Techniaues",
    project_image: pneumoniaImg,

    description:
      "Developed an AI-powered Pneumonia Detection System using CNN and ResNet-101V2 to classify X-ray images as 'Pneumonia' or 'Normal' with probability scores.",
      technology_used: ["Python"],
    github_link: "https://github.com/suryanshuverma0/PneumoniaDetectionSystem",
    is_deployed: false,
   
  },
  {
    id: 2,
    name: "Pixel Studio",
    project_image: pixel_studio_img,
    description:
      "Pixel Studio is an interactive web application designed for creating pixel art and freehand drawings. It features secure user authentication, an intuitive pixel art editor, and a flexible HTML canvas equipped with a color picker for drawing. Developed as part of a computer graphics course, this project demonstrates creative digital art tools in a streamlined and user-friendly platform.",
    technology_used: ["React", "Firebase", "Tailwind"],
    github_link: "https://github.com/suryanshuverma0/pixel-studio",
    is_deployed: true,
    deployment_url: "https://pixelstudio-2e0bd.web.app/",
  },
  {
    id: 3,
    name: "NoteMania",
    project_image: note,

    description:
      "NoteMaina is a simple note-taking platform built using React for the frontend and Firebase for authentication, database, and hosting. Users can create, edit, and organize notes efficiently, with the option to save notes as PDFs for future use. This project integrates essential cloud-based services to offer a seamless note management experience.",
    technology_used: ["React", "Firebase", "Tailwind"],
    github_link: "https://note-taking-application-f1180.web.app/notes",
    is_deployed: true,
    deployment_url: "https://note-taking-application-f1180.web.app/notes",
  },
  {
    id: 4,
    name: "AI Interview Mocker",
    project_image: interview,

    description:
      "This project helps users prepare for interviews by entering their desired job title and description. The AI generates customized interview questions and provides feedback on answers, including corrections and suggestions for improvement.",
    technology_used: ["React"],
    github_link: "https://github.com/suryanshuverma0/Library-Management-System",
    is_deployed: true,
    deployment_url: "https://ai-interview-moker.vercel.app/"
   
  },
  {
    id: 5,
    name: "Library Management System",
    project_image: library_management,

    description:
      "Developed during my third semester, this was my first project—a Command Line Interface (CLI) application with separate dashboards for teachers and students. Students can order or cancel books, view details, and check fines, while teachers can monitor student activities. Data is stored in text files and retrieved for the teacher's dashboard. This project introduced me to Object-Oriented Programming (OOP) in C++.",
    technology_used: ["C++"],
    github_link: "https://github.com/suryanshuverma0/Library-Management-System",
    is_deployed: false,
   
  },
  {
    id: 6,
    name: "Instant Domain Checker",
    project_image: InstantDomainChecker,

    description:
      "A simple and fast tool built with the MERN stack to check domain name availability in real-time. Designed for entrepreneurs, developers, and creatives looking to secure the perfect domain for their next big idea.",
    technology_used: ["React", "Node"],
    github_link: "https://github.com/suryanshuverma0/instant-domain-checker/tree/main/instant-domain-checker",
    is_deployed: true,
    deployment_url: "https://instant-domain-checker.vercel.app/"
   
  }
  
];
