import api from "../lib/axios";

const normalizePost = (post) => ({
  ...post,
  coverImage: post.coverImage?.url || post.coverImage || null,
});

export const getPublicPosts = async ({ page = 1, limit = 9, tag } = {}) => {
  const response = await api.get("/blog/public", {
    params: { page, limit, tag },
  });

  return {
    posts: response.data.data.map(normalizePost),
    pagination: response.data.pagination,
  };
};

export const getPublicPostBySlug = async (slug) => {
  const response = await api.get(`/blog/public/${slug}`);

  return normalizePost(response.data.data);
};

export const getBlogTags = async () => {
  const response = await api.get("/blog/public/tags");

  return response.data.data;
};

export const getPostComments = async (slug) => {
  const response = await api.get(`/blog/public/${slug}/comments`);

  return response.data.data;
};

export const submitComment = async (slug, data) => {
  const response = await api.post(`/blog/public/${slug}/comments`, data);

  return response.data;
};
