import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ProjectRoute from './routers/ProjectRoute.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProjectRoute />
  </StrictMode>,
)
