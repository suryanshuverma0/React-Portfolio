import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Target, Plus, Trash2, Pencil, X, ArrowDown, Loader2 } from "lucide-react";

import SkeletonCard from "../../components/common/SkeletonCard";
import ConfirmModal from "../components/ui/ConfirmModal";
import { Panel, Empty, ChartTooltip, RankBars } from "../components/charts/ChartKit";
import { AXIS_TICK, GRID, formatDay } from "../components/charts/chartTokens";
import { getGoals, createGoal, updateGoal, deleteGoal } from "../services/goals.service";
import { formatDuration } from "../components/visitors/visitorFormat";

/* ========================================
   GOALS & FUNNELS — a goal is one step
   (conversion rate), a funnel is several
   steps that must happen in order within
   one session.
========================================= */

const rangeOptions = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
  { label: "All Time", value: 3650 },
];

const STEP_TYPES = [
  { value: "page_view", label: "Opened page", hint: "Path contains, e.g. /blog" },
  { value: "section_view", label: "Viewed section", hint: "Section id, e.g. projects" },
  { value: "click", label: "Clicked", hint: "Button / link text" },
  { value: "outbound_click", label: "Opened external link", hint: "e.g. github.com" },
  { value: "download", label: "Downloaded", hint: "e.g. resume" },
  { value: "contact_link", label: "Contact link", hint: "e.g. mailto, tel" },
  { value: "form_submit", label: "Submitted form", hint: "Form name (optional)" },
];

const typeLabel = (type) => STEP_TYPES.find((t) => t.value === type)?.label || type;

const PRESETS = [
  { name: "Contact form submitted", steps: [{ type: "form_submit", match: "" }] },
  { name: "Resume downloaded", steps: [{ type: "download", match: "resume" }] },
  { name: "Reached out (email / phone)", steps: [{ type: "contact_link", match: "" }] },
  { name: "Opened GitHub", steps: [{ type: "outbound_click", match: "github" }] },
  {
    name: "Projects → Contact funnel",
    steps: [
      { type: "section_view", match: "projects", label: "Saw projects" },
      { type: "section_view", match: "contact", label: "Reached contact" },
      { type: "form_submit", match: "", label: "Sent a message" },
    ],
  },
];

const emptyStep = () => ({ type: "page_view", match: "", label: "" });

const inputClass = "h-control px-3 rounded-control bg-surface border border-border text-small outline-none focus:border-primary";
const buttonClass = "h-control px-4 rounded-control border border-border bg-surface text-small inline-flex items-center gap-2 disabled:opacity-50";
const primaryClass = "h-control px-5 rounded-control bg-primary text-background text-small font-medium inline-flex items-center gap-2 disabled:opacity-50";

/* ---------- editor ---------- */

