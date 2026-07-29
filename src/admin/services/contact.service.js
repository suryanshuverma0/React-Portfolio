import api from "../../lib/axios";

export const getMessages = async () => {
  const response = await api.get("/contact");

  return response.data.data;
};

export const markMessageRead = async (id) => {
  const response = await api.put(`/contact/${id}/read`);

  return response.data.data;
};

export const deleteMessage = async (id) => {
  const response = await api.delete(`/contact/${id}`);

  return response.data.data;
};

export const replyToMessage = async (id, message) => {
  const response = await api.post(`/contact/${id}/reply`, { message });

  return response.data.data;
};
