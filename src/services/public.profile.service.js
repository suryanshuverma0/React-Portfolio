import api from "../lib/axios";

export const getPublicProfile =
  async () => {
    const response =
      await api.get(
        "/profile/public"
      );

    return response.data.data;
  };