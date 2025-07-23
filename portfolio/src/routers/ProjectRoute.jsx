import App from "../App";
import ProjectDetailPage from "../pagex/ProjectDetailPage";
import { BrowserRouter as Router , Routes , Route } from "react-router-dom"
import Blog from "../components/Blog";
import BlogPostDetail from '../components/BlogPostDetail';
import PneumoniaDetail from "../pagex/PneumoniaDetail";
import ScrollToTop from "../components/ScrollToTop";

const ProjectRoute = () => {
  return (
    <>
      <Router>
        <ScrollToTop />
         <Routes>
                  <Route path="/" element={<App />} />
                  <Route path="/projects" element={<ProjectDetailPage />} />
                  <Route path="/blog" element={<Blog/>}/>
                  <Route path="/blog/:slug" element={<BlogPostDetail />} />
                  <Route path="/projects/pneumonia" element={<PneumoniaDetail />} />

         </Routes>
      </Router>
    </>
  )
}

export default ProjectRoute
