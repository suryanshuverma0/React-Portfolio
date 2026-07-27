import api from "../../lib/axios";

export const getUsers = async () => {
  const response = await api.get("/auth/users");

  return response.data.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/auth/users/${id}`);

  return response.data;
};
