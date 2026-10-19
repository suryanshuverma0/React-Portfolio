import api from "../../lib/axios";

export const getStorageOverview = async ({ refresh = false } = {}) => {
  const response = await api.get("/storage", {
    params: refresh ? { refresh: true } : undefined,
  });

  return response.data.data;
};
