import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MessageCircle } from "lucide-react";

import { getPostComments, submitComment } from "../../services/public.blog.service";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const initials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function CommentSection({ slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: "", email: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadComments = async () => {
    try {
      const data = await getPostComments(slug);

      setComments(data);
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.content.trim()) {
      toast.error("Please fill in every field");
      return;
    }

    try {
      setSubmitting(true);

      await submitComment(slug, form);

      setSubmitted(true);
      setForm({ name: "", email: "", content: "" });
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retryAfter;

        toast.error(
          `Too many comments. Try again in ${retryAfter} seconds.`,
        );

        return;
      }

      const firstError = error.response?.data?.errors?.[0]?.message;

      toast.error(
        firstError || error.response?.data?.message || "Failed to submit comment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-16 md:mt-20">
      <h2 className="text-title mb-8 inline-flex items-center gap-2">
        <MessageCircle size={20} />
        Comments{comments.length > 0 ? ` (${comments.length})` : ""}
      </h2>

      {/* LIST */}
      {loading ? (
        <p className="text-small text-muted">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-small text-muted mb-10">
          No comments yet — be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-5 mb-12">
          {comments.map((comment) => (
            <div key={comment._id} className="card flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-surface border border-border flex items-center justify-center text-small font-medium">
                {initials(comment.name) || "?"}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-label">{comment.name}</span>

                  <span className="text-muted text-xs">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>

                <p className="text-small mt-2 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM */}
      <div className="card">
        <h3 className="text-label mb-5">Leave a comment</h3>

        {submitted ? (
          <p className="text-small">
            Thanks — your comment has been submitted and will appear once
            it's approved.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="h-control w-full px-control rounded-control bg-surface border border-border outline-none transition focus:border-primary"
              />

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Your email (not published)"
                className="h-control w-full px-control rounded-control bg-surface border border-border outline-none transition focus:border-primary"
              />
            </div>

            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full p-5 rounded-3xl bg-surface border border-border outline-none resize-none transition focus:border-primary"
            />

            <button
              type="submit"
              disabled={submitting}
              className="h-control px-6 rounded-control bg-primary text-background text-label transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Comment"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default CommentSection;
