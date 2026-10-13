/*
  Procedural node network shared by the WebGL scene and the static SVG
  fallback. Kept free of three.js imports so the fallback never pulls the
  3D bundle in.

  Nodes sit on a slightly irregular sphere (Fibonacci distribution plus a
  seeded jitter, so it reads as organic but renders identically on every
  load), each linked to its nearest neighbours. A handful of nodes are
  flagged as "blocks" and drawn as cubes — a quiet nod to blockchain
  without spelling it out.
*/

const NODE_COUNT = 84;
const NEIGHBOURS = 3;
const BLOCK_EVERY = 12;

// Small deterministic PRNG (mulberry32) — same network on every render.
const createRandom = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const createNetwork = () => {
  const random = createRandom(20260101);
  const golden = Math.PI * (3 - Math.sqrt(5));

  const nodes = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = golden * i + (random() - 0.5) * 0.5;
    const radius = 0.92 + random() * 0.14;

    nodes.push({
      x: Math.cos(theta) * ring * radius,
      y: y * radius,
      z: Math.sin(theta) * ring * radius,
      isBlock: i % BLOCK_EVERY === 5,
    });
  }

  const edgeKeys = new Set();
  const edges = [];

  nodes.forEach((node, i) => {
    const nearest = nodes
      .map((other, j) => ({
        j,
        d: (node.x - other.x) ** 2 + (node.y - other.y) ** 2 + (node.z - other.z) ** 2,
      }))
      .filter(({ j }) => j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, NEIGHBOURS);

    nearest.forEach(({ j }) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;

      if (!edgeKeys.has(key)) {
        edgeKeys.add(key);
        edges.push([Math.min(i, j), Math.max(i, j)]);
      }
    });
  });

  const adjacency = nodes.map(() => []);

  edges.forEach(([a, b]) => {
    adjacency[a].push(b);
    adjacency[b].push(a);
  });

  return { nodes, edges, adjacency };
};

// Resting orientation used by both renderers so the fallback matches the
// first WebGL frame.
export const BASE_TILT_X = 0.38;
export const BASE_ROTATION_Y = 0.6;
