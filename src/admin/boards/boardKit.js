/* ========================================
   BOARD KIT — sticky-note colours and the
   starter templates, written as Excalidraw
   "element skeletons" (turned into real
   elements with convertToExcalidrawElements).
========================================= */

export const STICKY_COLORS = [
  { name: "Lemon", fill: "#ffe680", stroke: "#e0b400" },
  { name: "Peach", fill: "#ffc8a8", stroke: "#e07b45" },
  { name: "Rose", fill: "#ffb3c7", stroke: "#d6517a" },
  { name: "Lilac", fill: "#d9c8ff", stroke: "#8a63e8" },
  { name: "Sky", fill: "#b8e2ff", stroke: "#3a95d9" },
  { name: "Mint", fill: "#bff0d4", stroke: "#2fa86b" },
];

let seq = 0;
export const uid = (p = "el") => `${p}-${Date.now().toString(36)}-${(seq += 1)}`;

export const sticky = ({ x, y, text = "", color = STICKY_COLORS[0], size = 200, id = uid("sticky") }) => ({
  id,
  type: "rectangle",
  x,
  y,
  width: size,
  height: size,
  backgroundColor: color.fill,
  strokeColor: color.stroke,
  fillStyle: "solid",
  strokeWidth: 1,
  roughness: 0,
  roundness: { type: 3 },
  label: { text, fontSize: 20, fontFamily: 5, strokeColor: "#1e1e1e" },
  customData: { sticky: true },
});

const box = (x, y, w, h, text, extra = {}) => ({
  id: extra.id || uid("box"),
  type: extra.type || "rectangle",
  x,
  y,
  width: w,
  height: h,
  strokeColor: extra.stroke || "#1e1e1e",
  backgroundColor: extra.fill || "transparent",
  fillStyle: "solid",
  strokeWidth: extra.strokeWidth || 2,
  roughness: extra.roughness ?? 1,
  roundness: extra.type === "diamond" ? null : { type: 3 },
  ...(text ? { label: { text, fontSize: extra.fontSize || 20, fontFamily: 5 } } : {}),
});

const title = (x, y, text, fontSize = 40) => ({ type: "text", x, y, text, fontSize, fontFamily: 5, strokeColor: "#1e1e1e" });
// Arrow from the edge of one shape to the edge of another (Excalidraw
// doesn't route skeleton arrows that only name their ends).
const edgePoint = (el, dx, dy, gap = 10) => {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const t = Math.min(el.width / 2 / (Math.abs(ux) || 1e-9), el.height / 2 / (Math.abs(uy) || 1e-9));
  return [cx + ux * (t + gap), cy + uy * (t + gap)];
};
const arrow = (from, to, label) => {
  const dx = to.x + to.width / 2 - (from.x + from.width / 2);
  const dy = to.y + to.height / 2 - (from.y + from.height / 2);
  const [sx, sy] = edgePoint(from, dx, dy);
  const [ex, ey] = edgePoint(to, -dx, -dy);
  return {
    type: "arrow",
    x: sx,
    y: sy,
    width: Math.abs(ex - sx),
    height: Math.abs(ey - sy),
    points: [
      [0, 0],
      [ex - sx, ey - sy],
    ],
    start: { id: from.id },
    end: { id: to.id },
    strokeWidth: 2,
    ...(label ? { label: { text: label, fontSize: 16 } } : {}),
  };
};
const column = (x, y, w, h, heading, fill) => [box(x, y, w, h, "", { fill, stroke: "#c9c9c9", strokeWidth: 1, roughness: 0 }), title(x + 20, y + 16, heading, 26)];

