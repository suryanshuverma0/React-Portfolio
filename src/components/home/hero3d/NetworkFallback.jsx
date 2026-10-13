import { useMemo } from "react";

import { createNetwork, BASE_TILT_X, BASE_ROTATION_Y } from "./network";

/*
  Static SVG rendering of the same network, projected with the same camera
  as the WebGL scene, for browsers without WebGL or if the 3D chunk fails.
  Depth is faked with opacity so it still reads as a globe.
*/

const CAMERA_Z = 4.5;
const FOCAL = 1 / Math.tan((35 / 2) * (Math.PI / 180));

const project = ({ x, y, z }) => {
  const cosY = Math.cos(BASE_ROTATION_Y);
  const sinY = Math.sin(BASE_ROTATION_Y);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  const cosX = Math.cos(BASE_TILT_X);
  const sinX = Math.sin(BASE_TILT_X);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  const scale = FOCAL / (CAMERA_Z - z2);

  return { x: x1 * scale, y: -y2 * scale, depth: (z2 + 1) / 2 };
};

function NetworkFallback() {
  const { points, lines } = useMemo(() => {
    const { nodes, edges } = createNetwork();
    const projected = nodes.map((node) => ({ ...project(node), isBlock: node.isBlock }));

    return {
      points: projected,
      lines: edges.map(([a, b]) => [projected[a], projected[b]]),
    };
  }, []);

  return (
    <svg
      viewBox="-1 -1 2 2"
      className="h-full w-full text-primary"
      focusable="false"
    >
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke="currentColor"
          strokeWidth={0.004}
          strokeOpacity={0.06 + ((a.depth + b.depth) / 2) * 0.24}
        />
      ))}

      {points.map((point, i) =>
        point.isBlock ? (
          <rect
            key={i}
            x={point.x - 0.022}
            y={point.y - 0.022}
            width={0.044}
            height={0.044}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.005}
            strokeOpacity={0.2 + point.depth * 0.7}
          />
        ) : (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={0.011}
            fill="currentColor"
            fillOpacity={0.15 + point.depth * 0.7}
          />
        ),
      )}
    </svg>
  );
}

export default NetworkFallback;
