import api from "../lib/axios";

/*
  Navbar, Hero, Contact, Footer and the page SEO all read public settings
  on the same render. Sharing one in-flight request (kept for a minute)
  turns those into a single network call without serving stale data for
  long after an admin edit.
*/
const CACHE_MS = 60 * 1000;

let cached = null;

export const getPublicSettings = async () => {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.promise;

  const promise = api
    .get("/settings/public")
    .then((response) => response.data.data);

  cached = { promise, at: Date.now() };

  promise.catch(() => {
    cached = null;
  });

  return promise;
};
