import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

const NOTEBOOK_COLORS = ["#2a78d6", "#7c3aed", "#059669", "#dc2626", "#ea580c", "#0891b2", "#525252"];
const NOTEBOOK_ICONS = ["📓", "📘", "📗", "📕", "🧠", "💻", "⛓️", "🧪", "📐", "🎯", "💡", "📝"];

function DialogShell({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div className="card w-full max-w-md space-y-5" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="flex items-center justify-between">
          <h3 className="text-title">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-surface">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass = "w-full h-control px-4 rounded-control bg-surface border border-border outline-none focus:border-primary";
const primaryButton = "h-control px-5 rounded-control bg-primary text-background text-small font-medium disabled:opacity-50";
const secondaryButton = "h-control px-5 rounded-control border border-border bg-surface text-small";

// Name (and, for notebooks, icon + colour) — used for create and rename.
export function NameDialog({ title, initial = {}, withAppearance = false, confirmLabel = "Save", onSubmit, onClose }) {
  const [name, setName] = useState(initial.title || "");
  const [icon, setIcon] = useState(initial.icon || NOTEBOOK_ICONS[0]);
  const [color, setColor] = useState(initial.color || NOTEBOOK_COLORS[0]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(withAppearance ? { title: name.trim(), icon, color } : { title: name.trim() });
  };

  return (
    <DialogShell title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Name" className={inputClass} />

        {withAppearance && (
          <>
            <div className="flex flex-wrap gap-2">
              {NOTEBOOK_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  aria-pressed={icon === i}
                  className={`h-10 w-10 rounded-xl text-xl ${icon === i ? "bg-surface ring-2 ring-primary" : "hover:bg-surface"}`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {NOTEBOOK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Colour ${c}`}
                  aria-pressed={color === c}
                  className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-primary scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
          <button type="submit" disabled={!name.trim()} className={primaryButton}>{confirmLabel}</button>
        </div>
      </form>
    </DialogShell>
  );
}

// Flattened, indented topic options for one notebook.
const topicOptions = (topics, notebookId, excludeId = null) => {
  const children = new Map();
  topics
    .filter((t) => String(t.notebook) === String(notebookId))
    .forEach((t) => {
      const key = String(t.parent || "");
      if (!children.has(key)) children.set(key, []);
      children.get(key).push(t);
    });

  const out = [];
  const walk = (parent, depth) => {
    (children.get(parent) || []).forEach((t) => {
      if (String(t._id) === String(excludeId)) return; // can't move inside itself
      out.push({ id: String(t._id), title: t.title, depth });
      walk(String(t._id), depth + 1);
    });
  };
  walk("", 0);
  return out;
};

// Move a note (to a notebook/topic) or a topic (to a notebook/parent topic).
export function MoveDialog({ item, type, notebooks, topics, onSubmit, onClose }) {
  const [notebook, setNotebook] = useState(String(item.notebook));
  const [target, setTarget] = useState(String((type === "note" ? item.topic : item.parent) || ""));

  const options = useMemo(
    () => topicOptions(topics, notebook, type === "topic" ? item._id : null),
    [topics, notebook, type, item._id],
  );

  return (
    <DialogShell title={`Move “${item.title}”`} onClose={onClose}>
      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-label">Notebook</span>
          <select
            value={notebook}
            onChange={(e) => {
              setNotebook(e.target.value);
              setTarget("");
            }}
            className={inputClass}
          >
            {notebooks.map((n) => (
              <option key={n._id} value={n._id}>
                {n.icon} {n.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-label">{type === "note" ? "Topic" : "Inside topic"}</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
            <option value="">— Top level of the notebook —</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {"  ".repeat(o.depth)}
                {o.depth ? "└ " : ""}
                {o.title}
              </option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
          <button
            type="button"
            className={primaryButton}
            onClick={() =>
              onSubmit(
                type === "note"
                  ? { notebook, topic: target || null }
                  : { notebook, parent: target || null },
              )
            }
          >
            Move
          </button>
        </div>
      </div>
    </DialogShell>
  );
}
