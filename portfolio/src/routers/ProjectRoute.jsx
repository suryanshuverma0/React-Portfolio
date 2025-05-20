import App from "../App";
import ProjectDetailPage from "../pagex/ProjectDetailPage";
import { BrowserRouter as Router , Routes , Route } from "react-router-dom"
import Blog from "../components/Blog";
import BlogPostDetail from '../components/BlogPostDetail';

const ProjectRoute = () => {
  return (
    <>
      <Router>
         <Routes>
                  <Route path="/" element={<App />} />
                  <Route path="/projects" element={<ProjectDetailPage />} />
                  <Route path="/blog" element={<Blog/>}/>
                  <Route path="/blog/:slug" element={<BlogPostDetail />} />
                  
         </Routes>
      </Router>
    </>
  )
}

export default ProjectRoute
