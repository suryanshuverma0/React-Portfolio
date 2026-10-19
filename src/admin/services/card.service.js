import api from "../../lib/axios";

export const getCardSettings = async () => {
  const response = await api.get("/card/admin");

  return response.data.data;
};

export const updateCardSettings = async (data) => {
  const response = await api.put("/card/admin", data);

  return response.data.data;
};

export const getCardAnalytics = async (rangeDays) => {
  const response = await api.get("/card/analytics", {
    params: {
      range: rangeDays,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  return response.data.data;
};
