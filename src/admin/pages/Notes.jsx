import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Search,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  FileText,
  PenLine,
  NotebookPen,
  X,
  Hash,
} from "lucide-react";

import NotesTree from "../components/notes/NotesTree";
import NoteView from "../components/notes/NoteView";
import TrashView from "../components/notes/TrashView";
import { NameDialog, MoveDialog } from "../components/notes/NoteDialogs";
import ConfirmModal from "../components/ui/ConfirmModal";
import SkeletonCard from "../../components/common/SkeletonCard";
import * as api from "../services/notes.service";
import "../components/notes/notes.css";

/* ========================================
   NOTES — private notebook (admin only).
   Left: search, tags, pinned, the tree and
   trash. Right: the open note, trash, or a
   home screen with recent notes.
   ?note=<id> keeps the open note in the URL.
========================================= */

const timeAgo = (date) => {
  const s = Math.round((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

function NoteListItem({ note, path, active, onOpen }) {
  const Icon = note.kind === "handwritten" ? PenLine : FileText;
  return (
    <button
      type="button"
      onClick={() => onOpen(note._id)}
      className={`w-full rounded-xl px-3 py-2.5 text-left transition ${active ? "bg-primary text-background" : "hover:bg-surface"}`}
    >
      <p className="flex items-center gap-2 text-small font-medium">
        <Icon size={14} className="shrink-0 opacity-70" />
        <span className="truncate">{note.title || "Untitled"}</span>
        {note.isPinned && <Pin size={11} className="shrink-0 opacity-70" />}
      </p>
      <p className={`mt-0.5 truncate text-xs ${active ? "opacity-80" : "text-muted"}`}>
        {path} · {timeAgo(note.updatedAt)}
      </p>
      {note.excerpt && <p className={`mt-1 line-clamp-2 text-xs ${active ? "opacity-80" : "text-muted"}`}>{note.excerpt}</p>}
    </button>
  );
}

function Notes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get("note");
  const view = searchParams.get("view"); // "trash" | null

  const [tree, setTree] = useState(null);
  const [tags, setTags] = useState([]);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [results, setResults] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dialog, setDialog] = useState(null);

  const loadTree = useCallback(async () => {
    try {
      const [data, tagList] = await Promise.all([api.getNotesTree(), api.getNoteTags()]);
      setTree(data);
      setTags(tagList);
    } catch {
      toast.error("Couldn't load notes");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(loadTree, 0);
    return () => clearTimeout(t);
  }, [loadTree]);

  // Debounced search / tag filter.
  useEffect(() => {
    if (!query.trim() && !activeTag) {
      const t = setTimeout(() => setResults(null), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      api
        .searchNotes({ q: query.trim(), tag: activeTag })
        .then(setResults)
        .catch(() => toast.error("Search failed"));
    }, 250);
    return () => clearTimeout(t);
  }, [query, activeTag]);

  const openNote = useCallback(
    (id) => {
      setSearchParams({ note: id });
      if (window.innerWidth < 1024) setSidebarOpen(false);
    },
    [setSearchParams],
  );

  // Paths like "DSA / Graphs / BFS" for lists and the breadcrumb.
  const pathOf = useCallback(
    (note) => {
      if (!tree) return "";
      const notebook = tree.notebooks.find((n) => n._id === note.notebook);
      const parts = [];
      let topicId = note.topic;
      while (topicId) {
        const topic = tree.topics.find((t) => t._id === topicId);
        if (!topic) break;
        parts.unshift(topic.title);
        topicId = topic.parent;
      }
      return [notebook ? `${notebook.icon} ${notebook.title}` : "", ...parts].filter(Boolean).join(" / ");
    },
    [tree],
  );

  const updateSummary = useCallback((id, patch) => {
    setTree((t) => (t ? { ...t, notes: t.notes.map((n) => (n._id === id ? { ...n, ...patch } : n)) } : t));
  }, []);

  /* ---------- actions from the tree / note header ---------- */

  const reorderWithin = async (type, list, item, direction) => {
    const index = list.findIndex((x) => x._id === item._id);
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const ids = list.map((x) => x._id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await api.reorderNotes(type, ids);
    await loadTree();
  };

  const handleAction = useCallback(
    async (action, item, extra) => {
      try {
        switch (action) {
          case "newNotebook":
            setDialog({ type: "notebook" });
            break;
          case "editNotebook":
            setDialog({ type: "notebook", item });
            break;
          case "newTopic":
            setDialog({ type: "topic", context: item });
            break;
          case "renameTopic":
            setDialog({ type: "renameTopic", item });
            break;
          case "newNote": {
            const note = await api.createNote(item);
            await loadTree();
            openNote(note._id);
            break;
          }
          case "pinNote":
            await api.updateNote(item._id, { isPinned: !item.isPinned });
            updateSummary(item._id, { isPinned: !item.isPinned });
            break;
          case "moveNote":
            setDialog({ type: "move", kind: "note", item });
            break;
          case "moveTopic":
            setDialog({ type: "move", kind: "topic", item });
            break;
          case "reorderNote":
            await reorderWithin(
              "note",
              tree.notes.filter((n) => n.notebook === item.notebook && (n.topic || null) === (item.topic || null)),
              item,
              extra,
            );
            break;
          case "reorderTopic":
            await reorderWithin(
              "topic",
              tree.topics.filter((t) => t.notebook === item.notebook && (t.parent || null) === (item.parent || null)),
              item,
              extra,
            );
            break;
          case "reorderNotebook":
            await reorderWithin("notebook", tree.notebooks, item, extra);
            break;
          case "deleteNote":
          case "deleteTopic":
          case "deleteNotebook":
            setDialog({ type: "delete", action, item });
            break;
          default:
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree, loadTree, openNote, updateSummary],
  );

  const submitDialog = async (payload) => {
    try {
      if (dialog.type === "notebook") {
        if (dialog.item) await api.updateNotebook(dialog.item._id, payload);
        else await api.createNotebook(payload);
      } else if (dialog.type === "topic") {
        await api.createTopic({ ...dialog.context, title: payload.title });
      } else if (dialog.type === "renameTopic") {
        await api.updateTopic(dialog.item._id, { title: payload.title });
      } else if (dialog.type === "move") {
        if (dialog.kind === "note") await api.updateNote(dialog.item._id, payload);
        else await api.updateTopic(dialog.item._id, payload);
        toast.success("Moved");
      } else if (dialog.type === "delete") {
        const { action, item } = dialog;
        if (action === "deleteNote") await api.deleteNote(item._id);
        if (action === "deleteTopic") await api.deleteTopic(item._id);
        if (action === "deleteNotebook") await api.deleteNotebook(item._id);
        toast.success("Moved to trash");
        const openNoteSummary = tree.notes.find((n) => n._id === activeId);
        const openTopicChain = [];
        for (let t = openNoteSummary?.topic; t; t = tree.topics.find((x) => x._id === t)?.parent) {
          openTopicChain.push(t);
        }
        const removesOpen =
          openNoteSummary &&
          (item._id === activeId ||
            (action === "deleteNotebook" && openNoteSummary.notebook === item._id) ||
            (action === "deleteTopic" && openTopicChain.includes(item._id)));
        if (removesOpen) setSearchParams({});
      }
      setDialog(null);
      await loadTree();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const pinned = useMemo(() => (tree ? tree.notes.filter((n) => n.isPinned) : []), [tree]);
  const recent = useMemo(
    () => (tree ? [...tree.notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8) : []),
    [tree],
  );

  if (!tree) {
    return (
      <div className="p-8">
        <SkeletonCard />
      </div>
    );
  }

  const activeSummary = tree.notes.find((n) => n._id === activeId);
  const firstNotebook = tree.notebooks[0];

  return (
    <div className="relative flex h-full min-h-0 w-full">
      {/* ---------- sidebar ---------- */}
      <aside
        className={`${
          sidebarOpen ? "flex" : "hidden"
        } absolute inset-y-0 left-0 z-30 w-[300px] flex-col border-r border-border bg-background lg:static lg:z-auto`}
      >
        <div className="space-y-3 border-b border-border p-3">
          <div className="flex items-center gap-2">
            <h2 className="flex-1 text-title inline-flex items-center gap-2">
              <NotebookPen size={20} /> Notes
            </h2>
            <button type="button" onClick={() => handleAction("newNotebook")} title="New notebook" className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-surface">
              <Plus size={18} />
            </button>
            <button type="button" onClick={() => setSidebarOpen(false)} title="Hide sidebar" className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-surface">
              <PanelLeftClose size={18} />
            </button>
          </div>

          <label className="relative block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-small outline-none focus:border-primary"
            />
          </label>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 16).map(({ tag, count }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag((t) => (t === tag ? "" : tag))}
                  className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs ${
                    activeTag === tag ? "border-primary bg-primary text-background" : "border-border bg-surface"
                  }`}
                >
                  <Hash size={10} />
                  {tag}
                  <span className="opacity-60">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {results ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {results.length} result{results.length === 1 ? "" : "s"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveTag("");
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted"
                >
                  <X size={12} /> Clear
                </button>
              </div>
              {results.map((note) => (
                <NoteListItem key={note._id} note={note} path={pathOf(note)} active={note._id === activeId} onOpen={openNote} />
              ))}
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <div className="mb-3 space-y-0.5">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">Pinned</p>
                  {pinned.map((note) => (
                    <button
                      key={note._id}
                      type="button"
                      onClick={() => openNote(note._id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-small ${
                        note._id === activeId ? "bg-primary text-background" : "hover:bg-surface"
                      }`}
                    >
                      <Pin size={12} className="shrink-0 opacity-70" />
                      <span className="truncate">{note.title}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">Notebooks</p>
              <NotesTree tree={tree} activeId={activeId} onOpen={openNote} onAction={handleAction} />
            </>
          )}
        </div>

        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={() => setSearchParams({ view: "trash" })}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-small ${view === "trash" ? "bg-surface font-medium" : "hover:bg-surface"}`}
          >
            <Trash2 size={15} /> Trash
          </button>
        </div>
      </aside>

      {/* ---------- main ---------- */}
      <section className="relative min-w-0 flex-1">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            title="Show notes sidebar"
            className="absolute left-3 top-3 z-20 h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border bg-background shadow"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        {view === "trash" ? (
          <TrashView onChanged={loadTree} />
        ) : activeId && activeSummary ? (
          <div className={`h-full ${sidebarOpen ? "" : "pl-12"}`}>
            <NoteView
              key={activeId}
              noteId={activeId}
              breadcrumb={pathOf(activeSummary)}
              onSummaryChange={updateSummary}
              onMove={(note) => handleAction("moveNote", { ...activeSummary, ...note })}
              onDelete={(note) => handleAction("deleteNote", { ...activeSummary, ...note })}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-10">
              <div>
                <h1 className="text-heading">Your notes</h1>
                <p className="text-body mt-2">Private to you — typed notes and handwriting, organised by notebook and topic.</p>
              </div>

              {firstNotebook ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleAction("newNote", { notebook: firstNotebook._id, topic: null, kind: "typed" })}
                    className="card glass-hover text-left space-y-2"
                  >
                    <FileText size={22} />
                    <p className="text-title">New typed note</p>
                    <p className="text-xs text-muted">in {firstNotebook.icon} {firstNotebook.title}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction("newNote", { notebook: firstNotebook._id, topic: null, kind: "handwritten" })}
                    className="card glass-hover text-left space-y-2"
                  >
                    <PenLine size={22} />
                    <p className="text-title">New handwritten note</p>
                    <p className="text-xs text-muted">in {firstNotebook.icon} {firstNotebook.title}</p>
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => handleAction("newNotebook")} className="h-control px-5 rounded-control bg-primary text-background text-small inline-flex items-center gap-2">
                  <Plus size={16} /> Create your first notebook
                </button>
              )}

              {recent.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-title">Recently edited</h2>
                  <div className="card p-2">
                    {recent.map((note) => (
                      <NoteListItem key={note._id} note={note} path={pathOf(note)} active={false} onOpen={openNote} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ---------- dialogs ---------- */}
      {(dialog?.type === "notebook" || dialog?.type === "topic" || dialog?.type === "renameTopic") && (
        <NameDialog
          title={
            dialog.type === "notebook"
              ? dialog.item
                ? "Edit notebook"
                : "New notebook"
              : dialog.type === "topic"
                ? dialog.context.parent
                  ? "New sub-topic"
                  : "New topic"
                : "Rename topic"
          }
          initial={dialog.item || {}}
          withAppearance={dialog.type === "notebook"}
          confirmLabel={dialog.item ? "Save" : "Create"}
          onSubmit={submitDialog}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.type === "move" && (
        <MoveDialog
          item={dialog.item}
          type={dialog.kind}
          notebooks={tree.notebooks}
          topics={tree.topics}
          onSubmit={submitDialog}
          onClose={() => setDialog(null)}
        />
      )}

      <ConfirmModal
        isOpen={dialog?.type === "delete"}
        title="Move to trash?"
        message={
          dialog?.action === "deleteNote"
            ? `“${dialog?.item?.title}” goes to the trash. You can restore it for 30 days.`
            : `“${dialog?.item?.title}” and everything inside it goes to the trash. You can restore it for 30 days.`
        }
        confirmText="Move to trash"
        onConfirm={() => submitDialog()}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}

export default Notes;
