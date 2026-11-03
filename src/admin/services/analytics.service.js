import api from "../../lib/axios";

export const getDashboardSummary = async () => {
  const response = await api.get("/analytics/dashboard");

  return response.data.data;
};

export const getDashboardInsights = async () => {
  const response = await api.get("/analytics/dashboard/insights", {
    params: { tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
  });

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

export const getAudienceInsights = async (rangeDays) => {
  const response = await api.get("/analytics/audience", {
    params: { range: rangeDays },
  });

  return response.data.data;
};

// What the API resolves for the admin's own request (IP, proxy headers,
// location) — used to check visitor geolocation is working.
export const getGeoDebug = async () => {
  const response = await api.get("/analytics/debug/geo");

  return response.data.data;
};

export const getCompanies = async (rangeDays, includeAll = false) => {
  const response = await api.get("/analytics/companies", {
    params: { range: rangeDays, all: includeAll ? "true" : undefined },
  });

  return response.data.data;
};

// Streams the CSV through axios (auth cookie) and hands back a Blob.
export const exportAnalyticsCsv = async ({ type, range, bots }) => {
  const response = await api.get("/analytics/export", {
    params: { type, range, bots: bots ? "true" : undefined },
    responseType: "blob",
    timeout: 120000,
  });

  const disposition = response.headers["content-disposition"] || "";
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || `portfolio-${type}.csv`;

  return { blob: response.data, filename };
};

export const purgeOwnerData = async () => {
  const response = await api.post("/analytics/owner-data/purge");

  return response.data.data;
};

export const getRecentActivity = async (limit = 12) => {
  const response = await api.get("/analytics/recent-activity", {
    params: { limit },
  });

  return response.data.data;
};
