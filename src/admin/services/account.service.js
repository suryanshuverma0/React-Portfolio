import api from "../../lib/axios";

const data = (response) => response.data.data;

/* ---------- signed-in devices ---------- */
export const getSessions = async () => data(await api.get("/auth/sessions"));
export const revokeSession = async (id) => data(await api.delete(`/auth/sessions/${id}`));
export const revokeOtherSessions = async () => data(await api.post("/auth/sessions/revoke-others"));

/* ---------- password ---------- */
export const getPasswordStatus = async () => data(await api.get("/account/password"));
export const changePassword = async (body) => data(await api.post("/account/password", body));

/* ---------- QR sign-in ---------- */
export const createQrLogin = async () => data(await api.post("/account/qr"));
export const getQrStatus = async (id) => data(await api.get(`/account/qr/${encodeURIComponent(id)}`));
export const redeemQrLogin = async (token) => data(await api.post("/account/qr/redeem", { token }));

/* ---------- push devices ---------- */
export const getPushDevices = async () => data(await api.get("/push"));
export const removePushDevice = async (id) => data(await api.delete(`/push/${id}`));
export const sendTestPush = async () => data(await api.post("/push/test"));
