import { useEffect } from "react";

import Lenis from "lenis";

/*
  Inertial wheel/trackpad scrolling for the homepage. Touch keeps native
  scrolling (Lenis leaves it alone by default), reduced-motion users keep
  the browser's own behaviour, and in-page anchor links glide to their
  section. Anything scrollable inside the page opts out with
  data-lenis-prevent.

  Lenis drives the real window scroll position, so framer-motion's
  useScroll, the 3D scene and IntersectionObserver all keep working.
*/
function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09,
      wheelMultiplier: 0.95,
      anchors: { offset: -16 },
      prevent: (node) => node.closest?.("[data-lenis-prevent]") != null,
    });

    return () => lenis.destroy();
  }, []);

  return null;
}

export default SmoothScroll;
