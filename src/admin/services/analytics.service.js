import api from "../../lib/axios";

export const getDashboardSummary = async () => {
  const response = await api.get("/analytics/dashboard");

  return response.data.data;
};

export const getAnalyticsOverview = async (rangeDays) => {
  const response = await api.get("/analytics/overview", {
    params: { range: rangeDays },
  });

  return response.data.data;
};

export const getRecentActivity = async (limit = 12) => {
  const response = await api.get("/analytics/recent-activity", {
    params: { limit },
  });

  return response.data.data;
};
