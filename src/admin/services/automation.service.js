import api from "../../lib/axios";

const data = (response) => response.data.data;
const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/* ---------- alerts ---------- */

export const getAlerts = async (limit = 30) => data(await api.get("/alerts", { params: { limit } }));
export const markAlertRead = async (id) => data(await api.post(`/alerts/${id}/read`));
export const markAllAlertsRead = async () => data(await api.post("/alerts/read-all"));
export const clearAlerts = async () => data(await api.delete("/alerts"));
export const getAlertSettings = async () => data(await api.get("/alerts/settings"));
export const updateAlertSettings = async (body) => data(await api.put("/alerts/settings", body));
export const sendTestAlert = async () => data(await api.post("/alerts/test"));
export const registerOwnerDevice = async (visitorId) => data(await api.post("/alerts/owner-device", { visitorId }));

/* ---------- backups ---------- */

export const getBackups = async () => data(await api.get("/backups"));
export const updateBackupSettings = async (body) => data(await api.put("/backups/settings", body));
export const runBackupNow = async () => data(await api.post("/backups/run"));
export const restoreBackup = async (backup) => data(await api.post("/backups/restore", backup));
export const getDriveConnectUrl = async () => data(await api.get("/backups/google/connect"));
export const disconnectDrive = async () => data(await api.post("/backups/google/disconnect"));

// Downloads go through axios (auth cookie) and are saved as a file.
export const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadBackup = async () => {
  const response = await api.get("/backups/download", { responseType: "blob" });
  saveBlob(response.data, `notes-backup-${new Date().toISOString().slice(0, 10)}.json`);
};

/* ---------- notes: publish & PDF ---------- */

export const getPublishStatus = async (noteId) => data(await api.get(`/notes/${noteId}/publish`));
export const publishNote = async (noteId, body) => data(await api.post(`/notes/${noteId}/publish`, body));
export const unpublishNote = async (noteId) => data(await api.post(`/notes/${noteId}/unpublish`));

export const downloadNotePdf = async (noteId, title) => {
  const response = await api.get(`/notes/${noteId}/pdf`, { responseType: "blob" });
  const safe = (title || "note").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "note";
  saveBlob(response.data, `${safe}.pdf`);
};

/* ---------- analytics: blog & executive report ---------- */

export const getBlogAnalytics = async (range) => data(await api.get("/analytics/blog", { params: { range, tz: tz() } }));
export const getExecutiveReport = async (period) => data(await api.get("/analytics/report", { params: { period, tz: tz() } }));
export const emailExecutiveReport = async (period) => data(await api.post("/analytics/report/email", null, { params: { period, tz: tz() } }));
