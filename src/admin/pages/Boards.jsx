import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Presentation, Plus, Search, Pin, PinOff, Copy, Trash2, X, Gavel, ListChecks } from "lucide-react";

import api from "../../lib/axios";
import LifeGate from "../life/LifeGate";
import { TEMPLATES, STICKY_COLORS } from "../boards/boardKit";

/* ========================================
   BOARDS — vision boards, brainstorms, flow
   diagrams and meeting boards. Cards show a
   little 3D stack of sticky notes until the
   board has its own thumbnail.
========================================= */

const data = (r) => r.data.data;
const fail = (e, m) => e?.response?.status !== 423 && toast.error(e?.response?.data?.message || m);

function StickyStack({ color, emoji }) {
  return (
    <div className="relative flex h-full items-center justify-center" style={{ perspective: 600 }}>
      {[2, 1, 0].map((i) => {
        const c = STICKY_COLORS[(STICKY_COLORS.findIndex((s) => s.fill === color) + i + STICKY_COLORS.length) % STICKY_COLORS.length] || STICKY_COLORS[i];
        return (
          <motion.span
            key={i}
            className="absolute flex h-24 w-24 items-center justify-center rounded-md text-3xl shadow-[0_14px_24px_-12px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:[transform:var(--hover)]"
            style={{
              background: `linear-gradient(160deg, ${c.fill}, color-mix(in srgb, ${c.fill} 82%, ${c.stroke}))`,
              transform: `rotateX(18deg) rotateZ(${(i - 1) * 9}deg) translate(${(i - 1) * 18}px, ${i * -6}px)`,
              "--hover": `rotateX(8deg) rotateZ(${(i - 1) * 14}deg) translate(${(i - 1) * 34}px, ${i * -10}px)`,
              zIndex: 3 - i,
            }}
          >
            {i === 0 ? emoji : ""}
          </motion.span>
        );
      })}
    </div>
  );
}

function NewBoard({ onClose }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState("");
  const create = async (t) => {
    setBusy(t.id);
    try {
      const board = data(await api.post("/boards", { title: t.id === "blank" ? "Untitled board" : t.label, emoji: t.emoji, kind: t.kind, color: STICKY_COLORS[TEMPLATES.indexOf(t) % STICKY_COLORS.length].fill }));
      navigate(`/dashboard/boards/${board._id}${t.id === "blank" ? "" : `?template=${t.id}`}`);
    } catch (e) {
      fail(e, "Couldn't create the board");
      setBusy("");
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-border bg-[var(--color-card)] p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-title">Start a board</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TEMPLATES.map((t, i) => (
            <button key={t.id} type="button" disabled={Boolean(busy)} onClick={() => create(t)} className="group flex flex-col overflow-hidden rounded-2xl border border-border text-left transition hover:-translate-y-0.5 hover:border-primary disabled:opacity-60">
              <div className="h-28 bg-surface">
                <StickyStack color={STICKY_COLORS[i % STICKY_COLORS.length].fill} emoji={t.emoji} />
              </div>
              <div className="p-3">
                <p className="text-small font-medium">{busy === t.id ? "Creating…" : t.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted">{t.hint}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function BoardsBody() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState(null);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () =>
    api
      .get("/boards")
      .then((r) => setBoards(data(r)))
      .catch((e) => fail(e, "Couldn't load boards"));

  useEffect(() => {
    load();
  }, []);

  const patch = async (b, change) => {
    setBoards((list) => list.map((x) => (x._id === b._id ? { ...x, ...change } : x)));
    await api.patch(`/boards/${b._id}`, change).catch((e) => fail(e, "Couldn't save"));
  };

  const list = (boards || []).filter((b) => !b.archived && b.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading inline-flex items-center gap-3">
            <Presentation size={28} /> Boards
          </h1>
          <p className="text-body mt-2">Vision boards, brainstorms, flow diagrams and meetings — draw with a pen, type, paste anything.</p>
        </div>
        <button type="button" onClick={() => setCreating(true)} className="btn btn-primary">
          <Plus size={16} /> New board
        </button>
      </section>

      {boards && boards.length > 3 && (
        <label className="flex h-11 max-w-md items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary">
          <Search size={15} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search boards" className="min-w-0 flex-1 bg-transparent text-small outline-none" style={{ outline: "none" }} />
        </label>
      )}

      {!boards ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-3xl bg-surface" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <button type="button" onClick={() => setCreating(true)} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border text-muted transition hover:border-primary hover:text-primary">
            <Plus size={26} />
            <span className="text-small">New board</span>
          </button>
          {list.map((b) => (
            <motion.article key={b._id} layout className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(0,0,0,0.6)]">
              <button type="button" onClick={() => navigate(`/dashboard/boards/${b._id}`)} className="relative aspect-[16/10] overflow-hidden border-b border-border bg-surface text-left">
                {b.thumbnail ? <img src={b.thumbnail} alt="" className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-[1.03]" /> : <StickyStack color={b.color} emoji={b.emoji} />}
                {b.pinned && (
                  <span className="absolute left-2 top-2 rounded-full bg-background/85 p-1 backdrop-blur">
                    <Pin size={11} />
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2 p-3">
                <span className="text-lg">{b.emoji}</span>
                <button type="button" onClick={() => navigate(`/dashboard/boards/${b._id}`)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-small font-semibold">{b.title}</span>
                  <span className="flex items-center gap-2 text-[11px] text-muted">
                    {new Date(b.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {b.decisions?.length > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Gavel size={10} /> {b.decisions.length}
                      </span>
                    )}
                    {b.actions?.length > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <ListChecks size={10} /> {b.actions.filter((a) => a.done).length}/{b.actions.length}
                      </span>
                    )}
                  </span>
                </button>
                <div className="flex opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                  <button type="button" onClick={() => patch(b, { pinned: !b.pinned })} className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary" title={b.pinned ? "Unpin" : "Pin"}>
                    {b.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                  <button type="button" onClick={async () => { await api.post(`/boards/${b._id}/duplicate`).catch((e) => fail(e, "Couldn't duplicate")); load(); }} className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary" title="Duplicate">
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Delete “${b.title}”? This can't be undone.`)) return;
                      await api.delete(`/boards/${b._id}`).catch((e) => fail(e, "Couldn't delete"));
                      load();
                    }}
                    className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
      {creating && <NewBoard onClose={() => setCreating(false)} />}
    </div>
  );
}

function Boards() {
  return (
    <LifeGate>
      <BoardsBody />
    </LifeGate>
  );
}

export default Boards;
