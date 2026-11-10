import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ShieldCheck, Lock, LockKeyhole, KeyRound, LifeBuoy, Loader2, Eye, EyeOff, Copy, Download, Plus, Search, X, FileText, Image as ImageIcon,
  Trash2, Pencil, Paperclip, CalendarClock, IdCard, GraduationCap, Landmark, HeartPulse, Home, Car, BookUser, FileLock2, AlertTriangle, Printer,
} from "lucide-react";

import api from "../../lib/axios";
import LifeGate from "../life/LifeGate";
import {
  useVault, loadVaultConfig, setupVault, openWithPassword, openWithRecovery, changeVaultPassword, lockVault, touchVault,
  fetchItems, decryptItems, uploadEncrypted, downloadDecrypted, saveItem, newItemKey,
} from "../vault/vaultSession";

/* ========================================
   VAULT — your documents (citizenship, NID,
   passport, certificates …) and secure
   notes, encrypted in this browser before
   they're stored. Only your vault password
   or recovery key can open them.
========================================= */

const TYPES = [
  { id: "citizenship", label: "Citizenship", icon: IdCard, category: "Identity", fields: ["Certificate number", "Full name", "Date of birth", "Issued on", "Issued at (district)", "Father's name"] },
  { id: "nid", label: "National ID (NID)", icon: IdCard, category: "Identity", fields: ["NID number", "Full name", "Date of birth", "Issued on"] },
  { id: "passport", label: "Passport", icon: BookUser, category: "Identity", fields: ["Passport number", "Full name", "Nationality", "Issued on", "Expires on", "Issued at"] },
  { id: "license", label: "Driving licence", icon: Car, category: "Identity", fields: ["Licence number", "Category", "Issued on", "Expires on"] },
  { id: "certificate", label: "Certificate / degree", icon: GraduationCap, category: "Education", fields: ["Title", "Institution", "Issued on", "Registration / roll number"] },
  { id: "bank", label: "Bank & finance", icon: Landmark, category: "Finance", fields: ["Bank", "Account name", "Account number", "Branch", "SWIFT / IFSC"] },
  { id: "medical", label: "Medical", icon: HeartPulse, category: "Medical", fields: ["Provider", "Policy / record number", "Blood group", "Notes"] },
  { id: "property", label: "Property & vehicle", icon: Home, category: "Property", fields: ["Document", "Number", "Location", "Registered on"] },
  { id: "note", label: "Secure note", icon: FileLock2, category: "Notes", fields: [] },
  { id: "other", label: "Other document", icon: FileText, category: "Other", fields: ["Number", "Issued on", "Expires on"] },
];
const TYPE = new Map(TYPES.map((t) => [t.id, t]));
const SECRET_HINT = /number|account|passport|nid|licence|policy|swift|ifsc|pin|password/i;
const EXPIRY = /expir|valid until|renew/i;
const fmtSize = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const fail = (e, msg) => e?.response?.status !== 423 && toast.error(e?.response?.data?.message || e?.message || msg);

const expiryOf = (meta) => {
  const f = (meta.fields || []).find((x) => EXPIRY.test(x.label) && /^\d{4}-\d{2}-\d{2}$/.test(x.value));
  if (!f) return null;
  const days = Math.round((new Date(f.value) - new Date()) / 86400000);
  return { date: f.value, days };
};

