import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Excalidraw, MainMenu, exportToBlob, exportToSvg, convertToExcalidrawElements, serializeAsJSON, CaptureUpdateAction } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import {
  ArrowLeft, Check, Loader2, StickyNote, LayoutTemplate, Download, PanelRight, X, Gavel, ListChecks, CalendarDays, NotebookPen, Link2,
  CircleDot, CircleCheck, CircleX, CirclePause, Trash2, CalendarPlus, Search, Moon, Sun,
} from "lucide-react";

import api from "../../lib/axios";
import LifeGate from "../life/LifeGate";
import { plannerApi } from "../planner/api";
import { today } from "../planner/dates";
import { STICKY_COLORS, TEMPLATES, TEMPLATE, sticky, uid } from "../boards/boardKit";

/* ========================================
   BOARD EDITOR — Excalidraw canvas (pen /
   Apple Pencil, shapes, arrows, text, paste
   images and text from anywhere) with:
   - one-tap coloured sticky notes
   - templates (brainstorm, flow, vision …)
   - meeting side panel: agenda, decisions
     with status, action items → Planner,
     linked notes (or a note as a sticky)
   - autosave, export PNG / SVG / PDF / JSON
========================================= */

// Fonts are self-hosted (public/excalidraw) — no third-party CDN.
if (typeof window !== "undefined") window.EXCALIDRAW_ASSET_PATH = "/excalidraw/";

const data = (r) => r.data.data;
const fail = (e, m) => e?.response?.status !== 423 && toast.error(e?.response?.data?.message || m);
// The canvas stays "paper" (light) by default so sticky-note colours stay
// true — Excalidraw's dark mode inverts them. Toggle per device.
const canvasTheme = () => {
  try {
    return localStorage.getItem("boards:canvas-theme") || "light";
  } catch {
    return "light";
  }
};
const versionOf = (els) => els.reduce((s, e) => s + e.version, 0) + els.length;
const blobToDataUrl = (blob) =>
  new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(blob);
  });
