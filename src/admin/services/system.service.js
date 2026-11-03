import api from "../../lib/axios";

const data = (response) => response.data.data;

export const getSystemHealth = async () => data(await api.get("/system/health"));
export const searchAdmin = async (q) => data(await api.get("/search", { params: { q } }));
