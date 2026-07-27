import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Container from "../components/ui/Container";
import SEO from "../components/common/SEO";
import SkeletonCard from "../components/common/SkeletonCard";

import { getPublicPosts, getBlogTags } from "../services/public.blog.service";
import { trackPageView } from "../services/public.analytics.service";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const activeTag = searchParams.get("tag") || "";

  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    trackPageView("/blog");
  }, []);

  useEffect(() => {
    getBlogTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const data = await getPublicPosts({
          page,
          limit: 9,
          tag: activeTag || undefined,
        });

        if (!cancelled) {
          setPosts(data.posts);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error("Failed to load posts", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [page, activeTag]);

  const setTag = (tag) => {
    const next = new URLSearchParams();

    if (tag) next.set("tag", tag);

    setSearchParams(next);
  };

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(searchParams);

    next.set("page", String(nextPage));

    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title="Blog | Suryanshu Verma"
        description="Writing on software engineering, blockchain, and building things."
        keywords="Suryanshu Verma blog, blockchain developer blog, MERN developer blog"
        image="/og-image.png"
      />

      <Navbar />

      <Container className="pt-32 pb-24 md:pt-40">
        {/* HEADER */}
        <div className="mb-12 md:mb-16">
          <h1 className="text-hero">Blog</h1>

          <p className="text-large mt-4 max-w-xl">
            Notes on software engineering, blockchain, and building things end
            to end.
          </p>
        </div>

        {/* TAG FILTER */}
        {tags.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTag("")}
              className={`h-9 px-4 rounded-full border text-small transition ${
                !activeTag
                  ? "bg-primary text-background border-primary"
                  : "border-border bg-surface hover:border-primary"
              }`}
            >
              All
            </button>

            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTag(tag)}
                className={`h-9 px-4 rounded-full border text-small transition ${
                  activeTag === tag
                    ? "bg-primary text-background border-primary"
                    : "border-border bg-surface hover:border-primary"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* GRID */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-body">
              {activeTag
                ? `No posts tagged "${activeTag}" yet.`
                : "No posts published yet — check back soon."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post._id}
                to={`/blog/${post.slug}`}
                className="card glass-hover group flex flex-col"
              >
                <div className="aspect-16/10 rounded-2xl overflow-hidden bg-surface mb-5">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted text-small">
                      No cover image
                    </div>
                  )}
                </div>

                <h2 className="text-title mb-2 line-clamp-2">{post.title}</h2>

                {post.excerpt && (
                  <p className="text-small mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between text-muted text-xs pt-3">
                  <span>{formatDate(post.publishedAt)}</span>

                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {post.readingTime} min read
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="h-10 w-10 rounded-full border border-border bg-surface flex items-center justify-center transition hover:border-primary disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-small text-muted">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => goToPage(page + 1)}
              className="h-10 w-10 rounded-full border border-border bg-surface flex items-center justify-center transition hover:border-primary disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </Container>

      <Footer />
    </main>
  );
}

export default Blog;
