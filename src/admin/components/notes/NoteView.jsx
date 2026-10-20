import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Pin, History, Trash2, FolderInput, X, Check, CloudOff, Loader2, FileText, PenLine, FileDown, Globe } from "lucide-react";

import TypedEditor from "./TypedEditor";
import InkEditor from "./ink/InkEditor";
import { InkPreview } from "./ink/InkCanvas";
import SkeletonCard from "../../../components/common/SkeletonCard";
import PublishDialog from "./PublishDialog";
import { getPublishStatus, downloadNotePdf } from "../../services/automation.service";
import {
  getNote,
  updateNote,
  getNoteVersions,
  getNoteVersion,
  restoreNoteVersion,
} from "../../services/notes.service";

/* ========================================
   NOTE VIEW — header (title, tags, pin,
   save status, history) + the right editor.
   Autosaves: edits are merged into one
   pending patch and sent 1s after you stop.
========================================= */

const AUTOSAVE_DELAY_MS = 1000;

const relativeTime = (date) => {
  if (!date) return "";
  const seconds = Math.round((Date.now() - new Date(date)) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return new Date(date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

function useAutosave(noteId, onSaved) {
  const pending = useRef({});
  const timer = useRef(null);
  const inFlight = useRef(null);
  const flushRef = useRef(null);
  const [status, setStatus] = useState({ state: "saved", at: null });

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (inFlight.current) await inFlight.current;
    const patch = pending.current;
    if (!Object.keys(patch).length) return;
    pending.current = {};
    setStatus((s) => ({ ...s, state: "saving" }));

    const request = updateNote(noteId, patch)
      .then((saved) => {
        setStatus({ state: "saved", at: saved.savedAt || new Date() });
        onSaved?.(saved, patch);
      })
      .catch(() => {
        // Put it back so the next change (or retry) sends it again.
        pending.current = { ...patch, ...pending.current };
        setStatus((s) => ({ ...s, state: "error" }));
        clearTimeout(timer.current);
        timer.current = setTimeout(() => flushRef.current?.(), 5000);
      });
    inFlight.current = request;
    await request;
    inFlight.current = null;
  }, [noteId, onSaved]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const queue = useCallback(
    (patch) => {
      pending.current = { ...pending.current, ...patch };
      setStatus((s) => ({ ...s, state: "dirty" }));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => flush(), AUTOSAVE_DELAY_MS);
    },
    [flush],
  );

  // Save on note switch / unmount, and warn before closing with unsaved work.
  useEffect(() => {
    const beforeUnload = (e) => {
      if (Object.keys(pending.current).length) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      flush();
    };
  }, [flush]);

  return { status, queue, flush };
}

function SaveStatus({ status }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  if (status.state === "saving" || status.state === "dirty") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <Loader2 size={13} className="animate-spin" /> Saving…
      </span>
    );
  }
  if (status.state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
        <CloudOff size={13} /> Not saved — retrying
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <Check size={13} /> Saved {status.at ? relativeTime(status.at) : ""}
    </span>
  );
}

function TagInput({ tags, onChange }) {
  const [value, setValue] = useState("");

  const add = () => {
    const tag = value.trim().toLowerCase().replace(/^#/, "");
    setValue("");
    if (!tag || tags.includes(tag) || tags.length >= 20) return;
    onChange([...tags, tag]);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-surface border border-border px-2 py-0.5 text-xs">
          #{tag}
          <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(tags.filter((t) => t !== tag))}>
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder="+ tag"
        className="w-20 bg-transparent text-xs outline-none placeholder:text-muted"
      />
    </div>
  );
}

