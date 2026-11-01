import api from "../lib/axios";

// Hero and About both read the profile on first paint — share one request.
const CACHE_MS = 60 * 1000;

let cached = null;

export const getPublicProfile = async () => {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.promise;

  const promise = api
    .get("/profile/public")
    .then((response) => response.data.data);

  cached = { promise, at: Date.now() };

  promise.catch(() => {
    cached = null;
  });

  return promise;
};
