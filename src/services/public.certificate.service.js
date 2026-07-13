import api from "../lib/axios";

export const getPublicCertificates =
  async () => {
    const response =
      await api.get(
        "/certificates/public"
      );

    return response.data.data;
  };