import api from "../lib/axios";

export const getPublicServices =
  async () => {
    const response =
      await api.get(
        "/services/public"
      );

    return response.data.data;
  };