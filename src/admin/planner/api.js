import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import api from "../../lib/axios";

const data = (r) => r.data.data;
const fail = (e) => e?.response?.status !== 423 && toast.error(e?.response?.data?.message || "Couldn't save");

export const plannerApi = {
  tasks: async (params) => data(await api.get("/planner/tasks", { params })),
  createTask: async (body) => data(await api.post("/planner/tasks", body)),
  updateTask: async (id, body) => data(await api.patch(`/planner/tasks/${id}`, body)),
  deleteTask: (id) => api.delete(`/planner/tasks/${id}`),
  reorderTasks: (ids) => api.post("/planner/tasks/reorder", { ids }),
  habits: async () => data(await api.get("/planner/habits")),
  createHabit: async (body) => data(await api.post("/planner/habits", body)),
  updateHabit: async (id, body) => data(await api.patch(`/planner/habits/${id}`, body)),
  deleteHabit: (id) => api.delete(`/planner/habits/${id}`),
  reorderHabits: (ids) => api.post("/planner/habits/reorder", { ids }),
  logs: async (from, to) => data(await api.get("/planner/logs", { params: { from, to } })),
  setLog: async (body) => data(await api.put("/planner/logs", body)),
  stats: async (params) => data(await api.get("/planner/stats", { params })),
  exportAll: async () => data(await api.get("/planner/export")),
};

/* Tasks for some periods (or a day range), with optimistic writes.
   `key` changes when the view's periods change. */
export function useTasks(query, key) {
  const [state, setState] = useState({ loading: true, tasks: [], overdue: [], key: null });

  const load = useCallback(async () => {
    try {
      const result = await plannerApi.tasks(query);
      setState({ loading: false, key, ...result });
    } catch (e) {
      fail(e);
      setState((s) => ({ ...s, loading: false }));
    }
    // `key` stands for the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    let cancelled = false;
    plannerApi
      .tasks(query)
      .then((result) => !cancelled && setState({ loading: false, key, ...result }))
      .catch((e) => {
        fail(e);
        if (!cancelled) setState((st) => ({ ...st, loading: false }));
      });
    return () => {
      cancelled = true;
    };
    // `key` stands for the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const create = async (body) => {
    const temp = { ...body, _id: `tmp-${Date.now()}`, done: false, subtasks: [], pending: true };
    setState((s) => ({ ...s, tasks: [...s.tasks, temp] }));
    try {
      const saved = await plannerApi.createTask(body);
      setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t._id === temp._id ? saved : t)) }));
    } catch (e) {
      fail(e);
      setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t._id !== temp._id) }));
    }
  };

  const update = async (task, patch) => {
    const apply = (list) => list.map((t) => (t._id === task._id ? { ...t, ...patch } : t));
    setState((s) => ({ ...s, tasks: apply(s.tasks), overdue: apply(s.overdue) }));
    try {
      await plannerApi.updateTask(task._id, patch);
      if (patch.period || patch.scope) load(); // moved somewhere else
    } catch (e) {
      fail(e);
      load();
    }
  };

  const remove = async (task) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t._id !== task._id), overdue: s.overdue.filter((t) => t._id !== task._id) }));
    try {
      await plannerApi.deleteTask(task._id);
    } catch (e) {
      fail(e);
      load();
    }
  };

  const reorder = (period, ordered) => {
    setState((s) => ({ ...s, tasks: [...s.tasks.filter((t) => t.period !== period), ...ordered.map((t, i) => ({ ...t, order: i }))] }));
    plannerApi.reorderTasks(ordered.filter((t) => !t.pending).map((t) => t._id)).catch(fail);
  };

  return { ...state, stale: state.key !== key, reload: load, create, update, remove, reorder };
}

/* Habits + their check-ins over [from, to]. */
export function useHabits(from, to) {
  const [habits, setHabits] = useState(null);
  const [logs, setLogs] = useState(() => new Map()); // `${habit}|${date}` -> count

  const load = useCallback(async () => {
    try {
      const [h, l] = await Promise.all([plannerApi.habits(), plannerApi.logs(from, to)]);
      setHabits(h);
      setLogs(new Map(l.map((x) => [`${x.habit}|${x.date}`, x.count])));
    } catch (e) {
      fail(e);
      setHabits((x) => x || []);
    }
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([plannerApi.habits(), plannerApi.logs(from, to)])
      .then(([h, l]) => {
        if (cancelled) return;
        setHabits(h);
        setLogs(new Map(l.map((x) => [`${x.habit}|${x.date}`, x.count])));
      })
      .catch((e) => {
        fail(e);
        if (!cancelled) setHabits((x) => x || []);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const countOf = (habitId, date) => logs.get(`${habitId}|${date}`) || 0;

  const setCount = async (habit, date, count) => {
    const key = `${habit._id}|${date}`;
    const before = logs.get(key) || 0;
    setLogs((m) => new Map(m).set(key, count));
    try {
      await plannerApi.setLog({ habit: habit._id, date, count });
    } catch (e) {
      fail(e);
      setLogs((m) => new Map(m).set(key, before));
    }
  };

  return { habits, setHabits, logs, countOf, setCount, reload: load };
}
