import pixel_studio_img from "../assets/pixel_studio.png";
import note from "../assets/note.png";
import library_management from "../assets/library_management.png";
export const projects_data = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
    name: "Library Management System",
    project_image: library_management,

    description:
      "Developed during my third semester, this was my first project—a Command Line Interface (CLI) application with separate dashboards for teachers and students. Students can order or cancel books, view details, and check fines, while teachers can monitor student activities. Data is stored in text files and retrieved for the teacher's dashboard. This project introduced me to Object-Oriented Programming (OOP) in C++.",
    technology_used: ["C++"],
    github_link: "https://github.com/suryanshuverma0/Library-Management-System",
    is_deployed: false,
   
  },
];
