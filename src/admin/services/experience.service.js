import api from "../../lib/axios";

export const getExperiences = async () => {
  const response =
    await api.get("/experience");

  return response.data.data;
};

export const createExperience =
  async (data) => {
    const response =
      await api.post(
        "/experience",
        data,
      );

    return response.data.data;
  };

export const updateExperience =
  async (id, data) => {
    const response =
      await api.put(
        `/experience/${id}`,
        data,
      );

    return response.data.data;
  };

export const deleteExperience =
  async (id) => {
    const response =
      await api.delete(
        `/experience/${id}`,
      );

    return response.data;
  };