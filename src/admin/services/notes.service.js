import api from "../../lib/axios";

const data = (response) => response.data.data;

export const getNotesTree = async () => data(await api.get("/notes/tree"));

export const createNotebook = async (body) => data(await api.post("/notes/notebooks", body));
export const updateNotebook = async (id, body) => data(await api.patch(`/notes/notebooks/${id}`, body));
export const deleteNotebook = async (id) => data(await api.delete(`/notes/notebooks/${id}`));

export const createTopic = async (body) => data(await api.post("/notes/topics", body));
export const updateTopic = async (id, body) => data(await api.patch(`/notes/topics/${id}`, body));
export const deleteTopic = async (id) => data(await api.delete(`/notes/topics/${id}`));

export const createNote = async (body) => data(await api.post("/notes", body));
export const getNote = async (id) => data(await api.get(`/notes/${id}`));
export const updateNote = async (id, body) => data(await api.patch(`/notes/${id}`, body));
export const deleteNote = async (id) => data(await api.delete(`/notes/${id}`));

export const reorderNotes = async (type, ids) => data(await api.post("/notes/reorder", { type, ids }));

export const searchNotes = async ({ q, tag }) =>
  data(await api.get("/notes/search", { params: { q: q || undefined, tag: tag || undefined } }));
export const getNoteTags = async () => data(await api.get("/notes/tags"));

export const getNoteVersions = async (id) => data(await api.get(`/notes/${id}/versions`));
export const getNoteVersion = async (id, versionId) => data(await api.get(`/notes/${id}/versions/${versionId}`));
export const restoreNoteVersion = async (id, versionId) =>
  data(await api.post(`/notes/${id}/versions/${versionId}/restore`));

export const getTrash = async () => data(await api.get("/notes/trash"));
export const restoreTrashItem = async (batch) => data(await api.post(`/notes/trash/${batch}/restore`));
export const purgeTrashItem = async (batch) => data(await api.delete(`/notes/trash/${batch}`));
export const emptyTrash = async () => data(await api.delete("/notes/trash"));
