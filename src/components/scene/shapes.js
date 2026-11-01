/*
  Point-cloud shapes for the scroll scene. Every builder returns `count`
  xyz triples so the shader can blend any two shapes point-for-point.

    sphere  — hero: a calm, slowly turning globe
    blocks  — research: three linked cubes, one per smart contract in the
              paper (UserRegistry → BatchRegistry → ProductRegistry)
    wave    — work: a flowing surface
    ring    — contact: an open halo
*/

const TAU = Math.PI * 2;

// Deterministic PRNG so the shapes are identical on every load.
const random = (seed) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const sphere = (count, radius = 2.5) => {
  const out = new Float32Array(count * 3);
  const rand = random(1);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i += 1) {
    // Fibonacci lattice gives an even shell; a little radial jitter adds depth.
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const jitter = radius * (0.96 + rand() * 0.08);

    out[i * 3] = Math.cos(theta) * r * jitter;
    out[i * 3 + 1] = y * jitter;
    out[i * 3 + 2] = Math.sin(theta) * r * jitter;
  }

  return out;
};

export const blocks = (count, size = 1.45, gap = 2.55) => {
  const out = new Float32Array(count * 3);
  const rand = random(2);
  const half = size / 2;
  const centers = [-gap, 0, gap];

  // 12 cube edges as start/end corners in unit space.
  const corners = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ];
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];

  for (let i = 0; i < count; i += 1) {
    const roll = rand();
    let x;
    let y;
    let z;

    if (roll < 0.08) {
      // Links between the blocks — the "chain".
      const link = rand() < 0.5 ? 0 : 1;
      const t = rand();
      x = centers[link] + half + t * (gap - size);
      y = (rand() - 0.5) * 0.04;
      z = (rand() - 0.5) * 0.04;
    } else {
      const cx = centers[Math.floor(rand() * 3)];

      if (roll < 0.62) {
        // Crisp edges carry most of the points so the cubes read clearly.
        const [a, b] = edges[Math.floor(rand() * edges.length)];
        const t = rand();
        x = (corners[a][0] + (corners[b][0] - corners[a][0]) * t) * half;
        y = (corners[a][1] + (corners[b][1] - corners[a][1]) * t) * half;
        z = (corners[a][2] + (corners[b][2] - corners[a][2]) * t) * half;
      } else {
        // Faint fill on the faces.
        const face = Math.floor(rand() * 6);
        const p = [
          (rand() * 2 - 1) * half,
          (rand() * 2 - 1) * half,
          (rand() * 2 - 1) * half,
        ];
        p[face % 3] = (face < 3 ? 1 : -1) * half;
        [x, y, z] = p;
      }

      x += cx;
    }

    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }

  return out;
};

export const wave = (count, width = 9, depth = 5) => {
  const out = new Float32Array(count * 3);
  const columns = Math.ceil(Math.sqrt(count * (width / depth)));
  const rows = Math.ceil(count / columns);

  for (let i = 0; i < count; i += 1) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = (col / (columns - 1) - 0.5) * width;
    const z = (row / Math.max(rows - 1, 1) - 0.5) * depth;

    // Static base relief; the shader adds the moving swell on top.
    out[i * 3] = x;
    out[i * 3 + 1] = Math.sin(x * 0.7) * 0.35 + Math.cos(z * 1.1) * 0.2 - 0.6;
    out[i * 3 + 2] = z;
  }

  return out;
};

export const ring = (count, radius = 2.4, tube = 0.55) => {
  const out = new Float32Array(count * 3);
  const rand = random(4);

  for (let i = 0; i < count; i += 1) {
    const u = rand() * TAU;
    const v = rand() * TAU;
    // Bias toward the outer rim so the halo has a bright edge.
    const t = tube * Math.sqrt(rand());

    out[i * 3] = (radius + t * Math.cos(v)) * Math.cos(u);
    out[i * 3 + 1] = t * Math.sin(v);
    out[i * 3 + 2] = (radius + t * Math.cos(v)) * Math.sin(u);
  }

  return out;
};

export const randoms = (count) => {
  const out = new Float32Array(count);
  const rand = random(5);

  for (let i = 0; i < count; i += 1) out[i] = rand();

  return out;
};
