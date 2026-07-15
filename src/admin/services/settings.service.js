import api from "../../lib/axios";

export const getSettings = async () => {
  const response = await api.get("/settings");

  return response.data.data;
};

export const createSettings = async (data) => {
  const response = await api.post("/settings", data);

  return response.data;
};

export const updateSettings = async (data) => {
  const response = await api.put("/settings", data);

  return response.data;
};
