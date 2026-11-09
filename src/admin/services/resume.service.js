import api from "../../lib/axios";

const data = (response) => response.data.data;

export const getResumes = async () => data(await api.get("/resume"));
export const getResume = async (id) => data(await api.get(`/resume/${id}`));
export const getResumeSource = async () => data(await api.get("/resume/source"));
export const createResume = async (body) => data(await api.post("/resume", body));
export const updateResume = async (id, body) => data(await api.put(`/resume/${id}`, body));
export const duplicateResume = async (id) => data(await api.post(`/resume/${id}/duplicate`));
export const deleteResume = async (id) => data(await api.delete(`/resume/${id}`));

// Public (no auth): the default resume or one by its share slug.
export const getPublicResume = async (slug) => data(await api.get(slug ? `/resume/public/${encodeURIComponent(slug)}` : "/resume/public"));