function Pass({ value, onChange, placeholder, autoFocus, autoComplete = "current-password" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center rounded-xl border border-border bg-surface px-3 focus-within:border-primary">
      <KeyRound size={16} className="shrink-0 text-muted" />
      <input type={show ? "text" : "password"} value={value} autoFocus={autoFocus} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 min-w-0 flex-1 bg-transparent px-2.5 outline-none" style={{ outline: "none" }} />
      <button type="button" onClick={() => setShow((s) => !s)} className="p-1 text-muted" aria-label={show ? "Hide" : "Show"}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Center({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex min-h-[calc(100dvh-12rem)] items-center justify-center py-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-6 flex justify-center" style={{ perspective: 700 }}>
          <motion.div
            initial={{ rotateX: 50, rotateY: -30, opacity: 0 }}
            animate={{ rotateX: 0, rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-24 w-24 items-center justify-center rounded-[26px] border border-border bg-gradient-to-b from-surface to-background shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <span className="absolute inset-[6px] rounded-[20px] border border-dashed border-border" aria-hidden />
            <Icon size={38} strokeWidth={1.5} style={{ transform: "translateZ(26px)" }} />
          </motion.div>
        </div>
        <h1 className="text-center text-[26px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mx-auto mt-2 max-w-sm text-center text-small text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </motion.div>
    </div>
  );
}

function RecoveryKey({ value, onDone }) {
  const [ok, setOk] = useState(false);
  const download = () => {
    const text = `DOCUMENT VAULT — RECOVERY KEY\n\n${value}\n\nThis key opens your vault if you forget the vault password.\nNobody else has a copy — not the website, not the server.\nKeep it offline: printed in a safe place or in a password manager.\nCreated ${new Date().toLocaleString()}\n`;
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([text], { type: "text/plain" })), download: "vault-recovery-key.txt" });
    a.click();
    URL.revokeObjectURL(a.href);
    setOk(true);
  };
  const print = () => {
    const w = window.open("", "_blank", "width=600,height=500");
    if (!w) return;
    w.document.write(`<title>Vault recovery key</title><body style="font-family:system-ui;padding:40px"><h2>Document vault — recovery key</h2><p style="font:20px/1.6 monospace;letter-spacing:2px;border:2px dashed #999;padding:20px">${value}</p><p>Opens the vault if you forget the password. Keep it somewhere safe and offline.</p><p>${new Date().toLocaleString()}</p></body>`);
    w.document.close();
    w.print();
    setOk(true);
  };
  return (
    <Center icon={LifeBuoy} title="Your recovery key" subtitle="If you forget the vault password, this is the only way in. Nobody can reset it for you — not even the server.">
      <div className="space-y-3">
        <p className="select-all break-words rounded-2xl border-2 border-dashed border-border bg-surface px-4 py-5 text-center font-mono text-[15px] leading-relaxed tracking-[0.08em]">{value}</p>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" className="btn btn-outline" onClick={() => navigator.clipboard.writeText(value).then(() => { toast.success("Copied"); setOk(true); })}>
            <Copy size={14} /> Copy
          </button>
          <button type="button" className="btn btn-outline" onClick={download}>
            <Download size={14} /> Save
          </button>
          <button type="button" className="btn btn-outline" onClick={print}>
            <Printer size={14} /> Print
          </button>
        </div>
        <label className="flex items-start gap-2 text-small text-secondary">
          <input type="checkbox" className="mt-1" checked={ok} onChange={(e) => setOk(e.target.checked)} /> I stored it safely, away from this vault.
        </label>
        <button type="button" disabled={!ok} onClick={onDone} className="btn btn-primary w-full disabled:opacity-40">
          Open my vault
        </button>
      </div>
    </Center>
  );
}

function Setup({ onRecovery }) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (p1.length < 10) return toast.error("Use at least 10 characters — a sentence is best");
    if (p1 !== p2) return toast.error("The passwords don't match");
    setBusy(true);
    try {
      onRecovery(await setupVault(p1));
    } catch (err) {
      fail(err, "Couldn't create the vault");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Center icon={ShieldCheck} title="Create your document vault" subtitle="Citizenship, NID, passport, certificates — encrypted on this device before upload. Choose a vault password different from your other passwords.">
      <form onSubmit={submit} className="space-y-3">
        <Pass value={p1} onChange={setP1} placeholder="Vault password (10+ characters)" autoFocus autoComplete="new-password" />
        <Pass value={p2} onChange={setP2} placeholder="Repeat it" autoComplete="new-password" />
        <ul className="space-y-1 px-1 text-[12px] text-muted">
          <li>• Encrypted with AES-256 in your browser; the server stores only scrambled data.</li>
          <li>• You&apos;ll get a recovery key next — it&apos;s the only backup.</li>
        </ul>
        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Create vault
        </button>
      </form>
    </Center>
  );
}

