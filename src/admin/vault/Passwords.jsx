import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  KeyRound, Plus, Search, Copy, Eye, EyeOff, ExternalLink, Pencil, Trash2, X, RefreshCw, Star, ShieldAlert, ShieldCheck, Repeat2,
  Clock, Upload, Download, Loader2, Smartphone, History, Wand2, Check,
} from "lucide-react";

import api from "../../lib/axios";
import { saveItem } from "./vaultSession";
import {
  generatePassword, generatePassphrase, passphraseBits, strengthOf, crackTime, totpCode, parseTotp, pwnedCount, parsePasswordCsv, toPasswordCsv, hostOf,
} from "./passwordTools";

/* ========================================
   PASSWORDS — a password manager inside the
   encrypted vault. Every login (site, user,
   password, 2FA secret, notes, history) is
   sealed with the vault key in this browser.
   - copy clears the clipboard after 30 s
   - no site icons fetched (that would tell
     a third party which sites you use)
========================================= */

const CLEAR_AFTER = 30;
const YEAR = 365 * 24 * 60 * 60 * 1000;
const input = "h-11 w-full rounded-xl border border-border bg-surface px-3 text-small outline-none focus:border-primary";
const fail = (e, msg) => e?.response?.status !== 423 && toast.error(e?.response?.data?.message || e?.message || msg);

let clearTimer = null;
const copySecret = async (value, label) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied — clipboard clears in ${CLEAR_AFTER}s`);
    clearTimeout(clearTimer);
    clearTimer = setTimeout(async () => {
      try {
        const current = await navigator.clipboard.readText();
        if (current === value) await navigator.clipboard.writeText("");
      } catch {
        // Reading needs focus/permission; clear anyway if we can.
        navigator.clipboard.writeText("").catch(() => {});
      }
    }, CLEAR_AFTER * 1000);
  } catch {
    toast.error("Couldn't copy");
  }
};

const Avatar = ({ entry, size = 40 }) => {
  const name = hostOf(entry.url) || entry.title || "?";
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % 360;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold text-white" style={{ width: size, height: size, background: `linear-gradient(135deg, hsl(${hash} 65% 50%), hsl(${(hash + 40) % 360} 65% 40%))` }}>
      {name[0].toUpperCase()}
    </span>
  );
};

/* ---------- generator ---------- */

function Generator({ onUse, compact = false }) {
  const [mode, setMode] = useState("password");
  const [opts, setOpts] = useState({ length: 20, lower: true, upper: true, digits: true, symbols: true, words: 5 });
  const [value, setValue] = useState(() => generatePassword({ length: 20 }));
  const regen = (next = opts, m = mode) => setValue(m === "password" ? generatePassword(next) : generatePassphrase({ words: next.words }));
  const set = (patch) => {
    const next = { ...opts, ...patch };
    setOpts(next);
    regen(next);
  };
  const s = strengthOf(value);
  const bits = mode === "passphrase" ? passphraseBits(opts.words, true) : s.bits;

  return (
    <div className={`space-y-3 rounded-2xl border border-border bg-surface/50 ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-xl bg-background px-3 py-2.5 font-mono text-[14px]">{value}</code>
        <button type="button" onClick={() => regen()} className="rounded-xl border border-border p-2.5 hover:border-primary" aria-label="New password" title="Generate another">
          <RefreshCw size={15} />
        </button>
        <button type="button" onClick={() => copySecret(value, "Password")} className="rounded-xl border border-border p-2.5 hover:border-primary" aria-label="Copy">
          <Copy size={15} />
        </button>
      </div>
      <div className="flex items-center gap-2 text-[12px]">
        <span className={`font-medium ${s.text}`}>{mode === "passphrase" ? (bits >= 60 ? "Strong" : "Good") : s.label}</span>
        <span className="text-muted">
          · {bits} bits · cracking would take {crackTime(bits)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-1">
        {[
          ["password", "Random"],
          ["passphrase", "Words"],
        ].map(([v, l]) => (
          <button key={v} type="button" onClick={() => { setMode(v); regen(opts, v); }} className={`rounded-lg py-1.5 text-xs ${mode === v ? "bg-surface font-medium" : "text-muted"}`}>
            {l}
          </button>
        ))}
      </div>
      {mode === "password" ? (
        <>
          <label className="flex items-center gap-3 text-xs">
            Length
            <input type="range" min={8} max={64} value={opts.length} onChange={(e) => set({ length: Number(e.target.value) })} className="flex-1 accent-current" />
            <span className="w-6 text-right tabular-nums">{opts.length}</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["upper", "A–Z"],
              ["lower", "a–z"],
              ["digits", "0–9"],
              ["symbols", "!@#"],
            ].map(([k, l]) => (
              <button key={k} type="button" onClick={() => set({ [k]: !opts[k] })} className={`rounded-full border px-3 py-1 text-xs ${opts[k] ? "border-primary bg-primary text-background" : "border-border text-muted"}`}>
                {l}
              </button>
            ))}
          </div>
        </>
      ) : (
        <label className="flex items-center gap-3 text-xs">
          Words
          <input type="range" min={3} max={10} value={opts.words} onChange={(e) => set({ words: Number(e.target.value) })} className="flex-1 accent-current" />
          <span className="w-6 text-right tabular-nums">{opts.words}</span>
        </label>
      )}
      {onUse && (
        <button type="button" onClick={() => onUse(value)} className="btn btn-primary w-full">
          <Check size={15} /> Use this password
        </button>
      )}
    </div>
  );
}

