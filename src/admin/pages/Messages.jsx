import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Reply, Check, Trash2 } from "lucide-react";

import {
  getMessages,
  markMessageRead,
  deleteMessage,
  replyToMessage,
} from "../services/contact.service";
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

/* ========================================
   REPLY MODAL
========================================= */

function ReplyModal({ target, onSend, onCancel, sending }) {
  const [text, setText] = useState("");

  if (!target) return null;

  const handleSend = () => {
    if (!text.trim()) {
      toast.error("Write a reply before sending");
      return;
    }

    onSend(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-lg space-y-5">
        <div>
          <h3 className="text-title">Reply to {target.name}</h3>

          <p className="text-small mt-1">
            Sends a real email to <span className="text-primary">{target.email}</span> via
            Resend — not your local mail app.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-muted text-xs mb-2">Their message</p>

          <p className="text-small whitespace-pre-wrap break-words">
            {target.message}
          </p>
        </div>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your reply..."
          rows={6}
          className="w-full p-5 rounded-3xl bg-surface border border-border outline-none resize-none transition focus:border-primary"
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="h-control px-5 rounded-control border border-border disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="h-control px-5 rounded-control bg-primary text-background disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unread");
  const [busyId, setBusyId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);

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

  const handleSendReply = async (text) => {
    try {
      setSendingReply(true);

      const updated = await replyToMessage(replyTarget._id, text);

      setMessages((prev) =>
        prev.map((m) => (m._id === updated._id ? updated : m)),
      );

      toast.success("Reply sent");
      setReplyTarget(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send reply",
      );
    } finally {
      setSendingReply(false);
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

                  <span className="text-muted text-xs">{item.email}</span>

                  <span className="text-muted text-xs">
                    {formatDate(item.createdAt)}
                  </span>

                  {!item.isRead && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs">
                      Unread
                    </span>
                  )}

                  {item.repliedAt && (
                    <span className="rounded-full bg-surface border border-border px-3 py-1 text-xs">
                      Replied {formatDate(item.repliedAt)}
                    </span>
                  )}

                  {!item.autoResponseSent && (
                    <span className="rounded-full bg-surface border border-border px-3 py-1 text-xs">
                      Auto-reply not sent
                    </span>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setReplyTarget(item)}
                    className="h-9 px-3 rounded-control border border-border text-small inline-flex items-center gap-1.5 transition hover:border-primary"
                  >
                    <Reply size={14} />
                    Reply
                  </button>

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

              {item.adminReply && (
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-muted text-xs mb-2">Your reply</p>

                  <p className="text-small whitespace-pre-wrap break-words">
                    {item.adminReply}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ReplyModal
        target={replyTarget}
        sending={sendingReply}
        onSend={handleSendReply}
        onCancel={() => setReplyTarget(null)}
      />

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
