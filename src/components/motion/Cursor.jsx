import { useEffect, useState } from "react";

import { motion, useMotionValue, useSpring } from "framer-motion";

const INTERACTIVE = "a, button, [role='button'], summary, label, [data-cursor]";
const TEXT_ENTRY = "input, textarea, select, [contenteditable='true']";

const canUseCustomCursor = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/*
  Desktop cursor: a precise dot plus a trailing ring that swells over
  anything clickable. Both use mix-blend-difference with white, so they
  invert whatever is underneath and stay visible in either theme. Over
  text fields it steps aside for the native caret. Mice only — touch and
  reduced-motion users never see it.
*/
function Cursor() {
  const [enabled] = useState(canUseCustomCursor);
  const [state, setState] = useState("default"); // default | hover | text | hidden
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  // The ring trails the pointer; the dot is pinned to it.
  const ringX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.6 });

  useEffect(() => {
    if (!enabled) return undefined;

    document.documentElement.classList.add("has-custom-cursor");

    const onMove = (event) => {
      x.set(event.clientX);
      y.set(event.clientY);

      const target = event.target instanceof Element ? event.target : null;

      if (target?.closest(TEXT_ENTRY)) setState("text");
      else if (target?.closest(INTERACTIVE)) setState("hover");
      else setState("default");
    };

    const onLeave = () => setState("hidden");
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const hidden = state === "hidden" || state === "text";
  const hover = state === "hover";

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[10000] mix-blend-difference">
      {/* RING */}
      <motion.div
        style={{ x: ringX, y: ringY }}
        className="absolute left-0 top-0"
      >
        <motion.div
          animate={{
            scale: hidden ? 0 : hover ? (pressed ? 1.6 : 1.9) : pressed ? 0.8 : 1,
            opacity: hidden ? 0 : 1,
            backgroundColor: hover ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="-ml-5 -mt-5 h-10 w-10 rounded-full border border-white"
        />
      </motion.div>

      {/* DOT */}
      <motion.div style={{ x, y }} className="absolute left-0 top-0">
        <motion.div
          animate={{ scale: hidden || hover ? 0 : 1 }}
          transition={{ duration: 0.15 }}
          className="-ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-white"
        />
      </motion.div>
    </div>
  );
}

export default Cursor;
