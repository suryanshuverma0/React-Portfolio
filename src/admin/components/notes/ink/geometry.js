import { getStroke } from "perfect-freehand";

/* ========================================
   Ink geometry — everything is in page
   units (the page is PAGE_WIDTH wide; the
   view scales it to the screen).
========================================= */

export const PAGE_WIDTH = 1000;
export const MIN_PAGE_HEIGHT = 1400;
export const LINE_SPACING = 32;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* ---------- strokes ---------- */

// Apple Pencil reports real pressure; mouse/finger report a constant, in
// which case perfect-freehand simulates pressure from speed instead.
const hasRealPressure = (points) => points.some((p) => p[2] !== points[0][2]) || points[0]?.[2] !== 0.5;

export const strokeOutline = (element) => {
  const isHighlighter = element.tool === "highlighter";
  return getStroke(element.points, {
    size: element.size,
    thinning: isHighlighter ? 0 : 0.6,
    smoothing: 0.5,
    streamline: isHighlighter ? 0.6 : 0.45,
    simulatePressure: !isHighlighter && !hasRealPressure(element.points),
    start: { cap: true },
    end: { cap: true },
    last: true,
  });
};

// Outline polygon → smooth closed SVG path (quadratic midpoints).
export const outlineToPath = (outline) => {
  if (!outline.length) return "";
  const d = outline.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0.toFixed(2), y0.toFixed(2), ((x0 + x1) / 2).toFixed(2), ((y0 + y1) / 2).toFixed(2));
      return acc;
    },
    ["M", ...outline[0].map((n) => n.toFixed(2)), "Q"],
  );
  d.push("Z");
  return d.join(" ");
};

// Drop points that add nothing and round for compact storage.
export const compactPoints = (points, minDistance = 0.6) => {
  const out = [];
  points.forEach((p) => {
    const last = out[out.length - 1];
    if (!last || dist(last, p) >= minDistance) {
      out.push([Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10, Math.round((p[2] ?? 0.5) * 100) / 100]);
    }
  });
  if (out.length === 1 && points.length > 1) {
    const p = points[points.length - 1];
    out.push([Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10, Math.round((p[2] ?? 0.5) * 100) / 100]);
  }
  return out;
};

/* ---------- bounds & transforms ---------- */

export const elementBounds = (el) => {
  if (el.type === "stroke") {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    el.points.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    const pad = el.size / 2;
    return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
  }
  if (el.type === "shape") {
    const pad = el.size / 2;
    return {
      minX: Math.min(el.x1, el.x2) - pad,
      minY: Math.min(el.y1, el.y2) - pad,
      maxX: Math.max(el.x1, el.x2) + pad,
      maxY: Math.max(el.y1, el.y2) + pad,
    };
  }
  return { minX: el.x, minY: el.y, maxX: el.x + el.w, maxY: el.y + el.h };
};

