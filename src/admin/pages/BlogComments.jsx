import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Check, Trash2 } from "lucide-react";

import {
  getAllComments,
  approveComment,
  deleteComment,
} from "../services/blog.service";
import SkeletonCard from "../../components/common/SkeletonCard";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const filters = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "All", value: "all" },
];

function BlogComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState(null);

  const loadComments = async () => {
    try {
      const data = await getAllComments();

      setComments(data);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  const visibleComments = useMemo(() => {
    if (filter === "pending") return comments.filter((c) => !c.isApproved);
    if (filter === "approved") return comments.filter((c) => c.isApproved);
    return comments;
  }, [comments, filter]);

  const pendingCount = comments.filter((c) => !c.isApproved).length;

  const handleApprove = async (id) => {
    try {
      setBusyId(id);

      await approveComment(id);

      setComments((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isApproved: true } : c)),
      );

      toast.success("Comment approved");
    } catch {
      toast.error("Failed to approve comment");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setBusyId(id);

      await deleteComment(id);

      setComments((prev) => prev.filter((c) => c._id !== id));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-heading">Comments</h1>

        <p className="text-body mt-3">
          {pendingCount} pending comment{pendingCount === 1 ? "" : "s"} to
          review.
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
        {visibleComments.length === 0 ? (
          <div className="card text-center text-small py-16">
            No comments here.
          </div>
        ) : (
          visibleComments.map((comment) => (
            <div key={comment._id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-label">{comment.name}</span>

                  <span className="text-muted text-xs">{comment.email}</span>

                  <span className="text-muted text-xs">
                    {formatDate(comment.createdAt)}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      comment.isApproved
                        ? "bg-primary/10"
                        : "bg-surface border border-border"
                    }`}
                  >
                    {comment.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>

                <div className="flex gap-2 shrink-0">
                  {!comment.isApproved && (
                    <button
                      type="button"
                      onClick={() => handleApprove(comment._id)}
                      disabled={busyId === comment._id}
                      className="h-9 px-3 rounded-control bg-primary text-background text-small inline-flex items-center gap-1.5 transition hover:opacity-90 disabled:opacity-50"
                    >
                      <Check size={14} />
                      Approve
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(comment._id)}
                    disabled={busyId === comment._id}
                    className="h-9 px-3 rounded-control bg-red-500 text-white text-small inline-flex items-center gap-1.5 transition hover:bg-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>

              <p className="text-small whitespace-pre-wrap break-words">
                {comment.content}
              </p>

              {comment.post && (
                <Link
                  to={`/dashboard/blog/${comment.post._id}/edit`}
                  className="text-muted text-xs hover:text-primary transition-colors inline-block"
                >
                  on "{comment.post.title}"
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BlogComments;
