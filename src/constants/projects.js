import pixel_studio_img from "../assets/pixel_studio.png";
import note from "../assets/note.png";
export const projects_data = [
  {
    id: 1,
    name: "Pixel Studio",
    project_image: pixel_studio_img,
    description:
      "Pixel Studio is an interactive web application for creating pixel art and freehand drawings. It features secure user authentication, a user-friendly pixel art editor, and a versatile HTML canvas with a color picker for drawing. Developed for a computer graphics course, it showcases creative digital art tools in a streamlined platform.",
    technology_used: ["React", "Firebase"],
    github_link: "https://github.com/suryanshuverma0/pixel-studio",
    is_deployed: true,
  },
  {
    id: 2,
    name: "NoteMania",
    project_image: note,

    description:
      "NoteMaina is a simple note taking platform build using React library for frontend and Firebase for backend, Authentication, Database and Hosting. Note can be save as PDF for further use.",
    technology_used: ["React", "Firebase"],
    github_link: "https://note-taking-application-f1180.web.app/notes",
    is_deployed: true,
  },
];
