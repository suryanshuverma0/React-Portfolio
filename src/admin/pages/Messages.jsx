import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Reply, Check, Trash2, Archive, ArchiveRestore, Search, BookmarkPlus, X } from "lucide-react";

import {
  getMessages,
  markMessageRead,
  deleteMessage,
  replyToMessage,
  setMessageArchived,
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
  { label: "Needs reply", value: "pending" },
  { label: "Replied", value: "replied" },
  { label: "All", value: "all" },
  { label: "Archived", value: "archived" },
];

const FILTERS = {
  unread: (m) => !m.archived && !m.isRead,
  pending: (m) => !m.archived && !m.repliedAt,
  replied: (m) => !m.archived && Boolean(m.repliedAt),
  all: (m) => !m.archived,
  archived: (m) => m.archived,
};

const EMPTY_LABELS = {
  unread: "No unread messages.",
  pending: "Everything has a reply.",
  replied: "No replies sent yet.",
  all: "No messages yet.",
  archived: "Nothing archived.",
};

/* ---------- saved reply templates (this browser) ---------- */

const TEMPLATES_KEY = "admin:reply-templates";

const DEFAULT_TEMPLATES = [
  {
    name: "Thanks — will get back",
    text: "Hi {name},\n\nThanks for reaching out! I've read your message and will get back to you with details within a couple of days.\n\nBest,\nSuryanshu",
  },
  {
    name: "Happy to chat",
    text: "Hi {name},\n\nThanks for getting in touch — I'd be happy to talk. Could you share a couple of times that work for you this week?\n\nBest,\nSuryanshu",
  },
];

const loadTemplates = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(TEMPLATES_KEY));
    return Array.isArray(saved) ? saved : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
};

const storeTemplates = (templates) => {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    /* storage unavailable — templates last for this visit only */
  }
};

const firstName = (name) => (name || "").trim().split(/\s+/)[0] || "there";

/* ========================================
   REPLY MODAL
========================================= */

function ReplyModal({ target, onSend, onCancel, sending }) {
  const [text, setText] = useState("");
  const [templates, setTemplates] = useState(loadTemplates);

  if (!target) return null;

  const applyTemplate = (template) => setText(template.text.replace(/\{name\}/g, firstName(target.name)));

  const saveTemplate = () => {
    const name = window.prompt("Template name");
    if (!name?.trim() || !text.trim()) return;

    // Stored with a {name} placeholder so it fits the next person too.
    const generic = text.split(firstName(target.name)).join("{name}");
    const next = [...templates.filter((t) => t.name !== name.trim()), { name: name.trim().slice(0, 60), text: generic }];

    setTemplates(next);
    storeTemplates(next);
    toast.success("Template saved");
  };

  const removeTemplate = (name) => {
    const next = templates.filter((t) => t.name !== name);
    setTemplates(next);
    storeTemplates(next);
  };

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

        {templates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <span key={template.name} className="inline-flex items-center rounded-full border border-border bg-surface text-xs">
                <button type="button" onClick={() => applyTemplate(template)} className="pl-3 pr-1.5 py-1 hover:text-primary">
                  {template.name}
                </button>
                <button
                  type="button"
                  onClick={() => removeTemplate(template.name)}
                  className="pr-2 py-1 text-muted hover:text-primary"
                  aria-label={`Remove template ${template.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your reply..."
          rows={6}
          className="w-full p-5 rounded-3xl bg-surface border border-border outline-none resize-none transition focus:border-primary"
        />

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={saveTemplate}
            disabled={!text.trim()}
            className="h-control px-4 mr-auto rounded-control border border-border text-small inline-flex items-center gap-2 disabled:opacity-50"
          >
            <BookmarkPlus size={15} /> Save as template
          </button>

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
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("q") ? "all" : "unread");
  const [query, setQuery] = useState(searchParams.get("q") || "");
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
    const text = query.trim().toLowerCase();

    return messages
      .filter(FILTERS[filter] || FILTERS.all)
      .filter(
        (m) =>
          !text ||
          [m.name, m.email, m.subject, m.message, m.adminReply].some((field) => field?.toLowerCase().includes(text)),
      );
  }, [messages, filter, query]);

  const counts = useMemo(
    () => Object.fromEntries(Object.entries(FILTERS).map(([key, test]) => [key, messages.filter(test).length])),
    [messages],
  );

  const unreadCount = counts.unread;

  const handleArchive = async (item) => {
    try {
      setBusyId(item._id);
      const updated = await setMessageArchived(item._id, !item.archived);
      setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      toast.success(updated.archived ? "Archived" : "Moved back to inbox");
    } catch {
      toast.error("Couldn't update the message");
    } finally {
      setBusyId(null);
    }
  };

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

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative mr-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, text…"
            className="h-control pl-9 pr-3 rounded-control border border-border bg-surface text-small w-64 max-w-full"
          />
        </label>

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
            {item.label} <span className="tabular-nums opacity-70">{counts[item.value]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visibleMessages.length === 0 ? (
          <div className="card text-center text-small py-16">
            {query.trim() ? `No messages match “${query.trim()}”.` : EMPTY_LABELS[filter]}
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
                    onClick={() => handleArchive(item)}
                    disabled={busyId === item._id}
                    className="h-9 px-3 rounded-control border border-border text-small inline-flex items-center gap-1.5 transition hover:border-primary disabled:opacity-50"
                  >
                    {item.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    {item.archived ? "Unarchive" : "Archive"}
                  </button>

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
