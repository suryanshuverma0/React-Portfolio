import { useSyncExternalStore } from "react";
import { startAuthentication } from "@simplewebauthn/browser";

import api from "../../lib/axios";
import { clearAdminCache } from "../../lib/adminCache";

/* ========================================
   LIFE LOCK — client state for the second
   lock in front of the personal side.

   The server is the authority (httpOnly
   cookie, idle deadline). This mirrors it:
   - any 423 from the API locks the UI;
   - while you're active on a personal page
     it pings at most once a minute so the
     server's idle timer matches what you're
     doing (reading without saving counts);
   - idle past the deadline locks locally
     too, so the screen doesn't sit open.
========================================= */

let state = { loading: true, configured: false, unlocked: false, expiresAt: null, autoLockMinutes: 15, passkeys: 0, mfa: false, lockedUntil: null };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const setState = (patch) => {
  state = { ...state, ...patch };
  if (!state.unlocked) clearAdminCache();
  emit();
};

export const useLifeLock = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );

const data = (r) => r.data.data;
const unlocked = (expiresAt) => setState({ unlocked: true, configured: true, expiresAt, lockedUntil: null });

export const refreshLifeLock = async () => {
  try {
    setState({ ...data(await api.get("/life/lock")), loading: false });
  } catch {
    setState({ loading: false });
  }
};

export const setupLifeLock = async (passphrase, autoLockMinutes) => {
  const result = data(await api.post("/life/lock/setup", { passphrase, autoLockMinutes }));
  await refreshLifeLock();
  return result; // { recoveryCode }
};

export const unlockWithPassphrase = async (passphrase) => unlocked(data(await api.post("/life/lock/unlock", { passphrase })).expiresAt);

// purpose "unlock" opens the area; "reset" returns a grant for a new passphrase.
export const unlockWithFingerprint = async (purpose = "unlock") => {
  const optionsJSON = data(await api.post("/life/lock/passkey/options"));
  const response = await startAuthentication({ optionsJSON });
  const result = data(await api.post("/life/lock/passkey/verify", { response, purpose }));
  if (purpose === "unlock") unlocked(result.expiresAt);
  return result;
};

export const startReset = async (method, code) => data(await api.post("/life/lock/reset/start", { method, code })).grant;

export const finishReset = async (grant, next) => {
  const result = data(await api.post("/life/lock/reset/finish", { grant, next }));
  await refreshLifeLock();
  return result; // { recoveryCode }
};

export const lockNow = async () => {
  setState({ unlocked: false, expiresAt: null });
  await api.post("/life/lock/lock").catch(() => {});
};

export const changePassphrase = async (current, next) => {
  await api.post("/life/lock/change", { current, next });
  await refreshLifeLock();
};

export const updateAutoLock = async (autoLockMinutes) => {
  await api.put("/life/lock/settings", { autoLockMinutes });
  await refreshLifeLock();
};

export const newRecoveryCode = async (passphrase) => data(await api.post("/life/lock/recovery-code", { passphrase })).recoveryCode;

/* ---------- server says locked ---------- */

if (typeof window !== "undefined") {
  window.addEventListener("life:locked", (event) => {
    setState({ unlocked: false, expiresAt: null, configured: event.detail !== "LIFE_SETUP_REQUIRED" ? true : false, loading: false });
  });
}

/* ---------- activity heartbeat + idle lock ---------- */

let lastPing = 0;
let lastActivity = Date.now();
let idleTimer = null;

const scheduleIdleLock = () => {
  clearTimeout(idleTimer);
  if (!state.unlocked) return;
  const ms = state.autoLockMinutes * 60 * 1000 - (Date.now() - lastActivity);
  idleTimer = setTimeout(() => {
    if (Date.now() - lastActivity >= state.autoLockMinutes * 60 * 1000) setState({ unlocked: false, expiresAt: null });
    else scheduleIdleLock();
  }, Math.max(1000, ms));
};

export const noteLifeActivity = () => {
  lastActivity = Date.now();
  scheduleIdleLock();
  if (state.unlocked && Date.now() - lastPing > 60 * 1000) {
    lastPing = Date.now();
    api
      .post("/life/lock/ping")
      .then((r) => setState({ expiresAt: data(r).expiresAt }))
      .catch(() => {});
  }
};

listeners.add(() => scheduleIdleLock());
