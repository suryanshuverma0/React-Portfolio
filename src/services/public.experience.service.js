import api from "../lib/axios";

export const getPublicExperiences =
  async () => {
    const response =
      await api.get(
        "/experience/public"
      );

    return response.data.data;
  };