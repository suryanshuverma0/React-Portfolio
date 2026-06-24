import api from "../lib/axios";

export const getPublicStats =
  async () => {
    const response =
      await api.get(
        "/stats/public"
      );

    return response.data.data;
  };