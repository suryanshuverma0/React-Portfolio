import api from "../../lib/axios";

export const getSkills = async () => {
  const response = await api.get("/skill");
  return response.data.data;
};

export const createSkill = async (data) => {
  const response = await api.post("/skill", data);
  return response.data.data;
};

export const updateSkill = async (id, data) => {
  const response = await api.put(`/skill/${id}`, data);
  return response.data.data;
};

export const deleteSkill = async (id) => {
  const response = await api.delete(`/skill/${id}`);
  return response.data;
};