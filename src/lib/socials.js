export const socialsObjectToArray = (socials) => {
  if (!socials) return [];

  return Object.entries(socials)
    .filter(([, href]) => href)
    .map(([icon, href]) => ({ icon, href }));
};
