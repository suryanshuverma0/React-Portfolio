import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, MessageCircle, ExternalLink } from "lucide-react";

import { getPosts, deletePost } from "../services/blog.service";
import SkeletonCard from "../../components/common/SkeletonCard";
import ConfirmModal from "../components/ui/ConfirmModal";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPosts = async () => {
    try {
      const data = await getPosts();

      setPosts(data);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const confirmDelete = async () => {
    try {
      setDeleting(true);

      await deletePost(deleteId);

      toast.success("Post deleted");
      setDeleteId(null);
      await loadPosts();
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading">Blog</h1>

          <p className="text-body mt-3">
            {posts.length} post{posts.length === 1 ? "" : "s"} total.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/dashboard/blog/comments"
            className="h-control px-5 rounded-control border border-border inline-flex items-center gap-2 text-label transition hover:border-primary"
          >
            <MessageCircle size={16} />
            Comments
          </Link>

          <Link
            to="/dashboard/blog/new"
            className="h-control px-5 rounded-control bg-primary text-background inline-flex items-center gap-2 text-label transition hover:opacity-90"
          >
            <Plus size={16} />
            New Post
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="card text-center text-small py-16">
            No posts yet — create your first one.
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              className="card flex flex-wrap items-center justify-between gap-6"
            >
              <div className="flex items-center gap-5 min-w-0">
                <div className="h-20 w-28 shrink-0 rounded-xl border border-border bg-surface overflow-hidden">
                  {post.coverImage?.url ? (
                    <img
                      src={post.coverImage.url}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0">
                  <h3 className="text-label truncate">{post.title}</h3>

                  <p className="text-small mt-1 truncate">/blog/{post.slug}</p>

                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        post.isVisible
                          ? "bg-primary/10"
                          : "bg-surface border border-border"
                      }`}
                    >
                      {post.isVisible ? "Published" : "Draft"}
                    </span>

                    <span className="text-muted text-xs">
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>

                    <span className="text-muted text-xs">
                      {post.readingTime} min read
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 shrink-0">
                {post.isVisible && (
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-control border border-border px-4 py-2 transition hover:border-primary inline-flex items-center gap-2"
                  >
                    <ExternalLink size={14} />
                    View
                  </a>
                )}

                <Link
                  to={`/dashboard/blog/${post._id}/edit`}
                  className="rounded-control border border-border px-4 py-2 transition hover:border-primary"
                >
                  Edit
                </Link>

                <button
                  type="button"
                  onClick={() => setDeleteId(post._id)}
                  className="rounded-control bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Delete post"
        message="Are you sure you want to delete this post? This can't be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}

export default Blog;
