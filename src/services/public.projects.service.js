import api from "../lib/axios";

const normalizeProject = (project) => ({
  ...project,
  thumbnail: project.thumbnail?.url || project.thumbnail,
  gallery: (project.gallery || []).map((image) => image?.url || image),
  architectureImages: (project.architectureImages || []).map(
    (image) => image?.url || image,
  ),
});

export const getPublicProjects = async () => {
  const response = await api.get("/projects/public");

  return response.data.data.map(normalizeProject);
};

export const getPublicProjectBySlug = async (slug) => {
  const response = await api.get(`/projects/public/${slug}`);

  return normalizeProject(response.data.data);
};
