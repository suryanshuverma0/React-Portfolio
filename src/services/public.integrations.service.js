import api from "../lib/axios";

export const getIntegrationsStatus = async () => {
  const response = await api.get("/integrations/status");

  return response.data.data;
};
