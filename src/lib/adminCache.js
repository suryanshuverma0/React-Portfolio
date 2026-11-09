import axios from "axios";

/* ========================================
   ADMIN RESPONSE CACHE

   Going back to a dashboard page you just
   saw used to refetch everything and flash
   its skeleton again. This keeps recent GET
   responses so a revisit renders at once.

   Deliberately narrow, so nothing goes stale:
   - Only while on /dashboard, never auth.
   - Only for the burst of requests a page
     makes right after a navigation. Polls,
     refresh buttons and later loads always
     hit the network (and refresh the cache).
   - Entries live 60s at most.
   - Any write (POST/PUT/PATCH/DELETE)
     empties the cache, so your own edits
     always show up.
   - Identical requests in flight at the same
     time share one network call.
========================================= */

const MAX_AGE_MS = 60 * 1000;
const NAVIGATION_WINDOW_MS = 1500;
const MAX_ENTRIES = 150;

const NEVER_CACHE = /\/auth\/|\/google-auth\/|\/passkey\//;

const cache = new Map(); // key -> { at, response }
const inflight = new Map(); // key -> Promise<response>

let lastPath = null;
let navigatedAt = 0;

const isAdminPage = () =>
  typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard");

const keyFor = (config) => {
  const params = config.params ? JSON.stringify(config.params) : "";
  return `${config.baseURL || ""}${config.url}?${params}`;
};

// A request on a different page than the last one marks a navigation;
// requests in the next moment are that page's initial load.
const isNavigationLoad = () => {
  const path = window.location.pathname;
  const now = Date.now();

  if (path !== lastPath) {
    lastPath = path;
    navigatedAt = now;
  }

  return now - navigatedAt < NAVIGATION_WINDOW_MS;
};

// Raw adapter responses (data still a string) are stored, so each caller
// gets its own freshly parsed copy and can't mutate the cached one.
const copy = (response, config) => ({ ...response, config, request: null });

export const clearAdminCache = () => cache.clear();

export const installAdminCache = (instance) => {
  const network = axios.getAdapter(instance.defaults.adapter);

  instance.defaults.adapter = async (config) => {
    const method = (config.method || "get").toLowerCase();

    if (method !== "get") {
      cache.clear();
      return network(config);
    }

    if (!isAdminPage() || NEVER_CACHE.test(config.url || "") || config.responseType === "blob") {
      return network(config);
    }

    const key = keyFor(config);
    const navigationLoad = isNavigationLoad();
    const hit = cache.get(key);

    if (navigationLoad && hit && Date.now() - hit.at < MAX_AGE_MS) {
      return copy(hit.response, config);
    }

    if (inflight.has(key)) {
      try {
        return copy(await inflight.get(key), config);
      } catch (error) {
        // Each caller gets its own error bound to its own config, so the
        // 401 → refresh → retry interceptor treats them independently.
        throw Object.assign(Object.create(Object.getPrototypeOf(error)), error, { config });
      }
    }

    const request = network(config)
      .then((response) => {
        if (response.status >= 200 && response.status < 300) {
          cache.set(key, { at: Date.now(), response });

          if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
        }
        return response;
      })
      .finally(() => inflight.delete(key));

    inflight.set(key, request);

    return copy(await request, config);
  };
};
