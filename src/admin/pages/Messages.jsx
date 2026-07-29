import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Mail, Check, Trash2 } from "lucide-react";

import { getMessages, markMessageRead, deleteMessage } from "../services/contact.service";
import SkeletonCard from "../../components/common/SkeletonCard";
import ConfirmModal from "../components/ui/ConfirmModal";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const filters = [
  { label: "Unread", value: "unread" },
  { label: "All", value: "all" },
];

function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unread");
  const [busyId, setBusyId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadMessages = async () => {
    try {
      const data = await getMessages();

      setMessages(data);
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const visibleMessages = useMemo(() => {
    if (filter === "unread") return messages.filter((m) => !m.isRead);
    return messages;
  }, [messages, filter]);

  const unreadCount = messages.filter((m) => !m.isRead).length;

  const handleMarkRead = async (id) => {
    try {
      setBusyId(id);

      await markMessageRead(id);

      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, isRead: true } : m)),
      );
    } catch {
      toast.error("Failed to mark as read");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);

      await deleteMessage(deleteId);

      setMessages((prev) => prev.filter((m) => m._id !== deleteId));
      toast.success("Message deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete message");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-heading">Messages</h1>

        <p className="text-body mt-3">
          {unreadCount} unread message{unreadCount === 1 ? "" : "s"} from your
          contact form.
        </p>
      </div>

      <div className="flex gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`h-control px-4 rounded-control border text-small transition ${
              filter === item.value
                ? "bg-primary text-background border-primary"
                : "border-border bg-surface"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visibleMessages.length === 0 ? (
          <div className="card text-center text-small py-16">
            {filter === "unread" ? "No unread messages." : "No messages yet."}
          </div>
        ) : (
          visibleMessages.map((item) => (
            <div
              key={item._id}
              className={`card space-y-3 ${!item.isRead ? "border-primary/30" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <span className="text-label">{item.name}</span>

                  <a
                    href={`mailto:${item.email}`}
                    className="text-muted text-xs hover:text-primary transition-colors"
                  >
                    {item.email}
                  </a>

                  <span className="text-muted text-xs">
                    {formatDate(item.createdAt)}
                  </span>

                  {!item.isRead && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs">
                      Unread
                    </span>
                  )}

                  {!item.autoResponseSent && (
                    <span className="rounded-full bg-surface border border-border px-3 py-1 text-xs">
                      Auto-reply not sent
                    </span>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <a
                    href={`mailto:${item.email}${item.subject ? `?subject=Re: ${encodeURIComponent(item.subject)}` : ""}`}
                    className="h-9 px-3 rounded-control border border-border text-small inline-flex items-center gap-1.5 transition hover:border-primary"
                  >
                    <Mail size={14} />
                    Reply
                  </a>

                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item._id)}
                      disabled={busyId === item._id}
                      className="h-9 px-3 rounded-control bg-primary text-background text-small inline-flex items-center gap-1.5 transition hover:opacity-90 disabled:opacity-50"
                    >
                      <Check size={14} />
                      Mark read
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteId(item._id)}
                    className="h-9 px-3 rounded-control bg-red-500 text-white text-small inline-flex items-center gap-1.5 transition hover:bg-red-600"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>

              {item.subject && (
                <p className="text-label">{item.subject}</p>
              )}

              <p className="text-small whitespace-pre-wrap break-words">
                {item.message}
              </p>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Delete message"
        message="Are you sure you want to delete this message? This can't be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}

export default Messages;
