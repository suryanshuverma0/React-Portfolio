import App from "../App";
import ProjectDetailPage from "../pages/ProjectDetailPage";
import { BrowserRouter as Router , Routes , Route } from "react-router-dom"
const ProjectRoute = () => {
  return (
    <>
      <Router>
         <Routes>
                  <Route path="/" element={<App />} />
                  <Route path="/projects" element={<ProjectDetailPage />} />
                  
         </Routes>
      </Router>
    </>
  )
}

export default ProjectRoute
