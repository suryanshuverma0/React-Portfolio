import api from "../lib/axios";

export const sendMessage = async (data) => {
  const response = await api.post("/contact", data);

  return response.data;
};