function Unlock({ onRecovered }) {
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState("password");
  const [recovery, setRecovery] = useState("");
  const [vk, setVk] = useState(null);
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      fail(e, "That didn't work");
    } finally {
      setBusy(false);
    }
  };

  if (vk) {
    return (
      <Center icon={KeyRound} title="Set a new vault password" subtitle="Recovery key accepted. A new recovery key will be issued too.">
        <form onSubmit={(e) => { e.preventDefault(); if (next.length < 10) return toast.error("Use at least 10 characters"); run(async () => onRecovered(await changeVaultPassword(vk, next, { via: "recovery", newRecovery: true }))); }} className="space-y-3">
          <Pass value={next} onChange={setNext} placeholder="New vault password" autoFocus autoComplete="new-password" />
          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy && <Loader2 size={16} className="animate-spin" />} Save and open
          </button>
        </form>
      </Center>
    );
  }

  return (
    <Center icon={LockKeyhole} title="Vault locked" subtitle={mode === "password" ? "Enter your vault password." : "Enter the recovery key you saved when you created the vault."}>
      {mode === "password" ? (
        <form onSubmit={(e) => { e.preventDefault(); if (pw) run(async () => { await openWithPassword(pw); setPw(""); }); }} className="space-y-3">
          <Pass value={pw} onChange={setPw} placeholder="Vault password" autoFocus />
          <button type="submit" disabled={busy || !pw} className="btn btn-primary w-full disabled:opacity-40">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <LockKeyhole size={16} />} Open vault
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); run(async () => setVk(await openWithRecovery(recovery))); }} className="space-y-3">
          <textarea rows={3} value={recovery} onChange={(e) => setRecovery(e.target.value)} autoFocus placeholder="XXXX-XXXX-XXXX-…" className="w-full rounded-xl border border-border bg-surface p-3 text-center font-mono tracking-widest outline-none focus:border-primary" />
          <button type="submit" disabled={busy || recovery.length < 20} className="btn btn-primary w-full disabled:opacity-40">
            {busy && <Loader2 size={16} className="animate-spin" />} Use recovery key
          </button>
        </form>
      )}
      <button type="button" onClick={() => setMode(mode === "password" ? "recovery" : "password")} className="mx-auto mt-5 block text-xs text-muted hover:text-primary">
        {mode === "password" ? "Forgot the vault password?" : "Back to password"}
      </button>
    </Center>
  );
}

/* ---------- viewer for decrypted files ---------- */

function FileView({ item, file, onClose }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;
    downloadDecrypted(item.ik, file.id, file.type)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setUrl(objectUrl);
      })
      .catch((e) => {
        fail(e, "Couldn't open the file");
        onClose();
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item, file, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/85 p-3 backdrop-blur" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mb-2 flex items-center gap-2 text-white">
        <span className="min-w-0 flex-1 truncate text-small">{file.name}</span>
        {url && (
          <a href={url} download={file.name} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs">
            <Download size={14} /> Download
          </a>
        )}
        <button type="button" onClick={onClose} className="rounded-lg bg-white/10 p-1.5" aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {!url ? (
          <Loader2 className="animate-spin text-white" />
        ) : file.type.startsWith("image/") ? (
          <img src={url} alt={file.name} className="max-h-full max-w-full rounded-lg object-contain" />
        ) : file.type === "application/pdf" ? (
          <iframe src={url} title={file.name} className="h-full w-full rounded-lg bg-white" />
        ) : (
          <a href={url} download={file.name} className="btn btn-primary">
            <Download size={15} /> Download {file.name}
          </a>
        )}
      </div>
    </div>
  );
}

/* ---------- editor ---------- */

