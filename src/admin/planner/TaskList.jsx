import { useState } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import { Check, Clock, GripVertical, Plus, Trash2, CalendarArrowUp, Tag, X, ListChecks } from "lucide-react";

import { addDays, monthKey, periodLabel, today, weekKey, yearKey } from "./dates";

/* ========================================
   TASK LIST — one period's to-dos. Quick
   add understands  !, !!, !!! (priority),
   #area  and  @14:30 / @9am  (time).
========================================= */

const PRIORITY = [
  { label: "None", color: "var(--color-border)" },
  { label: "Low", color: "var(--color-chart-3)" },
  { label: "Medium", color: "var(--color-chart-4)" },
  { label: "High", color: "var(--color-chart-2)" },
];

const parseQuick = (raw) => {
  let text = ` ${raw} `;
  let priority = 0;
  let area = "";
  let time = "";
  text = text.replace(/\s(!{1,3})(?=\s)/, (_, b) => {
    priority = b.length;
    return " ";
  });
  text = text.replace(/\s#([\p{L}\p{N}_-]{1,40})(?=\s)/u, (_, a) => {
    area = a;
    return " ";
  });
  text = text.replace(/\s@(\d{1,2})(?::(\d{2}))?\s?(am|pm)?(?=\s)/i, (_, h, m, ap) => {
    let hour = Number(h) % 24;
    if (ap?.toLowerCase() === "pm" && hour < 12) hour += 12;
    if (ap?.toLowerCase() === "am" && hour === 12) hour = 0;
    time = `${String(hour).padStart(2, "0")}:${m || "00"}`;
    return " ";
  });
  return { title: text.trim().replace(/\s+/g, " "), priority, area, time };
};

const moveTargets = () => {
  const t = today();
  return [
    { label: "Today", scope: "day", period: t },
    { label: "Tomorrow", scope: "day", period: addDays(t, 1) },
    { label: "This week", scope: "week", period: weekKey(t) },
    { label: "Next week", scope: "week", period: weekKey(addDays(t, 7)) },
    { label: "This month", scope: "month", period: monthKey(t) },
    { label: "This year", scope: "year", period: yearKey(t) },
    { label: "Someday", scope: "someday", period: "someday" },
  ];
};