/* ---------- live 2FA code ---------- */

function TotpCode({ secret }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    let alive = true;
    const tick = () => totpCode(secret).then((s) => alive && setState(s)).catch(() => alive && setState(null));
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [secret]);
  if (!state) return <span className="text-xs text-red-500">Invalid 2FA secret</span>;
  const pct = state.remaining / state.period;
  return (
    <button type="button" onClick={() => copySecret(state.code, "2FA code")} className="flex items-center gap-3" title="Copy code">
      <span className="font-mono text-[22px] font-semibold tracking-[0.2em] tabular-nums">
        {state.code.slice(0, 3)} {state.code.slice(3)}
      </span>
      <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-border)" strokeWidth="4" />
        <circle cx="18" cy="18" r="15" fill="none" stroke={state.remaining <= 5 ? "#ef4444" : "var(--color-chart-3)"} strokeWidth="4" strokeDasharray={94.2} strokeDashoffset={94.2 * (1 - pct)} />
      </svg>
      <span className="text-[11px] text-muted">{state.remaining}s</span>
    </button>
  );
}

/* ---------- editor ---------- */

function Editor({ vk, initial, categories, onClose, onSaved }) {
  const [e, setE] = useState(() => ({ type: "login", title: "", url: "", username: "", password: "", totp: "", notes: "", category: "", favorite: false, history: [], files: [], fields: [], ...initial?.meta }));
  const [show, setShow] = useState(!initial);
  const [gen, setGen] = useState(!initial);
  const [busy, setBusy] = useState(false);
  const set = (patch) => setE((x) => ({ ...x, ...patch }));
  const s = strengthOf(e.password);

  const save = async (ev) => {
    ev.preventDefault();
    const title = e.title.trim() || hostOf(e.url) || e.username;
    if (!title) return toast.error("Add a name or website");
    if (!e.password) return toast.error("Add the password");
    if (e.totp && !parseTotp(e.totp)?.secret) return toast.error("That 2FA secret doesn't look right");
    const old = initial?.meta;
    const changed = old && old.password !== e.password;
    const meta = {
      ...e,
      title,
      url: e.url.trim() && !/^https?:\/\//i.test(e.url.trim()) ? `https://${e.url.trim()}` : e.url.trim(),
      passwordUpdatedAt: changed || !old ? new Date().toISOString() : old.passwordUpdatedAt || initial?.createdAt,
      history: changed ? [{ password: old.password, changedAt: new Date().toISOString() }, ...(old.history || [])].slice(0, 5) : e.history || [],
      breach: changed ? null : e.breach || null,
      files: [],
      fields: [],
    };
    setBusy(true);
    try {
      await saveItem(vk, initial, meta);
      onSaved();
    } catch (err) {
      fail(err, "Couldn't save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <motion.form initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onSubmit={save} autoComplete="off" className="max-h-[94dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-3xl border border-border bg-[var(--color-card)] p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-title">{initial ? "Edit login" : "New login"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <input className={input} value={e.url} onChange={(ev) => set({ url: ev.target.value })} onBlur={() => !e.title && hostOf(e.url) && set({ title: hostOf(e.url) })} placeholder="Website (github.com)" autoFocus autoComplete="off" />
        <input className={input} value={e.title} onChange={(ev) => set({ title: ev.target.value })} placeholder="Name" autoComplete="off" />
        <input className={input} value={e.username} onChange={(ev) => set({ username: ev.target.value })} placeholder="Username or email" autoComplete="off" name="vault-username" />
        <div className="space-y-1.5">
          <div className="flex items-center rounded-xl border border-border bg-surface pr-1 focus-within:border-primary">
            <input type={show ? "text" : "password"} value={e.password} onChange={(ev) => set({ password: ev.target.value })} placeholder="Password" autoComplete="new-password" name="vault-password" className="h-11 min-w-0 flex-1 bg-transparent px-3 font-mono text-small outline-none" style={{ outline: "none" }} />
            <button type="button" onClick={() => setShow((x) => !x)} className="p-2 text-muted" aria-label={show ? "Hide" : "Show"}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button type="button" onClick={() => setGen((x) => !x)} className={`rounded-lg p-2 ${gen ? "text-primary" : "text-muted"}`} title="Generator">
              <Wand2 size={15} />
            </button>
          </div>
          {e.password && (
            <div className="flex items-center gap-2 px-1">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`h-1 flex-1 rounded-full ${i <= s.level ? s.color : "bg-border"}`} />
                ))}
              </div>
              <span className={`text-[11px] ${s.text}`}>
                {s.label} · {crackTime(s.bits)}
              </span>
            </div>
          )}
        </div>
        {gen && (
          <Generator
            compact
            onUse={(pw) => {
              set({ password: pw });
              setGen(false);
              setShow(true);
            }}
          />
        )}
        <input className={`${input} font-mono text-xs`} value={e.totp} onChange={(ev) => set({ totp: ev.target.value })} placeholder="2FA secret or otpauth:// link (optional)" autoComplete="off" />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input className={input} list="pw-cats" value={e.category} onChange={(ev) => set({ category: ev.target.value })} placeholder="Folder (Work, Banking…)" />
          <datalist id="pw-cats">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <button type="button" onClick={() => set({ favorite: !e.favorite })} className={`rounded-xl border px-3 ${e.favorite ? "border-primary text-primary" : "border-border text-muted"}`} aria-label="Favorite">
            <Star size={15} className={e.favorite ? "fill-current" : ""} />
          </button>
        </div>
        <textarea rows={2} className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-small outline-none focus:border-primary" value={e.notes} onChange={(ev) => set({ notes: ev.target.value })} placeholder="Notes (recovery codes, security questions…)" />
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy && <Loader2 size={15} className="animate-spin" />} Encrypt & save
        </button>
      </motion.form>
    </div>
  );
}

