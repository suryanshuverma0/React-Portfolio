import api from "../lib/axios";

export const getPublicSettings = async () => {
  const response = await api.get("/settings/public");

  return response.data.data;
};
