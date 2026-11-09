import api from "../../lib/axios";

// { config, updatedAt, updatedBy, history: [{ index, savedAt, savedBy, preset }] }
export const getAppearanceAdmin = async () => (await api.get("/appearance")).data.data;

export const saveAppearance = async (config) => (await api.put("/appearance", config)).data.data;

// Back to the built-in look (the current version stays in history).
export const resetAppearance = async () => (await api.delete("/appearance")).data.data;

export const restoreAppearance = async (index) => (await api.post("/appearance/restore", { index })).data.data;