/* ---------- detail ---------- */

function Detail({ item, reused, onClose, onEdit, onDelete }) {
  const e = item.meta;
  const [show, setShow] = useState(false);
  const [history, setHistory] = useState(false);
  const s = strengthOf(e.password);
  const [now] = useState(() => Date.now());
  const age = e.passwordUpdatedAt ? now - new Date(e.passwordUpdatedAt) : 0;

  const row = ({ label, value, secret, mono }) => (
    <div key={label} className="flex items-center gap-3 px-3 py-2.5">
      <span className="w-20 shrink-0 text-xs text-muted">{label}</span>
      <span className={`min-w-0 flex-1 break-all text-small ${mono ? "font-mono" : ""}`}>{secret && !show ? "•".repeat(Math.min(14, value.length)) : value}</span>
      {secret && (
        <button type="button" onClick={() => setShow((x) => !x)} className="text-muted hover:text-primary" aria-label={show ? "Hide" : "Show"}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
      <button type="button" onClick={() => copySecret(value, label)} className="text-muted hover:text-primary" aria-label={`Copy ${label}`}>
        <Copy size={14} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-[var(--color-card)] p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center gap-3">
          <Avatar entry={e} size={46} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-title">{e.title}</h2>
            <p className="truncate text-xs text-muted">{hostOf(e.url) || e.category || "Login"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
          <span className={`rounded-full bg-surface px-2.5 py-1 ${s.text}`}>{s.label} password</span>
          {reused > 1 && <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-600">Reused on {reused - 1} other site{reused > 2 ? "s" : ""}</span>}
          {e.breach?.count > 0 && <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-red-500">Seen in {e.breach.count.toLocaleString()} breaches — change it</span>}
          {age > YEAR && <span className="rounded-full bg-surface px-2.5 py-1 text-muted">Over a year old</span>}
        </div>
        <div className="divide-y divide-border rounded-2xl border border-border">
          {e.username && row({ label: "Username", value: e.username })}
          {row({ label: "Password", value: e.password, secret: true, mono: true })}
          {e.url && (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-20 shrink-0 text-xs text-muted">Website</span>
              <span className="min-w-0 flex-1 truncate text-small">{e.url}</span>
              <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary" aria-label="Open site">
                <ExternalLink size={14} />
              </a>
            </div>
          )}
          {e.totp && (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-20 shrink-0 text-xs text-muted">2FA code</span>
              <TotpCode secret={e.totp} />
            </div>
          )}
        </div>
        {e.notes && <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-surface p-3 text-small">{e.notes}</p>}
        {e.history?.length > 0 && (
          <div className="mt-3">
            <button type="button" onClick={() => setHistory((x) => !x)} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary">
              <History size={13} /> Password history ({e.history.length})
            </button>
            {history && (
              <ul className="mt-2 space-y-1">
                {e.history.map((h, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs">
                    <span className="min-w-0 flex-1 truncate font-mono">{show ? h.password : "••••••••••"}</span>
                    <span className="text-muted">{new Date(h.changedAt).toLocaleDateString()}</span>
                    <button type="button" onClick={() => copySecret(h.password, "Old password")} className="text-muted hover:text-primary" aria-label="Copy">
                      <Copy size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted">Password set {e.passwordUpdatedAt ? new Date(e.passwordUpdatedAt).toLocaleDateString() : "—"}</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onEdit} className="btn btn-outline flex-1">
            <Pencil size={14} /> Edit
          </button>
          <button type="button" onClick={onDelete} className="btn btn-outline text-red-500">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- main ---------- */

function Passwords({ vk, items, reload }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(null);
  const [checking, setChecking] = useState(null);
  const [showGen, setShowGen] = useState(false);
  const fileRef = useRef(null);
  const [now] = useState(() => Date.now());

  const logins = items;
  const reuseCount = useMemo(() => {
    const m = new Map();
    logins.forEach((i) => i.meta.password && m.set(i.meta.password, (m.get(i.meta.password) || 0) + 1));
    return m;
  }, [logins]);
  const health = useMemo(() => {
    const weak = logins.filter((i) => strengthOf(i.meta.password).level === 0);
    const reused = logins.filter((i) => reuseCount.get(i.meta.password) > 1);
    const old = logins.filter((i) => i.meta.passwordUpdatedAt && now - new Date(i.meta.passwordUpdatedAt) > YEAR);
    const breached = logins.filter((i) => i.meta.breach?.count > 0);
    const issues = new Set([...weak, ...reused, ...breached].map((i) => i._id));
    const score = logins.length ? Math.round(((logins.length - issues.size) / logins.length) * 100) : 100;
    return { weak, reused, old, breached, score };
  }, [logins, reuseCount, now]);
  const categories = useMemo(() => [...new Set(logins.map((i) => i.meta.category).filter(Boolean))], [logins]);

  const pools = { all: logins, favorites: logins.filter((i) => i.meta.favorite), weak: health.weak, reused: health.reused, old: health.old, breached: health.breached };
  const list = (pools[filter] || logins)
    .filter((i) => `${i.meta.title} ${i.meta.url} ${i.meta.username} ${i.meta.category} ${i.meta.notes}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(Boolean(b.meta.favorite)) - Number(Boolean(a.meta.favorite)) || a.meta.title.localeCompare(b.meta.title));

  const remove = async (item) => {
    if (!window.confirm(`Delete the login for “${item.meta.title}”? This can't be undone.`)) return;
    try {
      await api.delete(`/vault/items/${item._id}`);
      setOpen(null);
      reload();
    } catch (e) {
      fail(e, "Couldn't delete");
    }
  };

  // Breach check: only a 5-character hash prefix leaves this device.
  const checkBreaches = async () => {
    if (!window.confirm("Check your passwords against known data breaches?\n\nPrivacy: only the first 5 characters of each password's SHA-1 hash are sent to Have I Been Pwned — never the password itself.")) return;
    setChecking({ done: 0, total: logins.length, found: 0 });
    let found = 0;
    try {
      const seen = new Map();
      for (const [n, item] of logins.entries()) {
        const pw = item.meta.password;
        const count = seen.has(pw) ? seen.get(pw) : await pwnedCount(pw);
        seen.set(pw, count);
        if (count) found += 1;
        if ((item.meta.breach?.count || 0) !== count) await saveItem(vk, item, { ...item.meta, breach: { count, checkedAt: new Date().toISOString() } });
        setChecking({ done: n + 1, total: logins.length, found });
      }
      toast[found ? "warning" : "success"](found ? `${found} password${found > 1 ? "s" : ""} found in breaches — change ${found > 1 ? "them" : "it"}` : "None of your passwords appear in known breaches");
    } catch (e) {
      fail(e, "Breach check failed");
    } finally {
      setChecking(null);
      reload();
    }
  };

  const importCsv = async (file) => {
    if (!file) return;
    try {
      const entries = parsePasswordCsv(await file.text());
      if (!entries.length) throw new Error("No logins found in that file");
      if (!window.confirm(`Import ${entries.length} logins? They'll be encrypted here before upload. Delete the CSV file afterwards — it isn't encrypted.`)) return;
      const existing = new Set(logins.map((i) => `${hostOf(i.meta.url)}|${i.meta.username}`));
      let added = 0;
      for (const en of entries) {
        if (existing.has(`${hostOf(en.url)}|${en.username}`)) continue;
        await saveItem(vk, null, { type: "login", ...en, favorite: false, history: [], files: [], fields: [], passwordUpdatedAt: new Date().toISOString() });
        added += 1;
      }
      toast.success(`Imported ${added} login${added === 1 ? "" : "s"}${entries.length - added ? ` · ${entries.length - added} already here` : ""}`);
      reload();
    } catch (e) {
      fail(e, "Import failed");
    }
  };

  const exportCsv = () => {
    if (!window.confirm("Export ALL passwords as an unencrypted CSV file?\n\nAnyone with the file can read them. Only do this to move to another password manager, and delete the file straight after.")) return;
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([toPasswordCsv(logins.map((i) => i.meta))], { type: "text/csv" })), download: `passwords-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const chips = [
    ["all", "All", logins.length, KeyRound],
    ["favorites", "Favorites", pools.favorites.length, Star],
    ["weak", "Weak", health.weak.length, ShieldAlert],
    ["reused", "Reused", health.reused.length, Repeat2],
    ["breached", "Breached", health.breached.length, ShieldAlert],
    ["old", "Old", health.old.length, Clock],
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
        <section className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4">
          <div className="relative h-16 w-16 shrink-0">
            <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-border)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15" fill="none" stroke={health.score >= 80 ? "var(--color-chart-3)" : health.score >= 50 ? "var(--color-chart-4)" : "#ef4444"} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={94.2} strokeDashoffset={94.2 * (1 - health.score / 100)} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[14px] font-semibold">{health.score}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-small font-semibold">Password health</p>
            <p className="text-xs text-muted">
              {logins.length ? `${health.weak.length} weak · ${health.reused.length} reused · ${health.breached.length} breached · ${health.old.length} over a year old` : "Add your first login to see how safe your passwords are."}
            </p>
          </div>
          {logins.length > 0 && (
            <button type="button" onClick={checkBreaches} disabled={Boolean(checking)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs hover:border-primary disabled:opacity-60">
              {checking ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} {checking ? `${checking.done}/${checking.total}` : "Breach check"}
            </button>
          )}
        </section>
        <section className="flex flex-wrap items-center gap-2 rounded-3xl border border-border bg-card p-4">
          <button type="button" onClick={() => setEditing({})} className="btn btn-primary">
            <Plus size={15} /> Add login
          </button>
          <button type="button" onClick={() => setShowGen((x) => !x)} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs hover:border-primary">
            <Wand2 size={13} /> Generator
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs hover:border-primary" title="Import a CSV exported from Chrome, Edge, Bitwarden …">
            <Upload size={13} /> Import
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(ev) => { importCsv(ev.target.files?.[0]); ev.target.value = ""; }} />
          {logins.length > 0 && (
            <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted hover:border-primary">
              <Download size={13} /> Export
            </button>
          )}
        </section>
      </div>

      {showGen && <Generator />}

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary">
          <Search size={15} className="text-muted" />
          <input value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Search logins" className="min-w-0 flex-1 bg-transparent text-small outline-none" style={{ outline: "none" }} autoComplete="off" />
        </label>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
          {chips.map(([id, label, count, Icon]) =>
            id === "all" || count > 0 ? (
              <button key={id} type="button" onClick={() => setFilter(id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${filter === id ? "border-primary bg-primary text-background" : "border-border text-secondary"}`}>
                <Icon size={12} /> {label} <span className="opacity-70">{count}</span>
              </button>
            ) : null,
          )}
        </div>
      </div>

      {list.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {list.map((i) => {
            const st = strengthOf(i.meta.password);
            const warn = i.meta.breach?.count > 0 || reuseCount.get(i.meta.password) > 1 || st.level === 0;
            return (
              <div key={i._id} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary">
                <button type="button" onClick={() => setOpen(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Avatar entry={i.meta} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-small font-medium">
                      <span className="truncate">{i.meta.title}</span>
                      {i.meta.favorite && <Star size={11} className="shrink-0 fill-current text-[var(--color-chart-4)]" />}
                      {i.meta.totp && <Smartphone size={11} className="shrink-0 text-muted" title="Has 2FA" />}
                      {warn && <ShieldAlert size={12} className="shrink-0 text-amber-500" />}
                    </span>
                    <span className="block truncate text-xs text-muted">{i.meta.username || hostOf(i.meta.url)}</span>
                  </span>
                </button>
                <div className="flex gap-0.5 opacity-70 transition group-hover:opacity-100">
                  {i.meta.username && (
                    <button type="button" onClick={() => copySecret(i.meta.username, "Username")} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary" title="Copy username">
                      <Copy size={14} />
                    </button>
                  )}
                  <button type="button" onClick={() => copySecret(i.meta.password, "Password")} className="rounded-lg p-2 text-muted hover:bg-surface hover:text-primary" title="Copy password">
                    <KeyRound size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <KeyRound size={28} className="mx-auto text-muted" />
          <p className="mt-3 text-small font-medium">{logins.length ? "Nothing matches." : "No logins yet"}</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted">Add one, or import the CSV your browser or old password manager exports (Chrome: Settings → Passwords → Export).</p>
        </div>
      )}

      {editing && (
        <Editor
          vk={vk}
          initial={editing._id ? editing : null}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setOpen(null);
            toast.success("Encrypted and saved");
            reload();
          }}
        />
      )}
      {open && !editing && <Detail item={open} reused={reuseCount.get(open.meta.password) || 0} onClose={() => setOpen(null)} onEdit={() => setEditing(open)} onDelete={() => remove(open)} />}
    </div>
  );
}

export default Passwords;
