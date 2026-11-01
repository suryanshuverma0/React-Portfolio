/*
  Feeds the pointer position to the `spotlight` utility as CSS variables.
  Writing straight to the element's style keeps it out of React state, so
  moving the mouse never re-renders the card.
*/
export const trackPointer = (event) => {
  const el = event.currentTarget;

  const rect = el.getBoundingClientRect();

  el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--my", `${event.clientY - rect.top}px`);
};
