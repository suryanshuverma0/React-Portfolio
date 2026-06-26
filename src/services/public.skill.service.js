import api from "../lib/axios";

export const getPublicSkills = async () => {
  const response = await api.get("/skill/public");

  return response.data.data;
};