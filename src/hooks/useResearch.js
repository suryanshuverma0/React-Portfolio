import { useEffect, useState } from "react";

import api from "../lib/axios";
import { researchContent } from "../components/content/researchContent";

/*
  Research papers for the public site. Papers come from the admin
  (Research page); until any exist — or if the API is unreachable — the
  built-in paper in content/researchContent.js is shown, so the section
  never goes empty. One shared request serves the hero, marquee and
  section.
*/

const FALLBACK = researchContent.map((p) => ({ ...p, slug: p.id }));

let request = null;

const loadResearch = () => {
  if (!request) {
    request = api
      .get("/research/public")
      .then((r) => (Array.isArray(r.data?.data) && r.data.data.length ? r.data.data.map((p) => ({ ...p, id: p.slug || p._id })) : FALLBACK))
      .catch(() => {
        request = null;
        return FALLBACK;
      });
  }
  return request;
};

export const useResearch = () => {
  const [papers, setPapers] = useState(FALLBACK);

  useEffect(() => {
    let alive = true;
    loadResearch().then((list) => alive && setPapers(list));
    return () => {
      alive = false;
    };
  }, []);

  return papers;
};

// The paper the hero announces: the featured one, else the first.
export const featuredPaperOf = (papers) => papers.find((p) => p.featured) || papers[0] || null;
