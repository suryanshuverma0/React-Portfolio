import { memo, useId } from "react";
import {
  PAGE_WIDTH,
  LINE_SPACING,
  strokeOutline,
  outlineToPath,
  unionBounds,
} from "./geometry";

/* ========================================
   Pure SVG rendering of a page of ink —
   shared by the editor and read-only
   previews (version history). Paper is
   always light, like a real notebook.
========================================= */

export const PAPER_COLOR = "#fdfdfb";

// Elements are immutable, so a path can be cached per element object.
const pathCache = new WeakMap();
const pathFor = (el) => {
  let d = pathCache.get(el);
  if (!d) {
    d = outlineToPath(strokeOutline(el));
    pathCache.set(el, d);
  }
  return d;
};

export function InkElement({ el }) {
  if (el.type === "stroke") {
    const highlighter = el.tool === "highlighter";
    return (
      <path
        d={pathFor(el)}
        fill={el.color}
        fillOpacity={highlighter ? 0.38 : 1}
        style={highlighter ? { mixBlendMode: "multiply" } : undefined}
      />
    );
  }

  if (el.type === "shape") {
    const common = {
      stroke: el.color,
      strokeWidth: el.size,
      fill: "none",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    };
    if (el.shape === "line") return <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} {...common} />;
    const x = Math.min(el.x1, el.x2);
    const y = Math.min(el.y1, el.y2);
    const w = Math.abs(el.x2 - el.x1);
    const h = Math.abs(el.y2 - el.y1);
    if (el.shape === "rect") return <rect x={x} y={y} width={w} height={h} rx={2} {...common} />;
    return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...common} />;
  }

  return <image href={el.url} x={el.x} y={el.y} width={el.w} height={el.h} preserveAspectRatio="none" />;
}

export const InkElements = memo(function InkElements({ elements }) {
  return (
    <g>
      {elements.map((el) => (
        <InkElement key={el.id} el={el} />
      ))}
    </g>
  );
});

export function PaperDefs({ id }) {
  const s = LINE_SPACING;
  return (
    <defs>
      <pattern id={`${id}-lined`} width={PAGE_WIDTH} height={s} patternUnits="userSpaceOnUse">
        <line x1="0" y1={s - 0.5} x2={PAGE_WIDTH} y2={s - 0.5} stroke="#c7d7ee" strokeWidth="1" />
      </pattern>
      <pattern id={`${id}-grid`} width={s} height={s} patternUnits="userSpaceOnUse">
        <path d={`M ${s} 0 L 0 0 0 ${s}`} fill="none" stroke="#dbe3ee" strokeWidth="1" />
      </pattern>
      <pattern id={`${id}-dotted`} width={s} height={s} patternUnits="userSpaceOnUse">
        <circle cx={s / 2} cy={s / 2} r="1.4" fill="#b8c2cf" />
      </pattern>
    </defs>
  );
}

export function Paper({ id, paper, height }) {
  return (
    <>
      <rect x="0" y="0" width={PAGE_WIDTH} height={height} fill={PAPER_COLOR} />
      {paper !== "blank" && <rect x="0" y="0" width={PAGE_WIDTH} height={height} fill={`url(#${id}-${paper})`} />}
      {paper === "lined" && <line x1="72" y1="0" x2="72" y2={height} stroke="#f2b8b8" strokeWidth="1.2" />}
    </>
  );
}

// Read-only thumbnail / preview of a page.
export function InkPreview({ ink, maxHeight = 600 }) {
  const id = useId().replace(/:/g, "");
  const elements = ink?.elements || [];
  const height = elements.length ? Math.max(400, unionBounds(elements).maxY + 80) : 400;

  return (
    <svg viewBox={`0 0 ${PAGE_WIDTH} ${height}`} className="w-full rounded-xl border border-border" style={{ maxHeight }}>
      <PaperDefs id={id} />
      <Paper id={id} paper={ink?.paper || "lined"} height={height} />
      <InkElements elements={elements} />
    </svg>
  );
}
