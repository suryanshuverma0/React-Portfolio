import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Ban, Plus, Trash2, Loader2 } from "lucide-react";

import SkeletonCard from "../../../components/common/SkeletonCard";
import ConfirmModal from "../ui/ConfirmModal";
import { getBlocklist, blockIp, unblockIp } from "../../services/blocklist.service";
import { timeAgo } from "../visitors/visitorFormat";

/* ========================================
   IP BLOCKLIST — blocked IPs / CIDR ranges
   can't post the contact form or comments,
   and their visits aren't tracked.
========================================= */

const inputClass = "h-control px-3 rounded-control bg-surface border border-border text-small outline-none focus:border-primary";

function BlocklistCard() {
  const [data, setData] = useState(null);
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    getBlocklist()
      .then(setData)
      .catch(() => toast.error("Couldn't load the blocklist"));
  }, []);

  const add = async (event) => {
    event.preventDefault();
    if (!value.trim()) return;

    try {
      setSaving(true);
      const entry = await blockIp(value.trim(), reason.trim() || undefined);
      setData((d) => ({ ...d, entries: [entry, ...d.entries.filter((e) => e._id !== entry._id)] }));
      setValue("");
      setReason("");
      toast.success(`${entry.value} blocked`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't block that address");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await unblockIp(removing._id);
      setData((d) => ({ ...d, entries: d.entries.filter((e) => e._id !== removing._id) }));
      toast.success(`${removing.value} unblocked`);
    } catch {
      toast.error("Couldn't unblock");
    } finally {
      setRemoving(null);
    }
  };

  if (!data) return <SkeletonCard />;

  return (
    <section className="card space-y-5">
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 shrink-0 rounded-2xl bg-surface flex items-center justify-center">
          <Ban size={18} />
        </span>
        <div>
          <h2 className="text-title">IP blocklist</h2>
          <p className="text-small mt-1">
            Blocked addresses can&apos;t send the contact form or post comments, and their visits aren&apos;t tracked.
            Your current IP is <span className="font-mono">{data.yourIp || "unknown"}</span>.
          </p>
        </div>
      </div>

      <form onSubmit={add} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="1.2.3.4 or 1.2.3.0/24" maxLength={64} className={`${inputClass} font-mono`} aria-label="IP or range" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional) — e.g. spam" maxLength={200} className={inputClass} aria-label="Reason" />
        <button type="submit" disabled={saving || !value.trim()} className="h-control px-5 rounded-control bg-primary text-background text-small font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Block
        </button>
      </form>

      {!data.entries.length ? (
        <p className="text-body">Nothing blocked. You can also block an IP straight from a visitor session.</p>
      ) : (
        <div className="divide-y divide-border rounded-control border border-border">
          {data.entries.map((entry) => (
            <div key={entry._id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-small">
              <span className="font-mono">{entry.value}</span>
              {entry.reason && <span className="text-muted truncate min-w-0 flex-1">{entry.reason}</span>}
              <span className="text-muted text-xs ml-auto whitespace-nowrap tabular-nums">
                {entry.hits} blocked request{entry.hits === 1 ? "" : "s"}
                {entry.lastHitAt ? ` · last ${timeAgo(entry.lastHitAt)}` : ""} · added {timeAgo(entry.createdAt)}
              </span>
              <button
                type="button"
                onClick={() => setRemoving(entry)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-control border border-border bg-surface"
                aria-label={`Unblock ${entry.value}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(removing)}
        title="Unblock this address?"
        message={removing ? `${removing.value} will be able to use the contact form and comments again.` : ""}
        confirmText="Unblock"
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </section>
  );
}

export default BlocklistCard;
