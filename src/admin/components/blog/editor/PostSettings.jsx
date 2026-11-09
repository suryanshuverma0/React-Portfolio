import { AnimatePresence, motion } from "framer-motion";
import { X, Link2, Tags, Search, CalendarClock, TriangleAlert, Lock, Unlock } from "lucide-react";

import TechnologyInput from "../../form/TechnologyInput";
import { SITE_URL } from "../../../../lib/site";

/* ========================================
   POST SETTINGS — slide-over with
   everything that isn't the writing itself:
   URL, tags, search/social appearance and
   scheduling.
========================================= */

const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const Section = ({ icon: Icon, title, children }) => (
  <section className="space-y-3 border-b border-border px-5 py-5 last:border-b-0">
    <h3 className="flex items-center gap-2 text-sm font-semibold">
      <Icon size={15} className="text-muted" /> {title}
    </h3>
    {children}
  </section>
);

const Counter = ({ value, max }) => (
  <span className={`text-[11px] font-mono ${value > max ? "text-red-500" : value > max * 0.9 ? "text-amber-500" : "text-muted"}`}>
    {value}/{max}
  </span>
);

const fieldClass =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-primary";

function PostSettings({
  open,
  onClose,
  post,
  update,
  slugLocked,
  setSlugLocked,
  wasPublished,
  savedSlug,
  existingTags,
}) {
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const seoTitle = post.seoTitle || post.title || "Untitled post";
  const seoDescription = post.seoDescription || post.excerpt || "Add an excerpt or a search description so people know what this post is about.";
  const suggestions = existingTags.filter((t) => !post.tags.includes(t)).slice(0, 12);
  const slugChangedLive = wasPublished && savedSlug && post.slug !== savedSlug;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            role="dialog"
            aria-label="Post settings"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-title">Post settings</h2>
              <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-surface" aria-label="Close settings">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto admin-scroll">
              <Section icon={Link2} title="URL">
                <div className="flex items-stretch overflow-hidden rounded-control border border-border bg-surface focus-within:border-primary">
                  <span className="hidden sm:flex items-center pl-3 text-xs text-muted whitespace-nowrap">/blog/</span>
                  <input
                    value={post.slug}
                    onChange={(e) => {
                      setSlugLocked(true);
                      update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") });
                    }}
                    className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"
                    aria-label="Post URL slug"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setSlugLocked(!slugLocked)}
                    className="flex items-center px-3 text-muted hover:text-primary"
                    title={slugLocked ? "Fixed — click to follow the title again" : "Follows the title — click to fix it"}
                    aria-label={slugLocked ? "Unlock URL from title" : "Lock URL"}
                  >
                    {slugLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                </div>
                <p className="truncate text-xs text-muted">
                  {host}/blog/<span className="text-primary">{post.slug || "your-post-url"}</span>
                </p>
                {slugChangedLive && (
                  <p className="flex gap-2 rounded-control bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                    <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                    This post is live. Changing its URL breaks links people already shared.
                  </p>
                )}
              </Section>

              <Section icon={Tags} title="Tags">
                <TechnologyInput
                  technologies={post.tags}
                  setTechnologies={(next) => update({ tags: typeof next === "function" ? next(post.tags) : next })}
                  label=""
                  placeholder="Add a tag and press Enter"
                />
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => update({ tags: [...post.tags, tag] })}
                        className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-secondary transition hover:border-primary hover:text-primary"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                )}
              </Section>

              <Section icon={Search} title="Search & social">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="seo-title" className="text-xs font-medium text-secondary">Search title</label>
                    <Counter value={(post.seoTitle || "").length} max={70} />
                  </div>
                  <input id="seo-title" value={post.seoTitle} onChange={(e) => update({ seoTitle: e.target.value.slice(0, 70) })} placeholder={post.title || "Defaults to the post title"} className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="seo-desc" className="text-xs font-medium text-secondary">Search description</label>
                    <Counter value={(post.seoDescription || "").length} max={170} />
                  </div>
                  <textarea
                    id="seo-desc"
                    rows={3}
                    value={post.seoDescription}
                    onChange={(e) => update({ seoDescription: e.target.value.slice(0, 170) })}
                    placeholder={post.excerpt || "Defaults to the excerpt"}
                    className={`${fieldClass} resize-none`}
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Google preview</p>
                  <div className="rounded-control border border-border bg-white p-3 text-left dark:bg-[#202124]">
                    <p className="truncate text-[12px] text-[#4d5156] dark:text-[#bdc1c6]">{host} › blog › {post.slug || "…"}</p>
                    <p className="mt-0.5 line-clamp-1 text-[17px] leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{seoTitle} | Suryanshu Verma</p>
                    <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#4d5156] dark:text-[#bdc1c6]">{seoDescription}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Social card</p>
                  <div className="overflow-hidden rounded-control border border-border">
                    {post.coverImage?.url ? (
                      <img src={post.coverImage.url} alt="" className="aspect-[1.91/1] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[1.91/1] items-center justify-center bg-surface text-xs text-muted">No cover — your default share image is used</div>
                    )}
                    <div className="space-y-0.5 bg-surface/60 px-3 py-2.5">
                      <p className="text-[11px] uppercase text-muted">{host}</p>
                      <p className="line-clamp-1 text-sm font-semibold">{seoTitle}</p>
                      <p className="line-clamp-1 text-xs text-secondary">{seoDescription}</p>
                    </div>
                  </div>
                </div>
              </Section>

              {!post.isVisible && (
                <Section icon={CalendarClock} title="Schedule">
                  <p className="text-xs text-muted">
                    {post.scheduledAt
                      ? `Publishes automatically on ${new Date(post.scheduledAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}.`
                      : "Pick a time and this draft publishes itself — then use “Schedule” in the top bar."}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={toLocalInput(post.scheduledAt)}
                      min={toLocalInput(new Date())}
                      onChange={(e) => update({ scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className={fieldClass}
                      aria-label="Publish at"
                    />
                    {post.scheduledAt && (
                      <button type="button" onClick={() => update({ scheduledAt: null })} className="rounded-control border border-border px-3 text-xs hover:bg-surface">
                        Clear
                      </button>
                    )}
                  </div>
                </Section>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default PostSettings;
