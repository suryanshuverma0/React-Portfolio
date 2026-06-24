import api from "../../lib/axios";

export const getStats = async () => {
  const response = await api.get("/stats");

  return response.data.data;
};

export const createStat = async (data) => {
  const response = await api.post("/stats", data);

  return response.data.data;
};

export const updateStat = async (id, data) => {
  const response = await api.put(`/stats/${id}`, data);

  return response.data.data;
};

export const deleteStat = async (id) => {
  const response = await api.delete(`/stats/${id}`);

  return response.data;
};