export const unionBounds = (elements) =>
  elements.reduce(
    (acc, el) => {
      const b = elementBounds(el);
      return {
        minX: Math.min(acc.minX, b.minX),
        minY: Math.min(acc.minY, b.minY),
        maxX: Math.max(acc.maxX, b.maxX),
        maxY: Math.max(acc.maxY, b.maxY),
      };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

export const translateElement = (el, dx, dy) => {
  if (el.type === "stroke") return { ...el, points: el.points.map(([x, y, p]) => [x + dx, y + dy, p]) };
  if (el.type === "shape") return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
  return { ...el, x: el.x + dx, y: el.y + dy };
};

// Scale around an origin (the selection's top-left corner).
export const scaleElement = (el, sx, sy, ox, oy) => {
  const fx = (x) => ox + (x - ox) * sx;
  const fy = (y) => oy + (y - oy) * sy;
  if (el.type === "stroke") return { ...el, points: el.points.map(([x, y, p]) => [fx(x), fy(y), p]) };
  if (el.type === "shape") return { ...el, x1: fx(el.x1), y1: fy(el.y1), x2: fx(el.x2), y2: fy(el.y2) };
  return { ...el, x: fx(el.x), y: fy(el.y), w: el.w * sx, h: el.h * sy };
};

/* ---------- hit testing ---------- */

const distToSegment = (p, a, b) => {
  const l2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
  if (l2 === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l2));
  return dist(p, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
};

export const hitsElement = (el, point, radius) => {
  const b = elementBounds(el);
  if (point[0] < b.minX - radius || point[0] > b.maxX + radius || point[1] < b.minY - radius || point[1] > b.maxY + radius) {
    return false;
  }

  if (el.type === "stroke") {
    const reach = radius + el.size / 2;
    if (el.points.length === 1) return dist(point, el.points[0]) <= reach;
    for (let i = 1; i < el.points.length; i += 1) {
      if (distToSegment(point, el.points[i - 1], el.points[i]) <= reach) return true;
    }
    return false;
  }

  if (el.type === "shape") {
    const reach = radius + el.size / 2;
    if (el.shape === "line") return distToSegment(point, [el.x1, el.y1], [el.x2, el.y2]) <= reach;
    if (el.shape === "rect") {
      const c = [
        [el.x1, el.y1],
        [el.x2, el.y1],
        [el.x2, el.y2],
        [el.x1, el.y2],
      ];
      return c.some((a, i) => distToSegment(point, a, c[(i + 1) % 4]) <= reach);
    }
    const cx = (el.x1 + el.x2) / 2;
    const cy = (el.y1 + el.y2) / 2;
    const rx = Math.abs(el.x2 - el.x1) / 2 || 1;
    const ry = Math.abs(el.y2 - el.y1) / 2 || 1;
    const k = Math.hypot((point[0] - cx) / rx, (point[1] - cy) / ry);
    return Math.abs(k - 1) * Math.min(rx, ry) <= reach;
  }

  return true; // image: inside its bounds
};

const pointInPolygon = ([x, y], polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// Lasso: a stroke counts when most of its points are inside; shapes and
// images when their centre is.
export const insideLasso = (el, polygon) => {
  if (polygon.length < 3) return false;
  if (el.type === "stroke") {
    const step = Math.max(1, Math.floor(el.points.length / 40));
    let inside = 0;
    let total = 0;
    for (let i = 0; i < el.points.length; i += step) {
      total += 1;
      if (pointInPolygon(el.points[i], polygon)) inside += 1;
    }
    return inside / total >= 0.6;
  }
  const b = elementBounds(el);
  return pointInPolygon([(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2], polygon);
};

/* ---------- shape recognition ---------- */

// Turns a rough stroke into a clean line, rectangle or ellipse, or returns
// null to keep it as freehand ink.
export const recognizeShape = (points) => {
  if (points.length < 4) return null;

  let length = 0;
  for (let i = 1; i < points.length; i += 1) length += dist(points[i - 1], points[i]);
  if (length < 24) return null;

  const start = points[0];
  const end = points[points.length - 1];

  // Straight enough → line.
  if (dist(start, end) / length > 0.9) {
    return { shape: "line", x1: start[0], y1: start[1], x2: end[0], y2: end[1] };
  }

  const b = points.reduce(
    (acc, [x, y]) => ({
      minX: Math.min(acc.minX, x),
      minY: Math.min(acc.minY, y),
      maxX: Math.max(acc.maxX, x),
      maxY: Math.max(acc.maxY, y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const diag = Math.hypot(w, h);
  if (w < 16 || h < 16) return null;

  // Must be (roughly) closed.
  if (dist(start, end) > diag * 0.3) return null;

  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  const rx = w / 2;
  const ry = h / 2;

  const ellipseError =
    points.reduce((sum, [x, y]) => sum + Math.abs(Math.hypot((x - cx) / rx, (y - cy) / ry) - 1), 0) / points.length;

  // Rectangles reach all four corners of their bounding box; ellipses don't.
  const corners = [
    [b.minX, b.minY],
    [b.maxX, b.minY],
    [b.maxX, b.maxY],
    [b.minX, b.maxY],
  ];
  const cornerReach = Math.max(...corners.map((c) => Math.min(...points.map((p) => dist(p, c))))) / diag;

  const edgeError =
    points.reduce(
      (sum, [x, y]) => sum + Math.min(x - b.minX, b.maxX - x, y - b.minY, b.maxY - y),
      0,
    ) /
    points.length /
    Math.min(rx, ry);

  if (cornerReach < 0.1 && edgeError < 0.25) {
    return { shape: "rect", x1: b.minX, y1: b.minY, x2: b.maxX, y2: b.maxY };
  }
  if (ellipseError < 0.22) {
    return { shape: "ellipse", x1: b.minX, y1: b.minY, x2: b.maxX, y2: b.maxY };
  }
  return null;
};

export const pageHeightFor = (elements) => {
  if (!elements.length) return MIN_PAGE_HEIGHT;
  const { maxY } = unionBounds(elements);
  return Math.max(MIN_PAGE_HEIGHT, Math.ceil((maxY + 800) / LINE_SPACING) * LINE_SPACING);
};
