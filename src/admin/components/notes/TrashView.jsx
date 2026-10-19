import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { RotateCcw, Trash2, FileText, PenLine, Folder, BookOpen } from "lucide-react";

import ConfirmModal from "../ui/ConfirmModal";
import SkeletonCard from "../../../components/common/SkeletonCard";
import { getTrash, restoreTrashItem, purgeTrashItem, emptyTrash } from "../../services/notes.service";

const ICONS = { notebook: BookOpen, topic: Folder };

function TrashView({ onChanged }) {
  const [items, setItems] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = () =>
    getTrash()
      .then(setItems)
      .catch(() => toast.error("Couldn't load trash"));

  useEffect(() => {
    load();
  }, []);

  const restore = async (item) => {
    try {
      await restoreTrashItem(item.trashBatch);
      toast.success(`Restored “${item.title}”`);
      await load();
      onChanged();
    } catch (error) {
      toast.error(error.response?.data?.message || "Restore failed");
    }
  };

  const purge = async () => {
    try {
      if (confirm === "all") await emptyTrash();
      else await purgeTrashItem(confirm.trashBatch);
      setConfirm(null);
      await load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-heading">Trash</h1>
            <p className="text-body mt-2">Deleted items stay here for 30 days, then are removed for good.</p>
          </div>
          {items?.length > 0 && (
            <button type="button" onClick={() => setConfirm("all")} className="h-control px-4 rounded-control border border-border bg-surface text-small text-red-500">
              Empty trash
            </button>
          )}
        </div>

        {!items ? (
          <SkeletonCard />
        ) : !items.length ? (
          <p className="text-body">Trash is empty.</p>
        ) : (
          <div className="card p-0 divide-y divide-border">
            {items.map((item) => {
              const Icon = ICONS[item.type] || (item.kind === "handwritten" ? PenLine : FileText);
              return (
                <div key={item.trashBatch} className="flex items-center gap-3 px-4 py-3">
                  <Icon size={18} className="shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-medium">
                      {item.icon ? `${item.icon} ` : ""}
                      {item.title}
                    </p>
                    <p className="text-xs text-muted">
                      {item.type}
                      {item.noteCount ? ` · ${item.noteCount} notes inside` : ""} · deleted{" "}
                      {new Date(item.deletedAt).toLocaleDateString()} · gone {new Date(item.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button type="button" onClick={() => restore(item)} title="Restore" className="h-9 px-3 rounded-lg border border-border bg-surface text-xs inline-flex items-center gap-1.5">
                    <RotateCcw size={14} /> Restore
                  </button>
                  <button type="button" onClick={() => setConfirm(item)} title="Delete forever" aria-label="Delete forever" className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-red-500 hover:bg-surface">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(confirm)}
        title={confirm === "all" ? "Empty the trash?" : "Delete forever?"}
        message={
          confirm === "all"
            ? "Everything in the trash, including version history, is permanently deleted."
            : `“${confirm?.title}” and everything inside it is permanently deleted.`
        }
        confirmText="Delete forever"
        onConfirm={purge}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

export default TrashView;
