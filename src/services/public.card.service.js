import api from "../lib/axios";

export const getPublicCard = async () => {
  const response = await api.get("/card");

  return response.data.data;
};

// Served straight from the API so phones open it as a contact file.
export const getVCardUrl = () => `${api.defaults.baseURL}/card/vcard`;