export const TEMPLATES = [
  {
    id: "blank",
    kind: "blank",
    label: "Blank canvas",
    emoji: "✏️",
    hint: "Draw, write, paste anything",
    build: () => [],
  },
  {
    id: "brainstorm",
    kind: "brainstorm",
    label: "Brainstorm",
    emoji: "🧠",
    hint: "One idea in the middle, thoughts around it",
    build: () => {
      const center = uid("center");
      const ideas = ["Why it matters", "Who it's for", "Wild idea", "Quick win", "Risks", "Next step"];
      const r = 360;
      const notes = ideas.map((t, i) => {
        const a = (i / ideas.length) * Math.PI * 2 - Math.PI / 2;
        return sticky({ x: Math.cos(a) * r - 100, y: Math.sin(a) * r - 100, text: t, color: STICKY_COLORS[i % STICKY_COLORS.length] });
      });
      const hub = box(-150, -70, 300, 140, "Main idea", { id: center, type: "ellipse", fill: "#ffffff", fontSize: 28 });
      return [hub, ...notes, ...notes.map((n) => arrow(hub, n))];
    },
  },
  {
    id: "flow",
    kind: "flow",
    label: "Flowchart",
    emoji: "🔀",
    hint: "Start → steps → decision → end",
    build: () => {
      const s = box(-100, -300, 200, 80, "Start", { type: "ellipse", fill: "#bff0d4" });
      const a = box(-120, -160, 240, 90, "Do something", { fill: "#b8e2ff" });
      const d = box(-130, -20, 260, 160, "Is it OK?", { type: "diamond", fill: "#ffe680" });
      const y = box(-420, 220, 240, 90, "Carry on", { fill: "#b8e2ff" });
      const n = box(180, 220, 240, 90, "Fix it", { fill: "#ffc8a8" });
      const e = box(-100, 400, 200, 80, "End", { type: "ellipse", fill: "#bff0d4" });
      return [s, a, d, y, n, e, arrow(s, a), arrow(a, d), arrow(d, y, "Yes"), arrow(d, n, "No"), arrow(n, a), arrow(y, e)];
    },
  },
  {
    id: "vision",
    kind: "vision",
    label: "Vision board",
    emoji: "🌅",
    hint: "Life areas with goals — paste photos that inspire you",
    build: () => {
      const areas = [
        ["Health", "🏃 Run a half marathon"],
        ["Career", "🚀 Ship my own product"],
        ["Money", "💰 Emergency fund: 6 months"],
        ["Relationships", "❤️ Weekly family call"],
        ["Growth", "📚 24 books this year"],
        ["Fun & travel", "✈️ Visit 3 new places"],
      ];
      const out = [title(-520, -470, `My ${new Date().getFullYear()} vision`, 56)];
      areas.forEach(([name, goal], i) => {
        const x = -520 + (i % 3) * 360;
        const y = -360 + Math.floor(i / 3) * 380;
        out.push(...column(x, y, 330, 350, name, "#fafafa"));
        out.push(sticky({ x: x + 40, y: y + 80, text: goal, color: STICKY_COLORS[i % STICKY_COLORS.length], size: 250 }));
      });
      return out;
    },
  },
  {
    id: "kanban",
    kind: "meeting",
    label: "Kanban",
    emoji: "📋",
    hint: "To do · Doing · Done",
    build: () => {
      const cols = [
        ["To do", "#fff7d6"],
        ["Doing", "#e6f4ff"],
        ["Done", "#e8f9ef"],
      ];
      const out = [];
      cols.forEach(([name, fill], i) => {
        const x = -540 + i * 370;
        out.push(...column(x, -340, 340, 700, name, fill));
        out.push(sticky({ x: x + 50, y: -260, text: i === 0 ? "New task" : i === 1 ? "In progress" : "Finished 🎉", color: STICKY_COLORS[[0, 4, 5][i]], size: 240 }));
      });
      return out;
    },
  },
  {
    id: "swot",
    kind: "decision",
    label: "SWOT",
    emoji: "🧭",
    hint: "Strengths, weaknesses, opportunities, threats",
    build: () => {
      const q = [
        ["Strengths", "#e8f9ef", 5],
        ["Weaknesses", "#fff0e8", 1],
        ["Opportunities", "#e6f4ff", 4],
        ["Threats", "#ffeef3", 2],
      ];
      const out = [];
      q.forEach(([name, fill, c], i) => {
        const x = -460 + (i % 2) * 470;
        const y = -400 + Math.floor(i / 2) * 420;
        out.push(...column(x, y, 450, 400, name, fill));
        out.push(sticky({ x: x + 40, y: y + 80, text: "…", color: STICKY_COLORS[c], size: 170 }));
      });
      return out;
    },
  },
  {
    id: "retro",
    kind: "meeting",
    label: "Retrospective",
    emoji: "🔁",
    hint: "Went well · To improve · Actions",
    build: () => {
      const cols = [
        ["😀 Went well", 5],
        ["🤔 To improve", 1],
        ["✅ Actions", 4],
      ];
      const out = [];
      cols.forEach(([name, c], i) => {
        const x = -540 + i * 370;
        out.push(...column(x, -340, 340, 640, name, "#fafafa"));
        out.push(sticky({ x: x + 50, y: -250, text: "", color: STICKY_COLORS[c], size: 240 }));
      });
      return out;
    },
  },
  {
    id: "decision",
    kind: "decision",
    label: "Decision matrix",
    emoji: "⚖️",
    hint: "Options × criteria, score and decide",
    build: () => {
      const crit = ["Impact", "Effort", "Cost", "Risk", "Total"];
      const opts = ["Option A", "Option B", "Option C"];
      const out = [title(-480, -360, "Decision: …", 40)];
      crit.forEach((c, i) => out.push(box(-280 + i * 170, -260, 160, 70, c, { fill: "#f2f2f2", roughness: 0, strokeWidth: 1, fontSize: 18 })));
      opts.forEach((o, r) => {
        out.push(box(-480, -180 + r * 90, 190, 80, o, { fill: STICKY_COLORS[r + 3].fill, roughness: 0, strokeWidth: 1, fontSize: 18 }));
        crit.forEach((_, i) => out.push(box(-280 + i * 170, -180 + r * 90, 160, 80, i === crit.length - 1 ? "=" : "1–5", { roughness: 0, strokeWidth: 1, fontSize: 18 })));
      });
      return out;
    },
  },
];

export const TEMPLATE = new Map(TEMPLATES.map((t) => [t.id, t]));