function VersionsPanel({ note, onRestored, onClose }) {
  const [versions, setVersions] = useState(null);
  const [preview, setPreview] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getNoteVersions(note._id)
      .then(setVersions)
      .catch(() => toast.error("Couldn't load history"));
  }, [note._id]);

  const open = async (version) => {
    try {
      setPreview(await getNoteVersion(note._id, version._id));
    } catch {
      toast.error("Couldn't load that version");
    }
  };

  const restore = async () => {
    try {
      setRestoring(true);
      const restored = await restoreNoteVersion(note._id, preview._id);
      toast.success("Version restored");
      onRestored(restored);
    } catch {
      toast.error("Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-title">Version history</h3>
        <button type="button" onClick={onClose} aria-label="Close history" className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-surface">
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-xs text-muted">A checkpoint is kept every 10 minutes of editing (last 50).</p>

        {!versions ? (
          <SkeletonCard />
        ) : !versions.length ? (
          <p className="text-body">No earlier versions yet.</p>
        ) : (
          <div className="space-y-1">
            {versions.map((v) => (
              <button
                key={v._id}
                type="button"
                onClick={() => open(v)}
                className={`w-full rounded-xl px-3 py-2 text-left transition ${
                  preview?._id === v._id ? "bg-surface ring-1 ring-primary" : "hover:bg-surface"
                }`}
              >
                <p className="text-small font-medium">
                  {new Date(v.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <p className="truncate text-xs text-muted">
                  {v.kind === "handwritten" ? `${v.elementCount} strokes & items` : v.excerpt || "Empty"}
                </p>
              </button>
            ))}
          </div>
        )}

        {preview && (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-small font-semibold">{preview.title}</p>
            {preview.kind === "handwritten" ? (
              <InkPreview ink={preview.ink} maxHeight={420} />
            ) : (
              <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-surface p-3 text-small">
                {preview.text || "Empty"}
              </div>
            )}
            <button
              type="button"
              onClick={restore}
              disabled={restoring}
              className="h-control w-full rounded-control bg-primary text-background text-small font-medium disabled:opacity-50"
            >
              {restoring ? "Restoring…" : "Restore this version"}
            </button>
            <p className="text-xs text-muted">The current version is saved to history first, so you can undo a restore.</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function NoteView({ noteId, breadcrumb, onSummaryChange, onMove, onDelete }) {
  const [note, setNote] = useState(null);
  const [contentKey, setContentKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [published, setPublished] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPublishStatus(noteId)
      .then((s) => !cancelled && setPublished(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  const exportPdf = async (title) => {
    try {
      setExporting(true);
      await flush();
      await downloadNotePdf(noteId, title);
    } catch {
      toast.error("PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  const onSaved = useCallback(
    (saved, patch) => {
      onSummaryChange(noteId, {
        title: saved.title,
        isPinned: saved.isPinned,
        tags: saved.tags,
        updatedAt: saved.updatedAt,
        ...(patch.text !== undefined && { excerpt: patch.text.slice(0, 160) }),
      });
    },
    [noteId, onSummaryChange],
  );

  const { status, queue, flush } = useAutosave(noteId, onSaved);

  useEffect(() => {
    let cancelled = false;
    getNote(noteId)
      .then((data) => {
        if (cancelled) return;
        setNote(data);
        setContentKey((k) => k + 1);
      })
      .catch(() => !cancelled && toast.error("Couldn't open note"));
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  const setMeta = (patch) => {
    setNote((n) => ({ ...n, ...patch }));
    queue(patch);
  };

  const handleTyped = useCallback((change) => queue(change), [queue]);
  const handleInk = useCallback((ink) => queue({ ink }), [queue]);

  if (!note || note._id !== noteId) {
    return (
      <div className="p-8">
        <SkeletonCard />
      </div>
    );
  }

  const KindIcon = note.kind === "handwritten" ? PenLine : FileText;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="space-y-2 border-b border-border px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 text-xs text-muted">
          <KindIcon size={13} />
          <span className="truncate">{breadcrumb}</span>
          {published?.published && (
            <a
              href={`/blog/${published.post.slug}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400"
            >
              <Globe size={11} /> On blog
            </a>
          )}
          <span className="ml-auto shrink-0">
            <SaveStatus status={status} />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={note.title}
            onChange={(e) => setMeta({ title: e.target.value.slice(0, 200) })}
            placeholder="Untitled"
            className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted"
            aria-label="Note title"
          />
          <button
            type="button"
            onClick={() => setMeta({ isPinned: !note.isPinned })}
            aria-pressed={note.isPinned}
            title={note.isPinned ? "Unpin" : "Pin"}
            className={`h-9 w-9 inline-flex items-center justify-center rounded-lg ${note.isPinned ? "bg-primary text-background" : "hover:bg-surface"}`}
          >
            <Pin size={16} />
          </button>
          <button
            type="button"
            onClick={() => setShowPublish(true)}
            title={published?.published ? "Update or unpublish blog post" : "Publish to blog"}
            className={`h-9 w-9 inline-flex items-center justify-center rounded-lg ${published?.published ? "text-emerald-600 dark:text-emerald-400" : ""} hover:bg-surface`}
          >
            <Globe size={16} />
          </button>
          <button type="button" onClick={() => exportPdf(note.title)} disabled={exporting} title="Export as PDF" className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-surface disabled:opacity-50">
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          </button>
          <button type="button" onClick={() => setShowHistory(true)} title="Version history" className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-surface">
            <History size={16} />
          </button>
          <button
            type="button"
            onClick={async () => {
              await flush();
              onMove(note);
            }}
            title="Move to…"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-surface"
          >
            <FolderInput size={16} />
          </button>
          <button type="button" onClick={() => onDelete(note)} title="Delete" className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-surface text-red-500">
            <Trash2 size={16} />
          </button>
        </div>

        <TagInput tags={note.tags || []} onChange={(tags) => setMeta({ tags })} />
      </header>

      <div className="min-h-0 flex-1">
        {note.kind === "typed" ? (
          <TypedEditor key={contentKey} initialDoc={note.doc} onChange={handleTyped} />
        ) : (
          <InkEditor key={contentKey} initialInk={note.ink} onChange={handleInk} />
        )}
      </div>

      {showPublish && (
        <PublishDialog note={note} flush={flush} onClose={() => setShowPublish(false)} onChange={setPublished} />
      )}

      {showHistory && (
        <VersionsPanel
          note={note}
          onClose={() => setShowHistory(false)}
          onRestored={(restored) => {
            setNote(restored);
            setContentKey((k) => k + 1);
            setShowHistory(false);
            onSummaryChange(noteId, { title: restored.title, updatedAt: restored.updatedAt, excerpt: (restored.text || "").slice(0, 160) });
          }}
        />
      )}
    </div>
  );
}

export default NoteView;
