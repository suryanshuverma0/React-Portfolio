import api from "../lib/axios";

export const getPublicEducations =
  async () => {
    const response =
      await api.get(
        "/education/public"
      );

    return response.data.data;
  };