const download = (name, blob) => {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "board";

const STATUS = {
  proposed: { icon: CircleDot, label: "Proposed", cls: "text-[var(--color-chart-1)]" },
  approved: { icon: CircleCheck, label: "Approved", cls: "text-emerald-500" },
  rejected: { icon: CircleX, label: "Rejected", cls: "text-red-500" },
  parked: { icon: CirclePause, label: "Parked", cls: "text-muted" },
};
const NEXT_STATUS = { proposed: "approved", approved: "rejected", rejected: "parked", parked: "proposed" };

/* ---------- side panel ---------- */

function SidePanel({ board, setBoard, onClose, addStickyText }) {
  const [tab, setTab] = useState("meeting");
  const [text, setText] = useState("");
  const [noteQuery, setNoteQuery] = useState("");
  const [notes, setNotes] = useState([]);
  const input = "h-9 w-full rounded-xl border border-border bg-surface px-3 text-small outline-none focus:border-primary";
  const set = (patch) => setBoard((b) => ({ ...b, ...patch }));
  const meeting = { date: "", attendees: [], agenda: [], notes: "", ...board.meeting };

  useEffect(() => {
    if (tab !== "notes") return undefined;
    const id = setTimeout(() => {
      api
        .get("/notes/search", { params: noteQuery ? { q: noteQuery } : {} })
        .then((r) => setNotes(data(r) || []))
        .catch(() => setNotes([]));
    }, 250);
    return () => clearTimeout(id);
  }, [tab, noteQuery]);

  const toPlanner = async (a) => {
    try {
      const task = await plannerApi.createTask({ title: a.text, scope: "day", period: a.due || today(), area: board.title.slice(0, 40), notes: `From board “${board.title}”${a.owner ? ` · owner: ${a.owner}` : ""}` });
      set({ actions: board.actions.map((x) => (x.id === a.id ? { ...x, taskId: task._id } : x)) });
      toast.success("Added to your planner");
    } catch (e) {
      fail(e, "Couldn't add to the planner");
    }
  };

  const tabs = [
    ["meeting", "Meeting", CalendarDays],
    ["decisions", "Decisions", Gavel, board.decisions.length],
    ["actions", "Actions", ListChecks, board.actions.filter((a) => !a.done).length],
    ["notes", "Notes", NotebookPen, board.linkedNotes.length],
  ];

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-[var(--color-card)] sm:w-[340px]">
      <div className="flex items-center gap-1 border-b border-border p-2">
        {tabs.map(([id, label, Icon, n]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] ${tab === id ? "bg-surface font-medium text-primary" : "text-muted"}`}>
            <Icon size={15} />
            <span>
              {label}
              {n ? ` · ${n}` : ""}
            </span>
          </button>
        ))}
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Close panel">
          <X size={15} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {tab === "meeting" && (
          <>
            <input type="date" className={input} value={meeting.date} onChange={(e) => set({ meeting: { ...meeting, date: e.target.value } })} />
            <input
              className={input}
              defaultValue={meeting.attendees.join(", ")}
              onBlur={(e) => set({ meeting: { ...meeting, attendees: e.target.value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50) } })}
              placeholder="Attendees, comma separated"
            />
            <div>
              <p className="mb-1.5 text-[12px] font-semibold">Agenda</p>
              {meeting.agenda.map((a, i) => (
                <label key={i} className="flex items-center gap-2 py-1 text-small">
                  <input type="checkbox" checked={a.done} onChange={() => set({ meeting: { ...meeting, agenda: meeting.agenda.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) } })} />
                  <span className={`flex-1 ${a.done ? "text-muted line-through" : ""}`}>{a.text}</span>
                  <button type="button" onClick={() => set({ meeting: { ...meeting, agenda: meeting.agenda.filter((_, j) => j !== i) } })} className="text-muted hover:text-red-500" aria-label="Remove">
                    <X size={12} />
                  </button>
                </label>
              ))}
              <form onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; set({ meeting: { ...meeting, agenda: [...meeting.agenda, { text: text.trim(), done: false }] } }); setText(""); }}>
                <input className={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="+ Agenda item" />
              </form>
            </div>
            <textarea rows={8} className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-small outline-none focus:border-primary" defaultValue={meeting.notes} onBlur={(e) => set({ meeting: { ...meeting, notes: e.target.value } })} placeholder="Meeting notes, discussion points…" />
          </>
        )}

        {tab === "decisions" && (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                set({ decisions: [{ id: uid("d"), text: text.trim(), status: "proposed", owner: "", why: "", date: today() }, ...board.decisions] });
                setText("");
              }}
            >
              <input className={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="+ Record a decision" />
            </form>
            {board.decisions.length === 0 && <p className="text-xs text-muted">Capture what was decided, why, and who owns it. Tap the status to change it.</p>}
            {board.decisions.map((d) => {
              const S = STATUS[d.status] || STATUS.proposed;
              return (
                <div key={d.id} className="space-y-1.5 rounded-2xl border border-border p-3">
                  <div className="flex items-start gap-2">
                    <button type="button" onClick={() => set({ decisions: board.decisions.map((x) => (x.id === d.id ? { ...x, status: NEXT_STATUS[x.status] || "approved" } : x)) })} className={`mt-0.5 ${S.cls}`} title={`${S.label} — tap to change`}>
                      <S.icon size={16} />
                    </button>
                    <p className="flex-1 text-small font-medium">{d.text}</p>
                    <button type="button" onClick={() => set({ decisions: board.decisions.filter((x) => x.id !== d.id) })} className="text-muted hover:text-red-500" aria-label="Remove">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <input className={`${input} h-8 text-xs`} defaultValue={d.why} onBlur={(e) => set({ decisions: board.decisions.map((x) => (x.id === d.id ? { ...x, why: e.target.value } : x)) })} placeholder="Why?" />
                  <div className="flex items-center gap-2 text-[11px] text-muted">
                    <span className={S.cls}>{S.label}</span>· {d.date}
                    <input className="ml-auto h-7 w-28 rounded-lg border border-border bg-surface px-2 text-[11px] outline-none" defaultValue={d.owner} onBlur={(e) => set({ decisions: board.decisions.map((x) => (x.id === d.id ? { ...x, owner: e.target.value } : x)) })} placeholder="Owner" />
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === "actions" && (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                set({ actions: [...board.actions, { id: uid("a"), text: text.trim(), owner: "", due: "", done: false }] });
                setText("");
              }}
            >
              <input className={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="+ Action item" />
            </form>
            {board.actions.map((a) => (
              <div key={a.id} className="space-y-1.5 rounded-2xl border border-border p-3">
                <label className="flex items-start gap-2 text-small">
                  <input type="checkbox" className="mt-1" checked={a.done} onChange={() => set({ actions: board.actions.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)) })} />
                  <span className={`flex-1 ${a.done ? "text-muted line-through" : ""}`}>{a.text}</span>
                  <button type="button" onClick={() => set({ actions: board.actions.filter((x) => x.id !== a.id) })} className="text-muted hover:text-red-500" aria-label="Remove">
                    <Trash2 size={12} />
                  </button>
                </label>
                <div className="flex items-center gap-1.5">
                  <input className="h-7 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 text-[11px] outline-none" defaultValue={a.owner} onBlur={(e) => set({ actions: board.actions.map((x) => (x.id === a.id ? { ...x, owner: e.target.value } : x)) })} placeholder="Owner" />
                  <input type="date" className="h-7 rounded-lg border border-border bg-surface px-1.5 text-[11px] outline-none" value={a.due} onChange={(e) => set({ actions: board.actions.map((x) => (x.id === a.id ? { ...x, due: e.target.value } : x)) })} />
                  {a.taskId ? (
                    <Link to="/dashboard/planner" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-emerald-500" title="In your planner">
                      <Check size={12} /> Planner
                    </Link>
                  ) : (
                    <button type="button" onClick={() => toPlanner(a)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] hover:border-primary" title="Add to planner">
                      <CalendarPlus size={12} /> Plan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "notes" && (
          <>
            <label className="flex h-9 items-center gap-2 rounded-xl border border-border bg-surface px-3">
              <Search size={13} className="text-muted" />
              <input value={noteQuery} onChange={(e) => setNoteQuery(e.target.value)} placeholder="Find a note" className="min-w-0 flex-1 bg-transparent text-small outline-none" style={{ outline: "none" }} />
            </label>
            {notes.map((n) => {
              const linked = board.linkedNotes.includes(n._id);
              return (
                <div key={n._id} className="rounded-2xl border border-border p-3">
                  <p className="truncate text-small font-medium">{n.title || "Untitled"}</p>
                  {n.excerpt && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted">{n.excerpt}</p>}
                  <div className="mt-2 flex gap-1.5">
                    <button type="button" onClick={() => set({ linkedNotes: linked ? board.linkedNotes.filter((x) => x !== n._id) : [...board.linkedNotes, n._id] })} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] ${linked ? "border-primary text-primary" : "border-border"}`}>
                      <Link2 size={11} /> {linked ? "Linked" : "Link"}
                    </button>
                    <button type="button" onClick={() => addStickyText(`${n.title || "Note"}${n.excerpt ? `\n${n.excerpt.slice(0, 90)}` : ""}`)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px]">
                      <StickyNote size={11} /> As sticky
                    </button>
                    {linked && (
                      <Link to={`/dashboard/notes?note=${n._id}`} className="ml-auto text-[11px] text-muted hover:text-primary">
                        Open →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
            {!notes.length && <p className="text-xs text-muted">No notes found.</p>}
          </>
        )}
      </div>
    </aside>
  );
}

/* ---------- editor ---------- */

function Editor() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [board, setBoard] = useState(null);
  const [excalidraw, setExcalidraw] = useState(null);
  const [status, setStatus] = useState("saved");
  const [panel, setPanel] = useState(false);
  const [menu, setMenu] = useState(null);
  const [theme, setTheme] = useState(canvasTheme);
  const lastVersion = useRef(-1);
  const saveTimer = useRef(null);
  const metaTimer = useRef(null);
  const lastThumb = useRef(0);
  const loadedMeta = useRef(false);
  const templateSaved = useRef(false);

  const toggleTheme = () =>
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      try {
        localStorage.setItem("boards:canvas-theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });

  // Fit the whole board in view once it's ready.
  const fitted = useRef(false);
  useEffect(() => {
    if (!excalidraw || fitted.current) return;
    fitted.current = true;
    const id = setTimeout(() => {
      if (excalidraw.getSceneElements().length) excalidraw.scrollToContent(undefined, { fitToContent: true, animate: false });
    }, 60);
    return () => clearTimeout(id);
  }, [excalidraw]);

  useEffect(() => {
    api
      .get(`/boards/${id}`)
      .then((r) => {
        const b = data(r);
        setBoard({ decisions: [], actions: [], linkedNotes: [], meeting: {}, ...b });
      })
      .catch((e) => fail(e, "Couldn't open the board"));
  }, [id]);

  const initialData = useMemo(() => {
    if (!board) return null;
    const template = TEMPLATE.get(params.get("template"));
    const scene = board.scene;
    const elements = scene?.elements?.length ? scene.elements : template ? convertToExcalidrawElements(template.build(), { regenerateIds: false }) : [];
    return { fromTemplate: !scene?.elements?.length && Boolean(template), elements, appState: { viewBackgroundColor: scene?.appState?.viewBackgroundColor || "#ffffff", gridSize: scene?.appState?.gridSize ?? null, currentItemFontFamily: 5 }, files: scene?.files || {}, scrollToContent: true };
    // Only when the board first loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?._id]);

  // Template applied once; drop it from the URL so a reload doesn't re-apply.
  useEffect(() => {
    if (board && params.get("template")) setParams({}, { replace: true });
  }, [board, params, setParams]);

  const saveScene = useCallback(
    async (elements, appState, files) => {
      setStatus("saving");
      const live = elements.filter((e) => !e.isDeleted);
      const used = new Set(live.filter((e) => e.type === "image" && e.fileId).map((e) => e.fileId));
      const keptFiles = Object.fromEntries(Object.entries(files || {}).filter(([fid]) => used.has(fid)));
      const body = { scene: { elements: live, appState: { viewBackgroundColor: appState.viewBackgroundColor, gridSize: appState.gridSize ?? null }, files: keptFiles } };
      if (Date.now() - lastThumb.current > 20000 && live.length) {
        lastThumb.current = Date.now();
        try {
          const blob = await exportToBlob({ elements: live, appState: { exportBackground: true, viewBackgroundColor: appState.viewBackgroundColor, exportWithDarkMode: false }, files: keptFiles, maxWidthOrHeight: 520, mimeType: "image/webp", quality: 0.7 });
          body.thumbnail = await blobToDataUrl(blob);
        } catch {
          /* thumbnail is optional */
        }
      }
      try {
        await api.patch(`/boards/${id}`, body);
        setStatus("saved");
      } catch (e) {
        setStatus("error");
        fail(e, e?.response?.status === 413 ? "This board is too large — remove some big images" : "Couldn't save the board");
      }
    },
    [id],
  );

  const onChange = (elements, appState, files) => {
    const v = versionOf(elements);
    if (lastVersion.current === -1) {
      lastVersion.current = v;
      // A fresh board from a template: keep the template even if nothing is edited.
      if (initialData?.fromTemplate && !templateSaved.current) {
        templateSaved.current = true;
        saveTimer.current = setTimeout(() => saveScene(elements, appState, files), 600);
      }
      return;
    }
    if (v === lastVersion.current) return;
    lastVersion.current = v;
    setStatus("pending");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveScene(elements, appState, files), 1200);
  };

  // Meeting / decisions / actions / links / title autosave.
  useEffect(() => {
    if (!board) return undefined;
    if (!loadedMeta.current) {
      loadedMeta.current = true;
      return undefined;
    }
    clearTimeout(metaTimer.current);
    metaTimer.current = setTimeout(() => {
      const { title, emoji, meeting, decisions, actions, linkedNotes } = board;
      api.patch(`/boards/${id}`, { title: title.trim() || "Untitled board", emoji, meeting, decisions, actions, linkedNotes }).catch((e) => fail(e, "Couldn't save"));
    }, 700);
    return () => clearTimeout(metaTimer.current);
  }, [board, id]);

  // Save anything pending when leaving.
  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
    },
    [],
  );

  const viewportCenter = () => {
    const s = excalidraw.getAppState();
    return { x: -s.scrollX + s.width / 2 / s.zoom.value, y: -s.scrollY + s.height / 2 / s.zoom.value };
  };

  const addElements = (skeletons) => {
    if (!excalidraw) return;
    const els = convertToExcalidrawElements(skeletons);
    excalidraw.updateScene({ elements: [...excalidraw.getSceneElementsIncludingDeleted(), ...els], captureUpdate: CaptureUpdateAction.IMMEDIATELY });
    excalidraw.setActiveTool({ type: "selection" });
    excalidraw.updateScene({ appState: { selectedElementIds: Object.fromEntries(els.filter((e) => e.type !== "text").map((e) => [e.id, true])) }, captureUpdate: CaptureUpdateAction.NEVER });
  };

  const addSticky = (color, text = "") => {
    const c = viewportCenter();
    const jitter = () => Math.round((Math.random() - 0.5) * 60);
    addElements([sticky({ x: c.x - 100 + jitter(), y: c.y - 100 + jitter(), color, text })]);
  };

  const addTemplate = (t) => {
    const c = viewportCenter();
    addElements(t.build().map((el) => ({ ...el, x: (el.x || 0) + c.x, y: (el.y || 0) + c.y })));
    setMenu(null);
  };

  const exportAs = async (kind) => {
    setMenu(null);
    if (!excalidraw) return;
    const elements = excalidraw.getSceneElements();
    if (!elements.length) return toast.info("The board is empty");
    const appState = { ...excalidraw.getAppState(), exportBackground: true, exportWithDarkMode: false };
    const files = excalidraw.getFiles();
    const name = slug(board.title);
    try {
      if (kind === "png") download(`${name}.png`, await exportToBlob({ elements, appState, files, mimeType: "image/png", exportPadding: 32, getDimensions: (w, h) => ({ width: w * 2, height: h * 2, scale: 2 }) }));
      if (kind === "svg") download(`${name}.svg`, new Blob([(await exportToSvg({ elements, appState, files, exportPadding: 32 })).outerHTML], { type: "image/svg+xml" }));
      if (kind === "json") download(`${name}.excalidraw`, new Blob([serializeAsJSON(elements, appState, files, "local")], { type: "application/json" }));
      if (kind === "pdf") {
        const url = await blobToDataUrl(await exportToBlob({ elements, appState, files, mimeType: "image/png", exportPadding: 32, getDimensions: (w, h) => ({ width: w * 2, height: h * 2, scale: 2 }) }));
        const w = window.open("", "_blank");
        if (!w) return toast.error("Allow pop-ups to save as PDF");
        w.document.write(`<title>${board.title.replace(/</g, "")}</title><style>@page{margin:12mm}body{margin:0;display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:96vh}</style><img src="${url}" onload="setTimeout(()=>print(),200)">`);
        w.document.close();
      }
    } catch {
      toast.error("Export failed");
    }
  };

  if (!board || !initialData) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-[var(--color-card)] px-2 py-1.5 sm:px-3">
        <Link to="/dashboard/boards" className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary" aria-label="All boards">
          <ArrowLeft size={17} />
        </Link>
        <input value={board.emoji} onChange={(e) => setBoard((b) => ({ ...b, emoji: e.target.value.slice(0, 4) }))} className="w-9 rounded-lg bg-transparent text-center text-lg outline-none" aria-label="Board emoji" style={{ outline: "none" }} />
        <input value={board.title} onChange={(e) => setBoard((b) => ({ ...b, title: e.target.value.slice(0, 160) }))} className="min-w-0 max-w-[260px] flex-1 rounded-lg bg-transparent px-1 text-[15px] font-semibold outline-none hover:bg-surface focus:bg-surface" aria-label="Board title" style={{ outline: "none" }} />
        <span className="hidden items-center gap-1 text-[11px] text-muted sm:inline-flex">
          {status === "saving" || status === "pending" ? <Loader2 size={12} className="animate-spin" /> : status === "error" ? <X size={12} className="text-red-500" /> : <Check size={12} />}
          {status === "saved" ? "Saved" : status === "error" ? "Not saved" : "Saving…"}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <div className="flex items-center gap-1 rounded-xl border border-border px-1.5 py-1" title="Add a sticky note">
            <StickyNote size={14} className="mx-0.5 text-muted" />
            {STICKY_COLORS.map((c) => (
              <button key={c.name} type="button" onClick={() => addSticky(c)} className="h-6 w-6 rounded-md shadow-sm transition hover:-translate-y-0.5 hover:rotate-6" style={{ background: c.fill, border: `1px solid ${c.stroke}` }} aria-label={`${c.name} sticky note`} />
            ))}
          </div>
          <div className="relative">
            <button type="button" onClick={() => setMenu(menu === "tpl" ? null : "tpl")} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary" title="Insert a template">
              <LayoutTemplate size={17} />
            </button>
            {menu === "tpl" && (
              <div className="absolute right-0 top-10 z-30 w-60 rounded-2xl border border-border bg-[var(--color-card)] p-1.5 shadow-xl">
                {TEMPLATES.filter((t) => t.id !== "blank").map((t) => (
                  <button key={t.id} type="button" onClick={() => addTemplate(t)} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-surface">
                    <span className="text-lg">{t.emoji}</span>
                    <span>
                      <span className="block text-small">{t.label}</span>
                      <span className="text-[11px] text-muted">{t.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button type="button" onClick={() => setMenu(menu === "export" ? null : "export")} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary" title="Export">
              <Download size={17} />
            </button>
            {menu === "export" && (
              <div className="absolute right-0 top-10 z-30 w-48 rounded-2xl border border-border bg-[var(--color-card)] p-1.5 shadow-xl">
                {[
                  ["png", "Image (PNG, 2×)"],
                  ["svg", "Vector (SVG)"],
                  ["pdf", "PDF (print)"],
                  ["json", "Excalidraw file"],
                ].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => exportAs(k)} className="block w-full rounded-xl px-3 py-2 text-left text-small hover:bg-surface">
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={toggleTheme} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary" title={theme === "light" ? "Dark canvas" : "Paper canvas"}>
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button type="button" onClick={() => setPanel((p) => !p)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs ${panel ? "bg-primary text-background" : "text-muted hover:bg-surface hover:text-primary"}`} title="Meeting, decisions, actions, notes">
            <PanelRight size={16} /> <span className="hidden md:inline">Meeting</span>
            {board.actions.some((a) => !a.done) && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-chart-2)]" />}
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1" onPointerDown={() => menu && setMenu(null)}>
          <Excalidraw
            excalidrawAPI={setExcalidraw}
            initialData={initialData}
            onChange={onChange}
            theme={theme}
            name={board.title}
            UIOptions={{ canvasActions: { loadScene: true, saveToActiveFile: false, export: false, saveAsImage: false, toggleTheme: false, changeViewBackgroundColor: true } }}
          >
            <MainMenu>
              <MainMenu.DefaultItems.LoadScene />
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.Separator />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
              <MainMenu.DefaultItems.Help />
            </MainMenu>
          </Excalidraw>
        </div>
        {panel && (
          <div className="absolute inset-y-0 right-0 z-20 w-full sm:static sm:w-auto">
            <SidePanel board={board} setBoard={setBoard} onClose={() => setPanel(false)} addStickyText={(text) => addSticky(STICKY_COLORS[4], text)} />
          </div>
        )}
      </div>
    </div>
  );
}

function BoardEditor() {
  return (
    <LifeGate bleed>
      <Editor />
    </LifeGate>
  );
}

export default BoardEditor;
