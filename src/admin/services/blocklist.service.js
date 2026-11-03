import api from "../../lib/axios";

const data = (response) => response.data.data;

export const getBlocklist = async () => data(await api.get("/blocklist"));
export const blockIp = async (value, reason) => data(await api.post("/blocklist", { value, reason }));
export const unblockIp = async (id) => data(await api.delete(`/blocklist/${id}`));
