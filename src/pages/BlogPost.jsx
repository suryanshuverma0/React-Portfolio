import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Container from "../components/ui/Container";
import SEO from "../components/common/SEO";
import MarkdownRenderer from "../components/blog/MarkdownRenderer";
import CommentSection from "../components/blog/CommentSection";
import NotFound from "./NotFound";

import { getPublicPostBySlug } from "../services/public.blog.service";
import { getPublicProfile } from "../services/public.profile.service";
import { trackPageView } from "../services/public.analytics.service";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

function BlogPost() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [checked, setChecked] = useState(false);
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getPublicPostBySlug(slug);

        if (!cancelled) setPost(data);
      } catch (error) {
        console.error("Failed to load post", error);
      } finally {
        if (!cancelled) setChecked(true);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    getPublicProfile()
      .then(setAuthor)
      .catch(() => setAuthor(null));
  }, []);

  useEffect(() => {
    trackPageView(`/blog/${slug}`);
  }, [slug]);

  if (!post) {
    if (!checked) return null;

    return <NotFound />;
  }

  return (
    <main className="min-h-screen bg-background">
      <SEO
        title={`${post.title} | Suryanshu Verma`}
        description={post.excerpt || post.title}
        keywords={`${post.title}, ${(post.tags || []).join(", ")}`}
        image={post.coverImage || "/og-image.png"}
      />

      <Navbar />

      <Container className="pt-32 pb-24 md:pt-40 max-w-3xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-small text-secondary hover:text-primary transition-all mb-8"
        >
          <ArrowLeft size={16} />
          Back to Blog
        </Link>

        {/* TITLE */}
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.04em] leading-[1.05] mb-6">
          {post.title}
        </h1>

        {/* META */}
        <div className="flex items-center flex-wrap gap-4 mb-8 text-small text-muted">
          <div className="flex items-center gap-2">
            {author?.image?.url || author?.image ? (
              <img
                src={author.image?.url || author.image}
                alt={author.name}
                className="h-8 w-8 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-medium text-primary">
                {(author?.name || "SV").slice(0, 2).toUpperCase()}
              </div>
            )}

            <span className="text-secondary">{author?.name || "Suryanshu Verma"}</span>
          </div>

          <span>·</span>

          <span>{formatDate(post.publishedAt)}</span>

          <span>·</span>

          <span className="inline-flex items-center gap-1">
            <Clock size={13} />
            {post.readingTime} min read
          </span>
        </div>

        {/* TAGS */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`/blog?tag=${encodeURIComponent(tag)}`}
                className="px-3 py-1.5 rounded-full bg-surface border border-border text-small hover:border-primary transition"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* COVER IMAGE */}
        {post.coverImage && (
          <div className="mb-10 md:mb-14 rounded-3xl overflow-hidden border border-border">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* CONTENT */}
        <MarkdownRenderer content={post.content} />

        {/* COMMENTS */}
        <CommentSection slug={post.slug} />
      </Container>

      <Footer />
    </main>
  );
}

export default BlogPost;
