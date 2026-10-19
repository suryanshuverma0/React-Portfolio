import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  PenLine,
  Highlighter,
  Eraser,
  Lasso,
  Shapes,
  ImagePlus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Hand,
  Trash2,
  Copy,
} from "lucide-react";

import { uploadImage } from "../../../services/upload.service";
import { InkElements, InkElement, PaperDefs, Paper } from "./InkCanvas";
import {
  PAGE_WIDTH,
  uid,
  compactPoints,
  unionBounds,
  translateElement,
  scaleElement,
  hitsElement,
  insideLasso,
  recognizeShape,
  pageHeightFor,
} from "./geometry";

/* ========================================
   INK EDITOR
   Apple Pencil (pointerType "pen") and the
   mouse draw; fingers scroll natively and
   two fingers pinch-zoom — palm rejection
   for free. "Draw with finger" flips that
   for devices without a stylus.
========================================= */

const PEN_COLORS = ["#111111", "#2a78d6", "#dc2626", "#059669", "#7c3aed", "#ea580c"];
const HIGHLIGHT_COLORS = ["#facc15", "#4ade80", "#60a5fa", "#f472b6", "#fb923c"];
const PAPERS = [
  ["lined", "Lined"],
  ["grid", "Grid"],
  ["dotted", "Dotted"],
  ["blank", "Blank"],
];
const MAX_HISTORY = 100;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

