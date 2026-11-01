import { useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

const supportsWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
};

const whenIdle = (callback) =>
  "requestIdleCallback" in window
    ? window.requestIdleCallback(callback, { timeout: 1500 })
    : window.setTimeout(callback, 400);

const cancelIdle = (handle) =>
  "cancelIdleCallback" in window ? window.cancelIdleCallback(handle) : window.clearTimeout(handle);

/*
  Fixed WebGL backdrop for the homepage. Three.js is split into its own
  chunk and only fetched once the page is idle, so it never competes with
  first paint. Skipped entirely for reduced-motion users and browsers
  without WebGL — the page is complete without it.

  Portalled to <body>: the route wrapper animates a transform, which would
  otherwise turn `position: fixed` into "scrolls with the page".
*/
function ScrollScene() {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  const [enabled] = useState(
    () =>
      typeof window !== "undefined" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      supportsWebGL(),
  );

  useEffect(() => {
    if (!enabled) return undefined;

    let dispose;
    let cancelled = false;

    const handle = whenIdle(async () => {
      const { createParticleScene } = await import("./particleScene");

      if (cancelled || !canvasRef.current) return;

      dispose = createParticleScene(canvasRef.current);
      setReady(true);
    });

    return () => {
      cancelled = true;
      cancelIdle(handle);
      dispose?.();
    };
  }, [enabled]);

  if (!enabled) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`
        pointer-events-none

        fixed
        inset-0

        -z-[1]

        h-full
        w-full

        transition-opacity
        duration-1000

        ${ready ? "opacity-100" : "opacity-0"}
      `}
    />,
    document.body,
  );
}

export default ScrollScene;