function Editor({ vk, initial, onClose, onSaved }) {
  const isNew = !initial?._id;
  const [meta, setMeta] = useState(() => initial?.meta || null);
  const [keys, setKeys] = useState(initial?.ik ? { ik: initial.ik, key: initial.key } : null);
  const [uploads, setUploads] = useState([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const uploaded = useRef([]); // ids uploaded in this editor session
  const set = (patch) => setMeta((m) => ({ ...m, ...patch }));
  // Encrypted uploads that didn't end up in the saved item are deleted.
  const cleanup = (keep) => uploaded.current.filter((id) => !keep.includes(id)).forEach((id) => api.delete(`/vault/files/${id}`).catch(() => {}));
  const close = () => {
    cleanup([]);
    onClose();
  };

  useEffect(() => {
    if (keys) return;
    newItemKey(vk).then(({ ik, wrapped }) => setKeys({ ik, key: wrapped }));
  }, [vk, keys]);

  const choose = (type) =>
    setMeta({ type: type.id, title: type.id === "note" ? "" : type.label, category: type.category, fields: type.fields.map((label) => ({ label, value: "", secret: SECRET_HINT.test(label) })), notes: "", files: [], tags: [] });

  const addFiles = async (files) => {
    if (!keys) return;
    for (const file of Array.from(files)) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} is over 25 MB`);
        continue;
      }
      const tmp = { name: file.name, progress: 0 };
      setUploads((u) => [...u, tmp]);
      try {
        const res = await uploadEncrypted(keys.ik, file, (p) => setUploads((u) => u.map((x) => (x === tmp ? Object.assign(tmp, { progress: p }) : x))));
        uploaded.current.push(res.id);
        setMeta((m) => ({ ...m, files: [...m.files, { id: res.id, name: file.name.slice(0, 200), type: file.type || "application/octet-stream", size: file.size }] }));
      } catch (e) {
        fail(e, `Couldn't upload ${file.name}`);
      } finally {
        setUploads((u) => u.filter((x) => x !== tmp));
      }
    }
  };

  const save = async () => {
    if (!meta.title.trim()) return toast.error("Give it a title");
    setBusy(true);
    try {
      const clean = { ...meta, title: meta.title.trim(), fields: meta.fields.filter((f) => f.label.trim() || f.value.trim()), updatedAt: new Date().toISOString() };
      await saveItem(vk, { ...initial, ik: keys.ik, key: keys.key }, clean);
      cleanup(clean.files.map((f) => f.id));
      onSaved();
    } catch (e) {
      fail(e, "Couldn't save");
    } finally {
      setBusy(false);
    }
  };

  const input = "h-10 w-full rounded-xl border border-border bg-surface px-3 text-small outline-none focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-[var(--color-card)] p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-title">{isNew ? (meta ? "New item" : "What are you adding?") : "Edit item"}</h2>
          <button type="button" onClick={close} className="rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {!meta ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TYPES.map((t) => (
              <button key={t.id} type="button" onClick={() => choose(t)} className="flex flex-col items-start gap-2 rounded-2xl border border-border p-3 text-left transition hover:border-primary">
                <t.icon size={20} />
                <span className="text-small font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
              <input className={input} value={meta.title} onChange={(e) => set({ title: e.target.value })} placeholder="Title" autoFocus />
              <input className={input} list="vault-cats" value={meta.category} onChange={(e) => set({ category: e.target.value })} placeholder="Category" />
              <datalist id="vault-cats">
                {[...new Set(TYPES.map((t) => t.category))].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {meta.fields.length > 0 && (
              <div className="space-y-2">
                {meta.fields.map((f, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto_auto] items-center gap-2">
                    <input className={`${input} text-xs`} value={f.label} onChange={(e) => set({ fields: meta.fields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="Label" />
                    <input
                      className={input}
                      type={EXPIRY.test(f.label) || /issued on|date of birth|registered on/i.test(f.label) ? "date" : "text"}
                      value={f.value}
                      onChange={(e) => set({ fields: meta.fields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })}
                      placeholder="Value"
                      autoComplete="off"
                    />
                    <button type="button" onClick={() => set({ fields: meta.fields.map((x, j) => (j === i ? { ...x, secret: !x.secret } : x)) })} className={`rounded-lg p-2 ${f.secret ? "text-primary" : "text-muted"}`} title={f.secret ? "Hidden until revealed" : "Shown"}>
                      {f.secret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button type="button" onClick={() => set({ fields: meta.fields.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-muted hover:text-red-500" aria-label="Remove field">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => set({ fields: [...meta.fields, { label: "", value: "", secret: false }] })} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:text-primary">
              <Plus size={13} /> Add a field
            </button>

            <textarea rows={meta.type === "note" ? 8 : 3} className="w-full resize-y rounded-xl border border-border bg-surface p-3 text-small outline-none focus:border-primary" value={meta.notes} onChange={(e) => set({ notes: e.target.value })} placeholder={meta.type === "note" ? "Your secure note…" : "Notes"} />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              className="space-y-2 rounded-2xl border border-dashed border-border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-secondary">Scans & files — encrypted before upload</p>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={!keys} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary">
                  <Paperclip size={13} /> Add files
                </button>
                <input ref={fileRef} type="file" multiple accept="image/*,application/pdf,.doc,.docx,.txt" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </div>
              {meta.files.map((f) => (
                <div key={f.id} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs">
                  {f.type.startsWith("image/") ? <ImageIcon size={14} /> : <FileText size={14} />}
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="text-muted">{fmtSize(f.size)}</span>
                  <button type="button" onClick={() => set({ files: meta.files.filter((x) => x.id !== f.id) })} className="text-muted hover:text-red-500" aria-label="Remove file">
                    <X size={13} />
                  </button>
                </div>
              ))}
              {uploads.map((u) => (
                <div key={u.name} className="rounded-xl bg-surface px-3 py-2 text-xs">
                  <div className="flex justify-between">
                    <span className="truncate">{u.name}</span>
                    <span className="text-muted">{u.progress < 0.5 ? "Encrypting…" : "Uploading…"}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
                    <div className="h-full bg-[var(--color-chart-3)] transition-all" style={{ width: `${u.progress * 100}%` }} />
                  </div>
                </div>
              ))}
              {!meta.files.length && !uploads.length && <p className="text-center text-[11px] text-muted">Drop photos or PDFs here — e.g. front and back of the card.</p>}
            </div>

            <button type="button" onClick={save} disabled={busy || uploads.length > 0 || !keys} className="btn btn-primary w-full disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />} Encrypt & save
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ---------- item card + detail ---------- */

function Detail({ item, onClose, onEdit, onDelete }) {
  const [revealed, setRevealed] = useState(new Set());
  const [viewing, setViewing] = useState(null);
  const t = TYPE.get(item.meta.type) || TYPE.get("other");
  const exp = expiryOf(item.meta);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-border bg-[var(--color-card)] p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface">
            <t.icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-title">{item.meta.title}</h2>
            <p className="text-xs text-muted">
              {item.meta.category} · updated {new Date(item.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {exp && (
          <p className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${exp.days < 0 ? "bg-red-500/10 text-red-500" : exp.days < 60 ? "bg-amber-500/10 text-amber-600" : "bg-surface text-muted"}`}>
            <CalendarClock size={13} /> {exp.days < 0 ? `Expired ${-exp.days} days ago` : `Expires in ${exp.days} days`} · {exp.date}
          </p>
        )}
        <dl className="divide-y divide-border rounded-2xl border border-border">
          {item.meta.fields.map((f, i) => {
            const hidden = f.secret && !revealed.has(i);
            return (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <dt className="w-36 shrink-0 text-xs text-muted">{f.label}</dt>
                <dd className="min-w-0 flex-1 break-words font-mono text-small">{hidden ? "••••••••" : f.value || "—"}</dd>
                {f.secret && (
                  <button type="button" onClick={() => setRevealed((s) => new Set(s.has(i) ? [...s].filter((x) => x !== i) : [...s, i]))} className="text-muted hover:text-primary" aria-label={hidden ? "Reveal" : "Hide"}>
                    {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                )}
                {f.value && (
                  <button type="button" onClick={() => navigator.clipboard.writeText(f.value).then(() => toast.success(`${f.label} copied`))} className="text-muted hover:text-primary" aria-label="Copy">
                    <Copy size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </dl>
        {item.meta.notes && <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-surface p-3 text-small">{item.meta.notes}</p>}
        {item.meta.files.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {item.meta.files.map((f) => (
              <button key={f.id} type="button" onClick={() => setViewing(f)} className="flex items-center gap-2 rounded-xl border border-border p-3 text-left text-xs hover:border-primary">
                {f.type.startsWith("image/") ? <ImageIcon size={16} /> : <FileText size={16} />}
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="text-muted">{fmtSize(f.size)}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onEdit} className="btn btn-outline flex-1">
            <Pencil size={14} /> Edit
          </button>
          <button type="button" onClick={onDelete} className="btn btn-outline text-red-500">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </motion.div>
      {viewing && <FileView item={item} file={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function Items() {
  const vault = useVault();
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(null);
  const [changing, setChanging] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [recovery, setRecovery] = useState("");

  const load = () =>
    fetchItems()
      .then((raw) => decryptItems(vault.vk, raw))
      .then(setItems)
      .catch((e) => fail(e, "Couldn't load the vault"));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vault.vk]);

  const categories = useMemo(() => ["All", ...new Set((items || []).map((i) => i.meta.category || "Other"))], [items]);
  const list = (items || []).filter((i) => (cat === "All" || (i.meta.category || "Other") === cat) && `${i.meta.title} ${i.meta.category} ${i.meta.fields.map((f) => `${f.label} ${f.value}`).join(" ")} ${i.meta.notes}`.toLowerCase().includes(q.toLowerCase()));
  const expiring = (items || []).map((i) => ({ i, e: expiryOf(i.meta) })).filter((x) => x.e && x.e.days < 60);
  const used = vault.usage ? Math.round((vault.usage.bytes / vault.usage.quota) * 100) : 0;

  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.meta.title}” and its files permanently? This can't be undone.`)) return;
    try {
      await api.delete(`/vault/items/${item._id}`);
      setOpen(null);
      load();
      loadVaultConfig();
    } catch (e) {
      fail(e, "Couldn't delete");
    }
  };

  if (recovery) return <RecoveryKey value={recovery} onDone={() => setRecovery("")} />;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5" onPointerDown={touchVault} onKeyDown={touchVault}>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-heading inline-flex items-center gap-3">
            <ShieldCheck size={28} /> Vault
          </h1>
          <p className="text-body mt-2">End-to-end encrypted. Locks when you leave this page or after 10 minutes idle.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setChanging((c) => !c)} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs hover:border-primary">
            <KeyRound size={14} /> Password
          </button>
          <button type="button" onClick={lockVault} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-background">
            <Lock size={14} /> Lock vault
          </button>
        </div>
      </section>

      {changing && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (newPw.length < 10) return toast.error("Use at least 10 characters");
            try {
              await changeVaultPassword(vault.vk, newPw);
              toast.success("Vault password changed");
              setNewPw("");
              setChanging(false);
            } catch (err) {
              fail(err, "Couldn't change it");
            }
          }}
          className="card flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <div className="flex-1">
            <Pass value={newPw} onChange={setNewPw} placeholder="New vault password" autoFocus autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary">Change password</button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={async () => {
              if (!window.confirm("Make a new recovery key? The old one will stop working.")) return;
              const pw = window.prompt("Confirm with a vault password to keep (current or new):");
              if (!pw || pw.length < 10) return;
              try {
                setRecovery(await changeVaultPassword(vault.vk, pw, { newRecovery: true }));
                setChanging(false);
              } catch (err) {
                fail(err, "Couldn't make a new key");
              }
            }}
          >
            <LifeBuoy size={14} /> New recovery key
          </button>
        </form>
      )}

      {expiring.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-small">
          <AlertTriangle size={15} className="text-amber-600" />
          {expiring.map(({ i, e }) => (
            <button key={i._id} type="button" onClick={() => setOpen(i)} className="rounded-full bg-background px-2.5 py-0.5 text-xs">
              {i.meta.title}: {e.days < 0 ? "expired" : `${e.days} days left`}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setEditing({})} className="btn btn-primary">
          <Plus size={15} /> Add
        </button>
        <label className="flex h-11 min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:border-primary">
          <Search size={15} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your documents (decrypted only on this device)" className="min-w-0 flex-1 bg-transparent text-small outline-none" style={{ outline: "none" }} />
        </label>
        {vault.usage && (
          <span className="text-[11px] text-muted" title={`${fmtSize(vault.usage.bytes)} of ${fmtSize(vault.usage.quota)}`}>
            {fmtSize(vault.usage.bytes)} used · {used}%
          </span>
        )}
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
        {categories.map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-3 py-1 text-xs ${cat === c ? "border-primary bg-primary text-background" : "border-border text-secondary"}`}>
            {c}
          </button>
        ))}
      </div>

      {!items ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-surface" />)}</div>
      ) : list.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((i) => {
            const t = TYPE.get(i.meta.type) || TYPE.get("other");
            const exp = expiryOf(i.meta);
            const first = i.meta.fields.find((f) => f.value);
            return (
              <motion.button key={i._id} type="button" layout onClick={() => !i.broken && setOpen(i)} whileHover={{ y: -2 }} className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 text-left transition hover:border-primary">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface">
                    <t.icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-small font-semibold">{i.meta.title}</span>
                    <span className="text-[11px] text-muted">{i.meta.category}</span>
                  </span>
                </div>
                {first && (
                  <p className="truncate font-mono text-xs text-muted">
                    {first.label}: {first.secret ? `••••${first.value.slice(-3)}` : first.value}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  {i.meta.files.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Paperclip size={11} /> {i.meta.files.length}
                    </span>
                  )}
                  {exp && <span className={exp.days < 60 ? "text-amber-600" : ""}>{exp.days < 0 ? "Expired" : `Exp. ${exp.date}`}</span>}
                  <Lock size={11} className="ml-auto" />
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <ShieldCheck size={28} className="mx-auto text-muted" />
          <p className="mt-3 text-small font-medium">{items.length ? "Nothing matches." : "Your vault is empty"}</p>
          <p className="mt-1 text-xs text-muted">Add your citizenship, NID, passport or certificates — with photos of the documents.</p>
        </div>
      )}

      {editing && (
        <Editor
          vk={vault.vk}
          initial={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast.success("Encrypted and saved");
            load();
            loadVaultConfig();
          }}
        />
      )}
      {open && !editing && (
        <Detail
          item={open}
          onClose={() => setOpen(null)}
          onEdit={() => {
            setEditing(open);
            setOpen(null);
          }}
          onDelete={() => remove(open)}
        />
      )}
    </div>
  );
}

function VaultBody() {
  const vault = useVault();
  const [recovery, setRecovery] = useState("");

  useEffect(() => {
    loadVaultConfig().catch((e) => fail(e, "Couldn't reach the vault"));
    return () => lockVault(); // leaving the page locks it
  }, []);

  if (recovery) return <RecoveryKey value={recovery} onDone={() => setRecovery("")} />;
  if (vault.loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!vault.configured) return <Setup onRecovery={setRecovery} />;
  if (!vault.vk) return <Unlock onRecovered={setRecovery} />;
  return <Items />;
}

function Vault() {
  return (
    <LifeGate>
      <VaultBody />
    </LifeGate>
  );
}

export default Vault;