const TOOLS = [
  { id: "pen", icon: PenLine, label: "Pen" },
  { id: "highlighter", icon: Highlighter, label: "Highlighter" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
  { id: "lasso", icon: Lasso, label: "Lasso select" },
  { id: "shape", icon: Shapes, label: "Shape (draw roughly, it snaps)" },
];

// Round for compact storage.
const roundElement = (el) => {
  const r = (n) => Math.round(n * 10) / 10;
  if (el.type === "stroke") return { ...el, points: el.points.map(([x, y, p]) => [r(x), r(y), Math.round(p * 100) / 100]) };
  if (el.type === "shape") return { ...el, x1: r(el.x1), y1: r(el.y1), x2: r(el.x2), y2: r(el.y2) };
  return { ...el, x: r(el.x), y: r(el.y), w: r(el.w), h: r(el.h) };
};

const ToolButton = ({ active, onClick, label, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    aria-pressed={active}
    title={label}
    className={`h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl transition disabled:opacity-30 ${
      active ? "bg-primary text-background" : "hover:bg-surface"
    }`}
  >
    {children}
  </button>
);

function InkEditor({ initialInk, onChange }) {
  const patternId = useId().replace(/:/g, "");

  const [elements, setElements] = useState(() => initialInk?.elements || []);
  const [paper, setPaper] = useState(initialInk?.paper || "lined");
  const [tool, setTool] = useState("pen");
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0]);
  const [sizes, setSizes] = useState({ pen: 3, highlighter: 22, eraser: 14, shape: 3 });
  const [zoom, setZoom] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [fingerDraw, setFingerDraw] = useState(false);
  const [selection, setSelection] = useState([]);
  const [live, setLive] = useState(null); // in-progress stroke / lasso polygon
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false); // moving/scaling a selection

  const scrollRef = useRef(null);
  const svgRef = useRef(null);
  const fileRef = useRef(null);
  const elementsRef = useRef(elements);
  const past = useRef([]);
  const future = useRef([]);
  const gesture = useRef(null);
  const frame = useRef(0);
  const firstRender = useRef(true);

  const scale = baseScale * zoom;
  const pageHeight = useMemo(() => pageHeightFor(elements), [elements]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Report changes upward (rounded) — the parent debounces the autosave.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    onChange?.({ paper, elements: elements.map(roundElement) });
  }, [elements, paper, onChange]);

  // Fit the page width to the available space.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width - 24;
      setBaseScale(Math.max(0.3, Math.min(1.4, width / PAGE_WIDTH)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ---------- history ---------- */

  const syncHistory = () =>
    setHistoryState({ canUndo: past.current.length > 0, canRedo: future.current.length > 0 });

  const commit = useCallback((next, previous = elementsRef.current) => {
    past.current.push(previous);
    if (past.current.length > MAX_HISTORY) past.current.shift();
    future.current = [];
    elementsRef.current = next;
    setElements(next);
    syncHistory();
  }, []);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (!previous) return;
    future.current.push(elementsRef.current);
    elementsRef.current = previous;
    setElements(previous);
    setSelection([]);
    syncHistory();
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(elementsRef.current);
    elementsRef.current = next;
    setElements(next);
    setSelection([]);
    syncHistory();
  }, []);

  const deleteSelection = useCallback(() => {
    if (!selection.length) return;
    const ids = new Set(selection);
    commit(elementsRef.current.filter((el) => !ids.has(el.id)));
    setSelection([]);
  }, [selection, commit]);

  const duplicateSelection = () => {
    const ids = new Set(selection);
    const copies = elementsRef.current
      .filter((el) => ids.has(el.id))
      .map((el) => ({ ...translateElement(el, 24, 24), id: uid() }));
    commit([...elementsRef.current, ...copies]);
    setSelection(copies.map((c) => c.id));
  };

  const recolorSelection = (color) => {
    const ids = new Set(selection);
    commit(
      elementsRef.current.map((el) => (ids.has(el.id) && el.type !== "image" ? { ...el, color } : el)),
    );
  };

  // Keyboard shortcuts (ignored while typing in inputs).
  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      if (target.closest?.("input, textarea, [contenteditable='true']")) return;
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if ((event.key === "Delete" || event.key === "Backspace") && selection.length) {
        event.preventDefault();
        deleteSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deleteSelection, selection.length]);

  /* ---------- touch: stop the Pencil from scrolling, pinch to zoom ---------- */

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    let pinch = null;

    const onTouchStart = (event) => {
      if ([...event.touches].some((t) => t.touchType === "stylus")) event.preventDefault();
      if (event.touches.length === 2) {
        const [a, b] = event.touches;
        pinch = { distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom: null };
      }
    };
    const onTouchMove = (event) => {
      if ([...event.touches].some((t) => t.touchType === "stylus")) {
        event.preventDefault();
        return;
      }
      if (pinch && event.touches.length === 2) {
        event.preventDefault();
        const [a, b] = event.touches;
        const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        setZoom((z) => {
          const base = pinch.zoom ?? z;
          pinch.zoom = base;
          return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, base * (distance / pinch.distance)));
        });
      }
    };
    const onTouchEnd = (event) => {
      if (event.touches.length < 2) pinch = null;
    };
    const onWheel = (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (event.deltaY < 0 ? 1.1 : 0.9))));
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  /* ---------- pointer drawing ---------- */

  const toPage = (event) => {
    const rect = svgRef.current.getBoundingClientRect();
    return [(event.clientX - rect.left) / scale, (event.clientY - rect.top) / scale];
  };

  const pressureOf = (event) =>
    event.pointerType === "pen" ? Math.max(0.05, Math.min(1, event.pressure || 0.5)) : 0.5;

  const scheduleLive = (value) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setLive(value));
  };

  const selectionBounds = useMemo(() => {
    if (!selection.length) return null;
    const ids = new Set(selection);
    const chosen = elements.filter((el) => ids.has(el.id));
    return chosen.length ? unionBounds(chosen) : null;
  }, [selection, elements]);

  const eraseAt = (point) => {
    const radius = sizes.eraser / 2;
    const current = elementsRef.current;
    const next = current.filter((el) => el.type === "image" || !hitsElement(el, point, radius));
    if (next.length !== current.length) {
      elementsRef.current = next;
      setElements(next);
    }
  };

  const onPointerDown = (event) => {
    if (event.pointerType === "touch" && !fingerDraw) return; // let fingers scroll
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    try {
      svgRef.current.setPointerCapture(event.pointerId);
    } catch {
      /* capture is best-effort */
    }
    const point = toPage(event);

    if (tool === "eraser") {
      gesture.current = { type: "erase", before: elementsRef.current };
      eraseAt(point);
      return;
    }

    if (tool === "lasso") {
      const b = selectionBounds;
      if (b) {
        const handle = 16 / scale;
        const onHandle = Math.abs(point[0] - b.maxX) < handle && Math.abs(point[1] - b.maxY) < handle;
        const inside = point[0] >= b.minX && point[0] <= b.maxX && point[1] >= b.minY && point[1] <= b.maxY;
        if (onHandle || inside) {
          setDragging(true);
          gesture.current = {
            type: onHandle ? "scale" : "move",
            start: point,
            before: elementsRef.current,
            bounds: b,
            ids: new Set(selection),
          };
          return;
        }
      }
      setSelection([]);
      gesture.current = { type: "lasso", points: [point] };
      scheduleLive({ type: "lasso", points: [point] });
      return;
    }

    const color = tool === "highlighter" ? highlightColor : penColor;
    gesture.current = {
      type: "draw",
      points: [[...point, pressureOf(event)]],
      color,
      size: sizes[tool],
      tool: tool === "highlighter" ? "highlighter" : "pen",
    };
    scheduleLive({ type: "stroke", el: { id: "live", type: "stroke", tool: gesture.current.tool, color, size: sizes[tool], points: gesture.current.points } });
  };

  const onPointerMove = (event) => {
    const g = gesture.current;
    if (!g) return;
    // Coalesced events give the Pencil's full 240Hz detail; some browsers
    // return an empty list, so fall back to the event itself.
    const coalesced = event.nativeEvent.getCoalescedEvents?.();
    const events = coalesced?.length ? coalesced : [event.nativeEvent];

    if (g.type === "erase") {
      events.forEach((e) => eraseAt(toPage(e)));
      return;
    }

    if (g.type === "lasso") {
      events.forEach((e) => g.points.push(toPage(e)));
      scheduleLive({ type: "lasso", points: [...g.points] });
      return;
    }

    if (g.type === "move" || g.type === "scale") {
      const point = toPage(event);
      const { bounds, ids, before, start } = g;
      let next;
      if (g.type === "move") {
        const dx = point[0] - start[0];
        const dy = point[1] - start[1];
        next = before.map((el) => (ids.has(el.id) ? translateElement(el, dx, dy) : el));
      } else {
        const w = Math.max(1, bounds.maxX - bounds.minX);
        const h = Math.max(1, bounds.maxY - bounds.minY);
        const s = Math.max(0.1, Math.min((point[0] - bounds.minX) / w, (point[1] - bounds.minY) / h));
        next = before.map((el) => (ids.has(el.id) ? scaleElement(el, s, s, bounds.minX, bounds.minY) : el));
      }
      elementsRef.current = next;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => setElements(next));
      return;
    }

    events.forEach((e) => g.points.push([...toPage(e), pressureOf(e)]));
    scheduleLive({ type: "stroke", el: { id: "live", type: "stroke", tool: g.tool, color: g.color, size: g.size, points: [...g.points] } });
  };

  const onPointerUp = () => {
    const g = gesture.current;
    gesture.current = null;
    cancelAnimationFrame(frame.current);
    setLive(null);
    if (!g) return;

    if (g.type === "erase") {
      if (elementsRef.current !== g.before) commit(elementsRef.current, g.before);
      return;
    }

    if (g.type === "move" || g.type === "scale") {
      setDragging(false);
      setElements(elementsRef.current);
      if (elementsRef.current !== g.before) commit(elementsRef.current, g.before);
      return;
    }

    if (g.type === "lasso") {
      const chosen = elementsRef.current.filter((el) => insideLasso(el, g.points)).map((el) => el.id);
      setSelection(chosen);
      return;
    }

    const points = compactPoints(g.points);
    if (!points.length) return;

    if (tool === "shape") {
      const shape = recognizeShape(points);
      if (shape) {
        commit([...elementsRef.current, { id: uid(), type: "shape", color: g.color, size: g.size, ...shape }]);
        return;
      }
    }

    commit([...elementsRef.current, { id: uid(), type: "stroke", tool: g.tool, color: g.color, size: g.size, points }]);
  };

  /* ---------- images ---------- */

  const insertImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setUploading(true);
      const { url } = await uploadImage(file, "notes");
      const natural = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 800, h: 600 });
        img.src = url;
      });
      const w = Math.min(600, natural.w);
      const h = (natural.h / natural.w) * w;
      const top = (scrollRef.current?.scrollTop || 0) / scale + 60;
      const image = { id: uid(), type: "image", url, x: (PAGE_WIDTH - w) / 2, y: top, w, h };
      commit([...elementsRef.current, image]);
      setTool("lasso");
      setSelection([image.id]);
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ---------- render ---------- */

  const cursor = { pen: "crosshair", highlighter: "crosshair", shape: "crosshair", eraser: "cell", lasso: "default" }[tool];
  const activeColors = tool === "highlighter" ? HIGHLIGHT_COLORS : PEN_COLORS;
  const activeColor = tool === "highlighter" ? highlightColor : penColor;
  const sizeKey = tool === "lasso" ? null : tool;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-background/95 px-3 py-2 backdrop-blur">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <ToolButton
            key={id}
            label={label}
            active={tool === id}
            onClick={() => {
              setTool(id);
              if (id !== "lasso") setSelection([]);
            }}
          >
            <Icon size={18} />
          </ToolButton>
        ))}
        <ToolButton label="Insert image" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <ImagePlus size={18} />
        </ToolButton>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={insertImage} />

        <span className="mx-1 h-6 w-px bg-border" />

        {tool !== "eraser" && tool !== "lasso" &&
          activeColors.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Colour ${color}`}
              aria-pressed={activeColor === color}
              onClick={() => (tool === "highlighter" ? setHighlightColor(color) : setPenColor(color))}
              className={`h-7 w-7 shrink-0 rounded-full border-2 transition ${
                activeColor === color ? "border-primary scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}

        {sizeKey && (
          <label className="ml-1 inline-flex items-center gap-2 text-xs text-muted">
            Size
            <input
              type="range"
              min={sizeKey === "highlighter" ? 8 : sizeKey === "eraser" ? 6 : 1}
              max={sizeKey === "highlighter" ? 48 : sizeKey === "eraser" ? 60 : 16}
              step="1"
              value={sizes[sizeKey]}
              onChange={(e) => setSizes((s) => ({ ...s, [sizeKey]: Number(e.target.value) }))}
              className="w-20"
            />
          </label>
        )}

        <span className="ml-auto" />

        <ToolButton label="Undo" onClick={undo} disabled={!historyState.canUndo}>
          <Undo2 size={18} />
        </ToolButton>
        <ToolButton label="Redo" onClick={redo} disabled={!historyState.canRedo}>
          <Redo2 size={18} />
        </ToolButton>

        <span className="mx-1 h-6 w-px bg-border" />

        <ToolButton label="Zoom out" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))}>
          <ZoomOut size={18} />
        </ToolButton>
        <button type="button" onClick={() => setZoom(1)} className="w-12 text-xs tabular-nums text-muted" title="Reset zoom">
          {Math.round(zoom * 100)}%
        </button>
        <ToolButton label="Zoom in" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))}>
          <ZoomIn size={18} />
        </ToolButton>

        <ToolButton label={fingerDraw ? "Finger draws (tap to scroll with finger)" : "Finger scrolls (tap to draw with finger)"} active={fingerDraw} onClick={() => setFingerDraw((v) => !v)}>
          <Hand size={18} />
        </ToolButton>

        <select
          value={paper}
          onChange={(e) => setPaper(e.target.value)}
          className="h-9 rounded-xl border border-border bg-surface px-2 text-xs"
          aria-label="Paper"
        >
          {PAPERS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* page */}
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto bg-surface/60 p-3" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="relative mx-auto" style={{ width: PAGE_WIDTH * scale, height: pageHeight * scale }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${PAGE_WIDTH} ${pageHeight}`}
            width={PAGE_WIDTH * scale}
            height={pageHeight * scale}
            className="block rounded-lg shadow-md"
            style={{
              touchAction: fingerDraw ? "none" : "pan-x pan-y",
              cursor,
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <PaperDefs id={patternId} />
            <Paper id={patternId} paper={paper} height={pageHeight} />
            <InkElements elements={elements} />

            {live?.type === "stroke" && <InkElement el={live.el} />}
            {live?.type === "lasso" && live.points.length > 1 && (
              <polyline
                points={live.points.map((p) => p.join(",")).join(" ")}
                fill="rgba(42,120,214,0.08)"
                stroke="#2a78d6"
                strokeWidth={1.5 / scale}
                strokeDasharray={`${6 / scale} ${4 / scale}`}
              />
            )}

            {selectionBounds && (
              <g pointerEvents="none">
                <rect
                  x={selectionBounds.minX - 6}
                  y={selectionBounds.minY - 6}
                  width={selectionBounds.maxX - selectionBounds.minX + 12}
                  height={selectionBounds.maxY - selectionBounds.minY + 12}
                  fill="rgba(42,120,214,0.05)"
                  stroke="#2a78d6"
                  strokeWidth={1.5 / scale}
                  strokeDasharray={`${6 / scale} ${4 / scale}`}
                  rx={4}
                />
                <circle cx={selectionBounds.maxX} cy={selectionBounds.maxY} r={9 / scale} fill="#fff" stroke="#2a78d6" strokeWidth={2 / scale} />
              </g>
            )}
          </svg>

          {/* floating selection toolbar */}
          {selectionBounds && !dragging && (
            <div
              className="absolute z-10 flex items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-lg"
              style={{
                left: Math.max(0, selectionBounds.minX * scale),
                top: Math.max(0, selectionBounds.minY * scale - 52),
              }}
            >
              {PEN_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Recolour ${color}`}
                  onClick={() => recolorSelection(color)}
                  className="h-6 w-6 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
              <span className="mx-1 h-5 w-px bg-border" />
              <ToolButton label="Duplicate" onClick={duplicateSelection}>
                <Copy size={16} />
              </ToolButton>
              <ToolButton label="Delete" onClick={deleteSelection}>
                <Trash2 size={16} />
              </ToolButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InkEditor;