function Details({ task, api }) {
  const [notes, setNotes] = useState(task.notes || "");
  const [sub, setSub] = useState("");
  const subtasks = task.subtasks || [];
  const input = "rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-primary";
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="space-y-3 px-2 pb-3 pt-1">
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (task.notes || "") && api.update(task, { notes })} placeholder="Notes…" className={`${input} w-full resize-y`} />

        <div className="space-y-1">
          {subtasks.map((s, i) => (
            <label key={i} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={s.done} onChange={() => api.update(task, { subtasks: subtasks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })} />
              <span className={s.done ? "text-muted line-through" : ""}>{s.title}</span>
              <button type="button" onClick={() => api.update(task, { subtasks: subtasks.filter((_, j) => j !== i) })} className="ml-auto text-muted hover:text-red-500" aria-label="Remove step">
                <X size={12} />
              </button>
            </label>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!sub.trim()) return;
              api.update(task, { subtasks: [...subtasks, { title: sub.trim(), done: false }] });
              setSub("");
            }}
          >
            <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="+ Add a step" className={`${input} w-full`} />
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PRIORITY.map((p, i) => (
            <button key={p.label} type="button" onClick={() => api.update(task, { priority: i })} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${task.priority === i ? "border-primary" : "border-border text-muted"}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} /> {p.label}
            </button>
          ))}
          <input type="time" value={task.time || ""} onChange={(e) => api.update(task, { time: e.target.value })} className={`${input} py-0.5`} aria-label="Time" />
          <input defaultValue={task.area || ""} onBlur={(e) => e.target.value !== (task.area || "") && api.update(task, { area: e.target.value.trim() })} placeholder="#area" className={`${input} w-24 py-0.5`} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <CalendarArrowUp size={13} className="text-muted" />
          {moveTargets()
            .filter((m) => m.period !== task.period)
            .map((m) => (
              <button key={m.label} type="button" onClick={() => api.update(task, { scope: m.scope, period: m.period })} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted hover:border-primary hover:text-primary">
                {m.label}
              </button>
            ))}
          <button type="button" onClick={() => api.remove(task)} className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-muted hover:text-red-500">
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TaskRow({ task, api, showPeriod, draggable }) {
  const [open, setOpen] = useState(false);
  const controls = useDragControls();
  const subtasks = task.subtasks || [];
  const p = PRIORITY[task.priority || 0];

  const toggle = () => api.update(task, { done: !task.done, doneDate: task.done ? null : today() });

  const row = (
    <div className={`group rounded-xl transition ${open ? "bg-surface" : "hover:bg-surface/60"}`}>
      <div className="flex items-start gap-2 px-1.5 py-1.5">
        {draggable && (
          <button type="button" onPointerDown={(e) => { e.preventDefault(); controls.start(e); }} className="mt-0.5 cursor-grab touch-none text-muted opacity-0 group-hover:opacity-60 [@media(hover:none)]:opacity-40" aria-label="Drag">
            <GripVertical size={14} />
          </button>
        )}
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={toggle}
          disabled={task.pending}
          className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${task.done ? "border-primary bg-primary text-background" : ""}`}
          style={task.done ? undefined : { borderColor: task.priority ? p.color : "var(--color-muted)" }}
          aria-label={task.done ? "Mark not done" : "Mark done"}
        >
          {task.done && <Check size={11} strokeWidth={3} />}
        </motion.button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <span className={`block text-small leading-snug ${task.done ? "text-muted line-through" : ""}`}>{task.title}</span>
          {(task.time || task.area || subtasks.length > 0 || showPeriod) && (
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
              {showPeriod && <span className="text-[var(--color-chart-2)]">{periodLabel(task.scope, task.period)}</span>}
              {task.time && (
                <span className="inline-flex items-center gap-0.5">
                  <Clock size={10} /> {task.time}
                </span>
              )}
              {task.area && (
                <span className="inline-flex items-center gap-0.5">
                  <Tag size={10} /> {task.area}
                </span>
              )}
              {subtasks.length > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <ListChecks size={10} /> {subtasks.filter((s) => s.done).length}/{subtasks.length}
                </span>
              )}
            </span>
          )}
        </button>
      </div>
      <AnimatePresence initial={false}>{open && <Details task={task} api={api} />}</AnimatePresence>
    </div>
  );

  if (!draggable) return row;
  return (
    <Reorder.Item value={task} dragListener={false} dragControls={controls} className="list-none" whileDrag={{ scale: 1.02, zIndex: 10 }}>
      {row}
    </Reorder.Item>
  );
}

export function QuickAdd({ onAdd, placeholder = "Add a task — !! priority, #area, @9am", autoFocus }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = parseQuick(value);
        if (!parsed.title) return;
        onAdd(parsed);
        setValue("");
      }}
      className="flex items-center gap-2 rounded-xl border border-dashed border-border px-2.5 transition focus-within:border-solid focus-within:border-primary"
    >
      <Plus size={15} className="shrink-0 text-muted" />
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} className="h-9 min-w-0 flex-1 bg-transparent text-small outline-none" style={{ outline: "none" }} />
    </form>
  );
}

function TaskList({ tasks, scope, period, api, title, right, empty = "Nothing here yet.", showPeriod = false, addable = true, className = "" }) {
  const open = tasks.filter((t) => !t.done).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.priority || 0) - (a.priority || 0));
  const done = tasks.filter((t) => t.done);
  const [showDone, setShowDone] = useState(true);

  return (
    <div className={`space-y-2 ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-2 px-1">
          {title && <h3 className="text-[13px] font-semibold">{title}</h3>}
          {right}
        </div>
      )}
      {addable && <QuickAdd onAdd={(parsed) => api.create({ ...parsed, scope, period })} />}
      {open.length === 0 && done.length === 0 && <p className="px-2 py-1 text-xs text-muted">{empty}</p>}
      {period && !showPeriod ? (
        <Reorder.Group axis="y" values={open} onReorder={(next) => api.reorder(period, next)} className="space-y-0.5">
          {open.map((t) => (
            <TaskRow key={t._id} task={t} api={api} draggable />
          ))}
        </Reorder.Group>
      ) : (
        <div className="space-y-0.5">
          {open.map((t) => (
            <TaskRow key={t._id} task={t} api={api} showPeriod={showPeriod} />
          ))}
        </div>
      )}
      {done.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowDone((s) => !s)} className="px-2 text-[11px] text-muted hover:text-primary">
            {showDone ? "Hide" : "Show"} {done.length} done
          </button>
          {showDone && (
            <div className="space-y-0.5">
              {done.map((t) => (
                <TaskRow key={t._id} task={t} api={api} showPeriod={showPeriod} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskList;
