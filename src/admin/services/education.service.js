import api from "../../lib/axios";

export const getEducations = async () => {
  const response = await api.get("/education");
  return response.data.data;
};

export const createEducation = async (data) => {
  const response = await api.post("/education", data);

  return response.data.data;
};

export const updateEducation = async (id, data) => {
  const response = await api.put(`/education/${id}`, data);

  return response.data.data;
};

export const deleteEducation = async (id) => {
  const response = await api.delete(`/education/${id}`);

  return response.data;
};
