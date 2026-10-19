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

export const getAdvancedInsights = async (rangeDays) => {
  const response = await api.get("/analytics/insights", {
    params: {
      range: rangeDays,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  return response.data.data;
};

/* ---------- visitor journeys ---------- */

export const getVisitorSessions = async (params) => {
  const response = await api.get("/analytics/sessions", { params });

  return response.data.data;
};

export const getVisitorSession = async (sessionId) => {
  const response = await api.get(`/analytics/sessions/${encodeURIComponent(sessionId)}`);

  return response.data.data;
};

export const deleteVisitorSession = async (sessionId) => {
  const response = await api.delete(`/analytics/sessions/${encodeURIComponent(sessionId)}`);

  return response.data;
};

export const getLiveVisitors = async () => {
  const response = await api.get("/analytics/sessions/live");

  return response.data.data;
};

export const getJourneyInsights = async (rangeDays) => {
  const response = await api.get("/analytics/journey", {
    params: {
      range: rangeDays,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  return response.data.data;
};

export const getRecentActivity = async (limit = 12) => {
  const response = await api.get("/analytics/recent-activity", {
    params: { limit },
  });

  return response.data.data;
};