function GoalEditor({ initial, onSave, onCancel, saving }) {
  const [name, setName] = useState(initial?.name || "");
  const [steps, setSteps] = useState(initial?.steps?.length ? initial.steps.map((s) => ({ ...emptyStep(), ...s })) : [emptyStep()]);

  const setStep = (index, patch) => setSteps((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const submit = (event) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("Give the goal a name");
    onSave({ name: name.trim(), steps: steps.map(({ type, match, label }) => ({ type, match: match.trim(), label: label.trim() })) });
  };

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title">{initial?._id ? "Edit goal" : "New goal"}</h2>
        <button type="button" onClick={onCancel} className="text-muted hover:text-primary" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <label className="block space-y-2">
        <span className="text-label">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="e.g. Resume downloaded" className={`${inputClass} w-full`} />
      </label>

      <div className="space-y-3">
        <p className="text-label">
          Steps <span className="text-muted text-xs font-normal">— one step is a goal; add more for a funnel (in order, same session)</span>
        </p>

        {steps.map((step, index) => {
          const meta = STEP_TYPES.find((t) => t.value === step.type);

          return (
            <div key={index} className="grid gap-2 sm:grid-cols-[28px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] items-center">
              <span className="text-muted text-small tabular-nums">{index + 1}.</span>
              <select value={step.type} onChange={(e) => setStep(index, { type: e.target.value })} className={inputClass} aria-label="Event type">
                {STEP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                value={step.match}
                onChange={(e) => setStep(index, { match: e.target.value })}
                placeholder={`${meta?.hint || "Contains…"} (blank = any)`}
                maxLength={200}
                className={inputClass}
                aria-label="Matches text"
              />
              <input
                value={step.label}
                onChange={(e) => setStep(index, { label: e.target.value })}
                placeholder="Step label (optional)"
                maxLength={80}
                className={inputClass}
                aria-label="Step label"
              />
              <button
                type="button"
                disabled={steps.length === 1}
                onClick={() => setSteps((list) => list.filter((_, i) => i !== index))}
                className="h-control aspect-square inline-flex items-center justify-center rounded-control border border-border bg-surface disabled:opacity-30"
                aria-label="Remove step"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        <button type="button" disabled={steps.length >= 8} onClick={() => setSteps((list) => [...list, emptyStep()])} className={buttonClass}>
          <Plus size={15} /> Add step
        </button>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={buttonClass}>
          Cancel
        </button>
        <button type="submit" disabled={saving} className={primaryClass}>
          {saving && <Loader2 size={15} className="animate-spin" />} Save goal
        </button>
      </div>
    </form>
  );
}

/* ---------- results ---------- */

function FunnelSteps({ goal }) {
  return (
    <ol className="space-y-2">
      {goal.steps.map((step, index) => (
        <li key={index} className="space-y-2">
          {index > 0 && (
            <p className="text-xs text-muted inline-flex items-center gap-1.5 pl-1">
              <ArrowDown size={12} /> {step.fromPrevious}% continued · {goal.steps[index - 1].sessions - step.sessions} dropped off
            </p>
          )}
          <div className="space-y-1.5" title={`${step.sessions} sessions · ${step.fromStart}% of all sessions`}>
            <div className="flex justify-between gap-3 text-small">
              <span className="truncate">
                <span className="text-muted tabular-nums">{index + 1}.</span> {step.label || typeLabel(step.type)}
                {step.match && <span className="text-muted"> · “{step.match}”</span>}
              </span>
              <span className="shrink-0 tabular-nums">
                {step.sessions} <span className="text-muted">· {step.fromStart}%</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(step.fromStart, step.sessions ? 2 : 0)}%`, backgroundColor: "var(--color-chart-1)" }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function GoalCard({ goal, onEdit, onDelete }) {
  const isFunnel = goal.steps.length > 1;

  return (
    <Panel
      title={goal.name}
      subtitle={isFunnel ? `${goal.steps.length}-step funnel` : typeLabel(goal.steps[0]?.type)}
      right={
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="h-control aspect-square inline-flex items-center justify-center rounded-control border border-border bg-surface" aria-label="Edit goal">
            <Pencil size={14} />
          </button>
          <button type="button" onClick={onDelete} className="h-control aspect-square inline-flex items-center justify-center rounded-control border border-border bg-surface" aria-label="Delete goal">
            <Trash2 size={14} />
          </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div>
            <p className="text-small">Conversion rate</p>
            <p className="text-heading tabular-nums">{goal.conversionRate}%</p>
            <p className="text-muted text-xs">
              {goal.conversions} of {goal.totalSessions} sessions
            </p>
          </div>
          <div>
            <p className="text-small">Median time to convert</p>
            <p className="text-title tabular-nums">{goal.conversions ? formatDuration(goal.medianTimeToConvertMs) : "—"}</p>
            <p className="text-muted text-xs">From session start</p>
          </div>
        </div>

        <div className="space-y-6 min-w-0">
          {isFunnel && <FunnelSteps goal={goal} />}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="min-w-0">
              <p className="text-label mb-3">Conversions per day</p>
              {goal.daily.length ? (
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={goal.daily} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="date" tickFormatter={formatDay} tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={16} />
                      <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "var(--color-surface)" }} content={<ChartTooltip labelFormatter={formatDay} />} />
                      <Bar dataKey="count" name="Conversions" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty>No conversions in this range.</Empty>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-label mb-3">Converting visitors came from</p>
              <RankBars items={goal.topSources.map((s) => ({ key: s.label, label: s.label, value: s.count }))} />
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- page ---------- */

function Goals() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null); // null | {} (new) | goal
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getGoals(range)
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && toast.error("Failed to load goals"));

    return () => {
      cancelled = true;
    };
  }, [range, reloadKey]);

  const load = () => setReloadKey((key) => key + 1);

  const save = async (body) => {
    try {
      setSaving(true);
      if (editing?._id) await updateGoal(editing._id, body);
      else await createGoal(body);
      toast.success("Goal saved");
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.errors?.[0]?.message || error.response?.data?.message || "Couldn't save the goal");
    } finally {
      setSaving(false);
    }
  };

  const addPreset = async (preset) => {
    try {
      await createGoal(preset);
      toast.success(`Added "${preset.name}"`);
      load();
    } catch {
      toast.error("Couldn't add the goal");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteGoal(deleting._id);
      toast.success("Goal deleted");
      setDeleting(null);
      load();
    } catch {
      toast.error("Couldn't delete the goal");
    }
  };

  const existingNames = new Set(data?.goals.map((g) => g.name));

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading inline-flex items-center gap-3">
            <Target size={28} /> Goals &amp; Funnels
          </h1>
          <p className="text-body mt-3">How many visitors do what you want them to — and where the rest drop off.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              className={`h-control px-4 rounded-control border border-border text-small transition ${range === option.value ? "bg-primary text-background" : "bg-surface"}`}
            >
              {option.label}
            </button>
          ))}
          <button type="button" onClick={() => setEditing({})} className={primaryClass}>
            <Plus size={15} /> New goal
          </button>
        </div>
      </section>

      {editing && <GoalEditor key={editing._id || "new"} initial={editing} onSave={save} onCancel={() => setEditing(null)} saving={saving} />}

      {PRESETS.some((p) => !existingNames.has(p.name)) && (
        <section className="card space-y-3">
          <p className="text-label">Quick add</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter((p) => !existingNames.has(p.name)).map((preset) => (
              <button key={preset.name} type="button" onClick={() => addPreset(preset)} className={buttonClass}>
                <Plus size={14} /> {preset.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {!data ? (
        <SkeletonCard />
      ) : !data.goals.length ? (
        <section className="card">
          <p className="text-body">No goals yet. Add one of the suggestions above, or create your own.</p>
        </section>
      ) : (
        <div className="space-y-6">
          {data.goals.map((goal) => (
            <GoalCard key={goal._id} goal={goal} onEdit={() => setEditing(goal)} onDelete={() => setDeleting(goal)} />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleting)}
        title="Delete this goal?"
        message="Only the goal definition is removed — visitor data is untouched."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

export default Goals;
