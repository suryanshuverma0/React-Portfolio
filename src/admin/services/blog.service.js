import api from "../../lib/axios";

export const getPosts = async () => {
  const response = await api.get("/blog");

  return response.data.data;
};

export const getPost = async (id) => {
  const response = await api.get(`/blog/${id}`);

  return response.data.data;
};

export const createPost = async (data) => {
  const response = await api.post("/blog", data);

  return response.data.data;
};

export const updatePost = async (id, data) => {
  const response = await api.put(`/blog/${id}`, data);

  return response.data.data;
};

export const deletePost = async (id) => {
  const response = await api.delete(`/blog/${id}`);

  return response.data.data;
};

export const getAllComments = async () => {
  const response = await api.get("/blog/comments");

  return response.data.data;
};

export const approveComment = async (id) => {
  const response = await api.put(`/blog/comments/${id}/approve`);

  return response.data.data;
};

export const deleteComment = async (id) => {
  const response = await api.delete(`/blog/comments/${id}`);

  return response.data.data;
};
