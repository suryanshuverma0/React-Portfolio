import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { X, Globe, EyeOff, ExternalLink, Loader2, Send } from "lucide-react";

import { getPublishStatus, publishNote, unpublishNote } from "../../services/automation.service";
import { uploadImage } from "../../services/upload.service";
import { getNote } from "../../services/notes.service";
import { inkToPngFile } from "./ink/snapshot";

/* ========================================
   Publish a note to the blog (or update /
   unpublish it). Typed notes become a
   Markdown post; handwritten ones a post
   with a high-res image of the page.
========================================= */

const slugify = (v) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const inputClass = "w-full h-control px-4 rounded-control bg-surface border border-border outline-none focus:border-primary";

function PublishDialog({ note, flush, onClose, onChange }) {
  const [status, setStatus] = useState(null);
  const [title, setTitle] = useState(note.title || "");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState((note.text || "").replace(/\s+/g, " ").trim().slice(0, 280));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPublishStatus(note._id)
      .then((s) => {
        setStatus(s);
        if (s.post) {
          setTitle(s.post.title);
          setSlug(s.post.slug);
          setSlugTouched(true);
          if (s.post.excerpt) setExcerpt(s.post.excerpt);
        }
      })
      .catch(() => setStatus({ published: false, post: null }));
  }, [note._id]);

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const postUrl = (s) => `${window.location.origin}/blog/${s}`;

  const publish = async () => {
    try {
      setBusy(true);
      await flush?.(); // make sure the latest edits are saved first
      let imageUrl;
      if (note.kind === "handwritten") {
        const { ink } = await getNote(note._id); // freshest saved page
        if (!ink?.elements?.length) throw new Error("This page is empty");
        const file = await inkToPngFile(ink, `${effectiveSlug || "note"}.png`);
        imageUrl = (await uploadImage(file, "blog")).url;
      }
      const result = await publishNote(note._id, {
        title: title.trim() || undefined,
        slug: effectiveSlug || undefined,
        excerpt: excerpt.trim(),
        ...(imageUrl && { imageUrl }),
      });
      setStatus(result);
      onChange?.(result);
      toast.success(status?.post ? "Blog post updated" : "Published to your blog");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Publishing failed");
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    try {
      setBusy(true);
      const result = await unpublishNote(note._id);
      setStatus(result);
      onChange?.(result);
      toast.success("Unpublished — the post is hidden from your blog");
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't unpublish");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div className="card w-full max-w-lg space-y-5" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Publish to blog">
        <div className="flex items-center justify-between">
          <h3 className="text-title inline-flex items-center gap-2">
            <Globe size={18} /> Publish to blog
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-surface">
            <X size={18} />
          </button>
        </div>

        {!status ? (
          <p className="text-small inline-flex items-center gap-2">
            <Loader2 size={15} className="animate-spin" /> Checking…
          </p>
        ) : (
          <>
            {status.post && (
              <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-small ${status.published ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-surface"}`}>
                <span>
                  {status.published ? "Live on your blog" : "Unpublished (hidden)"} · <code className="text-xs">/blog/{status.post.slug}</code>
                </span>
                {status.published && (
                  <a href={postUrl(status.post.slug)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs underline">
                    View <ExternalLink size={11} />
                  </a>
                )}
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-label">Post title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={inputClass} />
            </label>

            <label className="block space-y-2">
              <span className="text-label">URL</span>
              <div className="flex items-center gap-2">
                <span className="text-small text-muted shrink-0">/blog/</span>
                <input
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  className={inputClass}
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-label">Excerpt ({excerpt.length}/300)</span>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value.slice(0, 300))}
                rows={3}
                className="w-full px-4 py-3 rounded-control bg-surface border border-border outline-none focus:border-primary"
              />
            </label>

            <p className="text-xs text-muted">
              {note.kind === "handwritten"
                ? "Your handwriting is published as a high-resolution image of the page."
                : "Headings, lists, checklists, code, tables, links and images carry over to the blog."}{" "}
              Tags from the note are added to the post. Later edits to the note aren&apos;t published until you click update.
            </p>

            <div className="flex flex-wrap justify-end gap-2">
              {status.published && (
                <button type="button" onClick={unpublish} disabled={busy} className="h-control px-4 rounded-control border border-border bg-surface text-small inline-flex items-center gap-2 disabled:opacity-50">
                  <EyeOff size={15} /> Unpublish
                </button>
              )}
              <button type="button" onClick={publish} disabled={busy || !title.trim()} className="h-control px-5 rounded-control bg-primary text-background text-small font-medium inline-flex items-center gap-2 disabled:opacity-50">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {status.post ? (status.published ? "Update post" : "Publish again") : "Publish"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PublishDialog;
