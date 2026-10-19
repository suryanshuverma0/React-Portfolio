import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  MoreHorizontal,
  Folder,
  FolderOpen,
  FileText,
  PenLine,
  Pin,
  Plus,
} from "lucide-react";

/* ========================================
   NOTES TREE
   Notebook → topics (any depth) → notes.
   Every row has a "⋯" menu; actions are
   handled by the page via onAction.
========================================= */

const EXPANDED_KEY = "notes:expanded";

const loadExpanded = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(EXPANDED_KEY)) || []);
  } catch {
    return new Set();
  }
};

function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="More actions"
        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted opacity-60 hover:bg-surface hover:opacity-100 group-hover:opacity-100"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-52 rounded-xl border border-border bg-background p-1 shadow-xl">
          {items.filter(Boolean).map((item, index) =>
            item === "divider" ? (
              <div key={`divider-${index}`} className="my-1 h-px bg-border" />
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick();
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-small hover:bg-surface ${
                  item.danger ? "text-red-500" : ""
                }`}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function NoteRow({ note, depth, active, onOpen, onAction }) {
  const Icon = note.kind === "handwritten" ? PenLine : FileText;
  return (
    <div
      className={`group flex items-center gap-1.5 rounded-lg pr-1 text-small transition ${
        active ? "bg-primary text-background" : "hover:bg-surface"
      }`}
      style={{ paddingLeft: 10 + depth * 14 }}
    >
      <button type="button" onClick={() => onOpen(note._id)} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left">
        <Icon size={14} className={active ? "" : "text-muted"} />
        <span className="truncate">{note.title || "Untitled"}</span>
        {note.isPinned && <Pin size={11} className="shrink-0 opacity-70" />}
      </button>
      <RowMenu
        items={[
          { label: note.isPinned ? "Unpin" : "Pin", onClick: () => onAction("pinNote", note) },
          { label: "Move to…", onClick: () => onAction("moveNote", note) },
          { label: "Move up", onClick: () => onAction("reorderNote", note, -1) },
          { label: "Move down", onClick: () => onAction("reorderNote", note, 1) },
          "divider",
          { label: "Delete", danger: true, onClick: () => onAction("deleteNote", note) },
        ]}
      />
    </div>
  );
}

function TopicNode({ topic, depth, ctx }) {
  const key = `t:${topic._id}`;
  const open = ctx.expanded.has(key);
  const children = ctx.topicsBy.get(`${topic.notebook}:${topic._id}`) || [];
  const notes = ctx.notesBy.get(`${topic.notebook}:${topic._id}`) || [];
  const count = notes.length + children.length;

  return (
    <div>
      <div className="group flex items-center gap-1 rounded-lg pr-1 text-small hover:bg-surface" style={{ paddingLeft: 4 + depth * 14 }}>
        <button type="button" onClick={() => ctx.toggle(key)} className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left">
          <ChevronRight size={14} className={`shrink-0 text-muted transition ${open ? "rotate-90" : ""}`} />
          {open ? <FolderOpen size={15} className="shrink-0 text-muted" /> : <Folder size={15} className="shrink-0 text-muted" />}
          <span className="truncate font-medium">{topic.title}</span>
          {!open && count > 0 && <span className="text-[11px] text-muted">{count}</span>}
        </button>
        <RowMenu
          items={[
            { label: "New typed note", onClick: () => ctx.onAction("newNote", { notebook: topic.notebook, topic: topic._id, kind: "typed" }) },
            { label: "New handwritten note", onClick: () => ctx.onAction("newNote", { notebook: topic.notebook, topic: topic._id, kind: "handwritten" }) },
            { label: "New sub-topic", onClick: () => ctx.onAction("newTopic", { notebook: topic.notebook, parent: topic._id }) },
            "divider",
            { label: "Rename", onClick: () => ctx.onAction("renameTopic", topic) },
            { label: "Move to…", onClick: () => ctx.onAction("moveTopic", topic) },
            { label: "Move up", onClick: () => ctx.onAction("reorderTopic", topic, -1) },
            { label: "Move down", onClick: () => ctx.onAction("reorderTopic", topic, 1) },
            "divider",
            { label: "Delete topic", danger: true, onClick: () => ctx.onAction("deleteTopic", topic) },
          ]}
        />
      </div>

      {open && (
        <div>
          {children.map((child) => (
            <TopicNode key={child._id} topic={child} depth={depth + 1} ctx={ctx} />
          ))}
          {notes.map((note) => (
            <NoteRow key={note._id} note={note} depth={depth + 1} active={ctx.activeId === note._id} onOpen={ctx.onOpen} onAction={ctx.onAction} />
          ))}
          {!count && <p className="py-1 text-xs text-muted" style={{ paddingLeft: 30 + depth * 14 }}>Empty</p>}
        </div>
      )}
    </div>
  );
}

function NotesTree({ tree, activeId, onOpen, onAction }) {
  const [expanded, setExpanded] = useState(loadExpanded);
  const [revealedFor, setRevealedFor] = useState(null);

  // When a different note opens (e.g. from search or pinned), reveal its
  // ancestors once. Adjusting state during render on a prop change is the
  // React-recommended alternative to an effect here.
  if (activeId !== revealedFor) {
    setRevealedFor(activeId);
    const note = activeId && tree.notes.find((n) => n._id === activeId);
    if (note) {
      const keys = [`n:${note.notebook}`];
      for (let topicId = note.topic; topicId; topicId = tree.topics.find((t) => t._id === topicId)?.parent || null) {
        keys.push(`t:${topicId}`);
      }
      if (!keys.every((k) => expanded.has(k))) setExpanded(new Set([...expanded, ...keys]));
    }
  }

  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]));
    } catch {
      /* ignore */
    }
  }, [expanded]);

  const ctx = useMemo(() => {
    const topicsBy = new Map();
    tree.topics.forEach((t) => {
      const key = `${t.notebook}:${t.parent || ""}`;
      if (!topicsBy.has(key)) topicsBy.set(key, []);
      topicsBy.get(key).push(t);
    });
    const notesBy = new Map();
    tree.notes.forEach((n) => {
      const key = `${n.notebook}:${n.topic || ""}`;
      if (!notesBy.has(key)) notesBy.set(key, []);
      notesBy.get(key).push(n);
    });
    return {
      topicsBy,
      notesBy,
      expanded,
      activeId,
      onOpen,
      onAction,
      toggle: (key) =>
        setExpanded((prev) => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        }),
    };
  }, [tree, expanded, activeId, onOpen, onAction]);

  if (!tree.notebooks.length) {
    return (
      <div className="px-3 py-6 text-center space-y-3">
        <p className="text-small text-muted">No notebooks yet.</p>
        <button type="button" onClick={() => onAction("newNotebook")} className="h-10 px-4 rounded-xl bg-primary text-background text-small inline-flex items-center gap-2">
          <Plus size={15} /> Create a notebook
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.notebooks.map((notebook) => {
        const key = `n:${notebook._id}`;
        const open = expanded.has(key);
        const topics = ctx.topicsBy.get(`${notebook._id}:`) || [];
        const notes = ctx.notesBy.get(`${notebook._id}:`) || [];

        return (
          <div key={notebook._id}>
            <div className="group flex items-center gap-1 rounded-lg pr-1 hover:bg-surface">
              <button type="button" onClick={() => ctx.toggle(key)} className="flex min-w-0 flex-1 items-center gap-2 px-1 py-2 text-left">
                <ChevronRight size={14} className={`shrink-0 text-muted transition ${open ? "rotate-90" : ""}`} />
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm" style={{ backgroundColor: `${notebook.color}22` }}>
                  {notebook.icon}
                </span>
                <span className="truncate text-small font-semibold">{notebook.title}</span>
              </button>
              <RowMenu
                items={[
                  { label: "New typed note", onClick: () => onAction("newNote", { notebook: notebook._id, topic: null, kind: "typed" }) },
                  { label: "New handwritten note", onClick: () => onAction("newNote", { notebook: notebook._id, topic: null, kind: "handwritten" }) },
                  { label: "New topic", onClick: () => onAction("newTopic", { notebook: notebook._id, parent: null }) },
                  "divider",
                  { label: "Rename / icon / colour", onClick: () => onAction("editNotebook", notebook) },
                  { label: "Move up", onClick: () => onAction("reorderNotebook", notebook, -1) },
                  { label: "Move down", onClick: () => onAction("reorderNotebook", notebook, 1) },
                  "divider",
                  { label: "Delete notebook", danger: true, onClick: () => onAction("deleteNotebook", notebook) },
                ]}
              />
            </div>

            {open && (
              <div className="ml-2 border-l border-border pl-1">
                {topics.map((topic) => (
                  <TopicNode key={topic._id} topic={topic} depth={0} ctx={ctx} />
                ))}
                {notes.map((note) => (
                  <NoteRow key={note._id} note={note} depth={0} active={activeId === note._id} onOpen={onOpen} onAction={onAction} />
                ))}
                {!topics.length && !notes.length && (
                  <p className="px-3 py-1.5 text-xs text-muted">Empty — use ⋯ to add a topic or note</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default NotesTree;
