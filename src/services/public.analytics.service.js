import api from "../lib/axios";
import { getVisitorId } from "../lib/visitorId";

export const trackPageView = async (path) => {
  try {
    await api.post("/analytics/track", {
      path,
      referrer: document.referrer || undefined,
      visitorId: getVisitorId(),
    });
  } catch (error) {
    console.error("Failed to track page view", error);
  }
};
