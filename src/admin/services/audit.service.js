import api from "../../lib/axios";

const data = (response) => response.data.data;

export const getLoginHistory = async (params) => data(await api.get("/audit/logins", { params }));
export const getActionLog = async (params) => data(await api.get("/audit/actions", { params }));
