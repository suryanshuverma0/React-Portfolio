import { Component, Suspense, lazy, useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

import NetworkFallback from "./NetworkFallback";

const NetworkCanvas = lazy(() => import("./NetworkCanvas"));

/*
  Decorative 3D network behind the hero portrait.

  The hero text and portrait render immediately; three.js is fetched only
  once the browser is idle, and the canvas fades in after its first frame.
  Anything that goes wrong — no WebGL, chunk fails to load, context lost —
  swaps in the static SVG version instead, so the hero never depends on 3D.
*/

const hasWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

    gl?.getExtension("WEBGL_lose_context")?.loseContext();

    return Boolean(gl);
  } catch {
    return false;
  }
};

class CanvasBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function HeroNetwork() {
  const reducedMotion = useReducedMotion();

  const [mode, setMode] = useState("idle"); // idle | webgl | fallback
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = () => setMode(hasWebGL() ? "webgl" : "fallback");

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(start, 300);
    return () => window.clearTimeout(id);
  }, []);

  const handleReady = useCallback(() => setReady(true), []);

  const handleError = useCallback((error) => {
    console.warn("Hero 3D unavailable, using static fallback.", error);
    setMode("fallback");
  }, []);

  return (
    <div
      aria-hidden="true"
      className="
        absolute
        left-1/2
        top-1/2

        -translate-x-1/2
        -translate-y-1/2

        -z-10

        h-[320px]
        w-[320px]

        md:h-[440px]
        md:w-[440px]

        pointer-events-none
        select-none

        [mask-image:radial-gradient(closest-side,#000_60%,transparent)]
      "
    >
      {mode === "fallback" && <NetworkFallback />}

      {mode === "webgl" && (
        <div
          className={`
            h-full
            w-full

            transition-opacity
            duration-700

            ${ready ? "opacity-100" : "opacity-0"}
          `}
        >
          <CanvasBoundary onError={handleError}>
            <Suspense fallback={null}>
              <NetworkCanvas
                reducedMotion={Boolean(reducedMotion)}
                onReady={handleReady}
                onError={handleError}
              />
            </Suspense>
          </CanvasBoundary>
        </div>
      )}
    </div>
  );
}

export default HeroNetwork;
