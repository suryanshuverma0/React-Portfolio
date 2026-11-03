import api from "../../lib/axios";

const data = (response) => response.data.data;
const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const getGoals = async (range) => data(await api.get("/analytics/goals", { params: { range, tz: tz() } }));
export const createGoal = async (body) => data(await api.post("/analytics/goals", body));
export const updateGoal = async (id, body) => data(await api.put(`/analytics/goals/${id}`, body));
export const deleteGoal = async (id) => data(await api.delete(`/analytics/goals/${id}`));
