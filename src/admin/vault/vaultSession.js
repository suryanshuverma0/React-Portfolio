import { useSyncExternalStore } from "react";

import api from "../../lib/axios";
import * as vc from "./vaultCrypto";

/* ========================================
   VAULT SESSION — the open vault key lives
   only in this tab's memory (never storage).
   It's dropped on "Lock", when the life
   area locks, after 10 minutes without
   activity on the vault page, or when the
   tab is closed.
========================================= */

const IDLE_MS = 10 * 60 * 1000;
let session = { vk: null, config: null, usage: null, loading: true, configured: false };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const set = (patch) => {
  session = { ...session, ...patch };
  emit();
};

export const useVault = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => session,
  );

const data = (r) => r.data.data;

export const loadVaultConfig = async () => {
  const r = data(await api.get("/vault/config"));
  set({ loading: false, configured: r.configured, config: r.config, usage: r.usage });
  return r;
};

let idleTimer = null;
export const touchVault = () => {
  clearTimeout(idleTimer);
  if (session.vk) idleTimer = setTimeout(lockVault, IDLE_MS);
};

export const lockVault = () => {
  clearTimeout(idleTimer);
  set({ vk: null });
};

const opened = (vk) => {
  set({ vk });
  touchVault();
  return vk;
};

export const setupVault = async (password) => {
  const { vk, recovery, body } = await vc.createVault(password);
  await api.post("/vault/config", body);
  await loadVaultConfig();
  opened(vk);
  return recovery;
};

export const openWithPassword = async (password) => opened(await vc.unlockWithPassword(session.config, password));
export const openWithRecovery = async (recovery) => vc.unlockWithRecovery(session.config, recovery); // caller then sets a new password

export const changeVaultPassword = async (vk, password, { via = "password", newRecovery = false } = {}) => {
  const { body, recovery } = await vc.rewrap(vk, password, { newRecovery });
  await api.put("/vault/config/password", { ...body, via });
  await loadVaultConfig();
  opened(vk);
  return recovery;
};

if (typeof window !== "undefined") window.addEventListener("life:locked", lockVault);

/* ---------- items ---------- */

export const fetchItems = async () => data(await api.get("/vault/items"));

// Decrypt every item's metadata (titles, fields …) for display/search.
export const decryptItems = async (vk, items) =>
  Promise.all(
    items.map(async (item) => {
      try {
        const ik = await vc.openItemKey(vk, item.key);
        return { ...item, ik, meta: await vc.openJson(ik, item.meta) };
      } catch {
        return { ...item, broken: true, meta: { title: "Can't decrypt this item", fields: [], files: [] } };
      }
    }),
  );

export const uploadEncrypted = async (ik, file, onProgress) => {
  const blob = await vc.encryptFile(ik, file, (p) => onProgress?.(p * 0.5));
  const r = await api.post("/vault/files", blob, {
    headers: { "Content-Type": "application/octet-stream" },
    onUploadProgress: (e) => e.total && onProgress?.(0.5 + (e.loaded / e.total) * 0.5),
    timeout: 120000,
  });
  return data(r); // { id, size }
};

export const downloadDecrypted = async (ik, fileId, type) => {
  const r = await api.get(`/vault/files/${fileId}`, { responseType: "arraybuffer", timeout: 120000 });
  return vc.decryptFile(ik, r.data, type);
};

export const saveItem = async (vk, existing, meta) => {
  const { ik, wrapped } = existing?.ik ? { ik: existing.ik, wrapped: existing.key } : await vc.newItemKey(vk);
  const body = { meta: await vc.seal(ik, meta), key: wrapped, files: meta.files.map((f) => f.id) };
  return existing?._id ? data(await api.put(`/vault/items/${existing._id}`, body)) : data(await api.post("/vault/items", body));
};

export const newItemKey = (vk) => vc.newItemKey(vk);
