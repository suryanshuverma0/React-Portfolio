import axios from "axios";
import { installAdminCache } from "./adminCache";

const api = axios.create({
  baseURL: "https://portfolio-backend-uy0a.onrender.com/api/v1",

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

// Instant revisits inside the admin dashboard (see adminCache.js).
installAdminCache(api);

/* ========================================
   RESPONSE INTERCEPTOR
======================================== */

/*
  The access cookie lives 15 minutes; the refresh cookie keeps the device
  signed in. On a 401 the session is refreshed once (shared by every
  request that failed at the same moment) and the request retried.

  Only tried when this browser has signed in before, so anonymous
  visitors don't make an extra refresh call on every page.
*/

const SESSION_HINT_KEY = "auth:signed-in";

const NO_REFRESH_PATHS = [
  "/auth/refresh-token",
  "/auth/login",
  "/auth/register",
  "/google-auth/login",
  "/passkey/authentication",
  "/account/mfa/verify",
  "/account/qr/redeem",
];

export const markSignedIn = () => {
  try {
    localStorage.setItem(SESSION_HINT_KEY, "1");
  } catch {
    /* storage unavailable — sessions just won't auto-refresh */
  }
};

export const markSignedOut = () => {
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    /* ignore */
  }
};

const hasSessionHint = () => {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
};

let refreshing = null;

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const { config, response } = error;

    if (
      response?.status !== 401 ||
      !config ||
      config._retried ||
      NO_REFRESH_PATHS.some((path) => config.url?.includes(path)) ||
      !hasSessionHint()
    ) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      refreshing ??= api.post("/auth/refresh-token").finally(() => {
        refreshing = null;
      });

      await refreshing;

      return api(config);
    } catch {
      // Session ended (expired, signed out remotely, or revoked).
      markSignedOut();
      window.dispatchEvent(new Event("auth:expired"));

      return Promise.reject(error);
    }
  },
);

export default api;
