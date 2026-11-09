import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Settings2,
  Eye,
  PenLine,
  FileCode,
  Maximize2,
  Minimize2,
  ImagePlus,
  RefreshCw,
  Trash2,
  Check,
  CircleDot,
  CalendarClock,
  Globe,
  Keyboard,
  ListTree,
  TriangleAlert,
  History,
  X,
  ChevronDown,
  CircleAlert,
  CircleCheck,
} from "lucide-react";

import RichEditor from "../components/blog/editor/RichEditor";
import PostSettings from "../components/blog/editor/PostSettings";
import { survivesVisualEditor, countWords, readingMinutes } from "../components/blog/editor/editorKit";
import MarkdownRenderer from "../../components/blog/MarkdownRenderer";
import { getPost, createPost, updatePost } from "../services/blog.service";
import { uploadImage } from "../services/upload.service";
import { getBlogTags } from "../../services/public.blog.service";

/* ========================================
   BLOG WRITING STUDIO

   A document, not a form: cover, title and
   subtitle sit on the page, the body is a
   visual editor (with a Markdown mode and a
   reader preview), and settings live in a
   slide-over. Work is autosaved to this
   browser as you type and can be recovered;
   publishing goes through a short checklist.
========================================= */

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  tags: [],
  coverImage: null,
  isVisible: false,
  scheduledAt: null,
  seoTitle: "",
  seoDescription: "",
};

const FIELDS = Object.keys(EMPTY);

const pick = (source) =>
  Object.fromEntries(
    FIELDS.map((key) => {
      const value = source?.[key];
      if (key === "tags") return [key, Array.isArray(value) ? value : []];
      if (key === "coverImage") return [key, value?.url ? { publicId: value.publicId, url: value.url } : null];
      if (key === "isVisible") return [key, Boolean(value)];
      if (key === "scheduledAt") return [key, value || null];
      return [key, value ?? ""];
    }),
  );

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

const draftKey = (id) => `blog-draft:${id || "new"}`;

const readDraft = (id) => {
  try {
    return JSON.parse(localStorage.getItem(draftKey(id)));
  } catch {
    return null;
  }
};

const clearDraft = (id) => {
  try {
    localStorage.removeItem(draftKey(id));
  } catch {
    /* ignore */
  }
};

const fmtTime = (d) => new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const fmtDateTime = (d) => new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

// Markdown → rough plain text, for stats while in Markdown mode.
const markdownText = (md) =>
  md
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*/g, ""))
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ");

const SHORTCUTS = [
  ["/", "Insert a block (heading, list, image, table…)"],
  ["Ctrl + S", "Save"],
  ["Ctrl + Shift + P", "Toggle preview"],
  ["Ctrl + Shift + F", "Focus mode"],
  ["Ctrl + B / I / E", "Bold / italic / inline code"],
  ["# space", "Heading (## for smaller)"],
  ["- space  ·  1. space", "Bulleted / numbered list"],
  ["[ ] space", "Checklist"],
  ["> space", "Quote"],
  ["``` + language", "Code block, e.g. ```js"],
  ["---", "Divider"],
];

function TopButton({ onClick, active, label, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm transition disabled:opacity-40 ${
        active ? "bg-surface text-primary" : "text-secondary hover:bg-surface hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function BlogEditor() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [postId, setPostId] = useState(routeId || null);
  const [post, setPost] = useState(null);
  const [snapshot, setSnapshot] = useState(null); // JSON of the last saved fields
  const [meta, setMeta] = useState({});
  const [wasPublished, setWasPublished] = useState(false);
  const [slugLocked, setSlugLocked] = useState(Boolean(routeId));

  const [mode, setMode] = useState("write"); // write | markdown | preview
  const [editorKey, setEditorKey] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const [fidelityWarning, setFidelityWarning] = useState(false);
  const [recovery, setRecovery] = useState(null); // local draft newer than the server copy
  const [savedLocallyAt, setSavedLocallyAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingBody, setUploadingBody] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [editorStats, setEditorStats] = useState({ words: 0, chars: 0, headings: [] });
  const [existingTags, setExistingTags] = useState([]);

  const editorRef = useRef(null);
  const coverInputRef = useRef(null);

  /* ----- load ----- */

  const hydrate = useCallback((fields, metaData) => {
    const clean = pick(fields);
    setPost(clean);
    setSnapshot(JSON.stringify(clean));
    setMeta(metaData || {});
    setWasPublished(Boolean(clean.isVisible || metaData?.publishedAt));

    // Content the visual editor can't hold losslessly opens as Markdown.
    if (clean.content && !survivesVisualEditor(clean.content)) {
      setMode("markdown");
      setFidelityWarning(true);
    }

    // Offer a local backup only if it's newer than the server copy and different.
    const local = readDraft(metaData?._id || null);
    const serverTime = metaData?.updatedAt ? new Date(metaData.updatedAt).getTime() : 0;
    if (local?.fields && local.savedAt > serverTime && JSON.stringify(pick(local.fields)) !== JSON.stringify(clean)) setRecovery(local);
    else if (local) clearDraft(metaData?._id || null);
  }, []);

  useEffect(() => {
    // A post handed over by the create flow opens without refetching.
    const passed = location.state?.post;
    const source = !routeId
      ? Promise.resolve(null)
      : passed && String(passed._id) === routeId
        ? Promise.resolve(passed)
        : getPost(routeId);

    source.then((data) => hydrate(data || EMPTY, data)).catch(() => setLoadError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  useEffect(() => {
    getBlogTags()
      .then((tags) => setExistingTags((Array.isArray(tags) ? tags : []).map((t) => (typeof t === "string" ? t : t.tag || t.name || t._id)).filter(Boolean)))
      .catch(() => {});
  }, []);

  /* ----- edits ----- */

  const update = useCallback(
    (patch) =>
      setPost((prev) => {
        const next = { ...prev, ...patch };
        if ("title" in patch && !slugLocked) next.slug = slugify(patch.title);
        return next;
      }),
    [slugLocked],
  );

  // Only re-serialize when the visual editor actually has edits; otherwise
  // keep the markdown exactly as stored.
  const currentContent = () =>
    mode === "write" && editorRef.current?.hasChanges() ? editorRef.current.getMarkdown() : post.content;

  const dirty = Boolean(post && snapshot && JSON.stringify(post) !== snapshot);

  // Autosave to this browser (debounced) — survives refreshes and crashes.
  useEffect(() => {
    if (!post || !dirty) return undefined;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(postId), JSON.stringify({ fields: post, savedAt: Date.now() }));
        setSavedLocallyAt(Date.now());
      } catch {
        /* storage full / blocked */
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [post, dirty, postId]);

  const restoreRecovery = () => {
    setPost(pick(recovery.fields));
    setEditorKey((k) => k + 1);
    setRecovery(null);
    toast.success("Recovered your unsaved changes");
  };

  const discardRecovery = () => {
    clearDraft(postId);
    setRecovery(null);
  };

  /* ----- cover ----- */

  const uploadCover = async (file) => {
    if (!file?.type?.startsWith("image/")) return;
    const preview = URL.createObjectURL(file);
    const previous = post.coverImage;
    update({ coverImage: { publicId: "", url: preview } });
    setUploadingCover(true);
    try {
      const image = await uploadImage(file, "blog");
      update({ coverImage: { publicId: image.publicId, url: image.url } });
    } catch {
      update({ coverImage: previous });
      toast.error("Cover upload failed");
    } finally {
      URL.revokeObjectURL(preview);
      setUploadingCover(false);
    }
  };

  /* ----- save ----- */

  const save = async (intent) => {
    if (saving || uploadingCover || uploadingBody) {
      if (uploadingCover || uploadingBody) toast.info("Wait for the image upload to finish");
      return;
    }

    const content = currentContent();
    const fields = { ...post, content };
    const slug = slugify(fields.slug || fields.title);

    if (!fields.title.trim()) return toast.error("Give your post a title");
    if (slug.length < 2) return toast.error("The URL needs at least 2 letters or numbers");
    if (!content.trim()) return toast.error("Write something before saving");

    let isVisible = fields.isVisible;
    let scheduledAt = fields.scheduledAt;

    if (intent === "publish") {
      isVisible = true;
      scheduledAt = null;
    } else if (intent === "unpublish") {
      isVisible = false;
      scheduledAt = null;
    } else if (intent === "schedule") {
      if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
        setSettingsOpen(true);
        return toast.error("Pick a future date and time to schedule");
      }
      isVisible = false;
    } else if (!isVisible && scheduledAt && new Date(scheduledAt) <= new Date()) {
      scheduledAt = null;
    }

    const payload = {
      title: fields.title.trim(),
      slug,
      excerpt: fields.excerpt.trim().slice(0, 300),
      content,
      tags: fields.tags,
      seoTitle: fields.seoTitle.trim(),
      seoDescription: fields.seoDescription.trim(),
      coverImage: fields.coverImage,
      isVisible,
      scheduledAt,
    };

    setSaving(true);
    try {
      const saved = postId ? await updatePost(postId, payload) : await createPost(payload);
      const clean = pick(saved);

      clearDraft(postId);
      setPost(clean);
      setSnapshot(JSON.stringify(clean));
      setMeta(saved);
      setWasPublished(Boolean(clean.isVisible || saved.publishedAt));
      setSlugLocked(true);
      setSavedLocallyAt(null);

      toast.success(
        intent === "publish"
          ? "Published — it's live on your blog 🎉"
          : intent === "schedule"
            ? `Scheduled for ${fmtDateTime(scheduledAt)}`
            : intent === "unpublish"
              ? "Unpublished — it's a draft again"
              : isVisible
                ? "Changes are live"
                : "Draft saved",
      );

      if (!postId) {
        clearDraft(null);
        setPostId(String(saved._id));
        navigate(`/dashboard/blog/${saved._id}/edit`, { replace: true, state: { post: saved } });
      }
    } catch (error) {
      toast.error(error.response?.data?.errors?.[0]?.message || error.response?.data?.message || "Couldn't save the post");
    } finally {
      setSaving(false);
      setChecklistOpen(false);
      setMoreOpen(false);
    }
  };

  const quickSave = () => save(post?.isVisible ? "update" : "draft");

  /* ----- modes ----- */

  const switchMode = (next) => {
    if (next === mode) return;
    if (mode === "write" && editorRef.current?.hasChanges()) {
      const md = editorRef.current.getMarkdown();
      setPost((p) => ({ ...p, content: md }));
    }
    if (next === "write") {
      if (!survivesVisualEditor(post.content)) {
        toast.warn("Some formatting isn't supported by the visual editor — staying in Markdown so nothing is lost.");
        return;
      }
      setFidelityWarning(false);
      setEditorKey((k) => k + 1);
    }
    setMode(next);
  };

  // Keyboard shortcuts + leave guard.
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        quickSave();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        switchMode(mode === "preview" ? "write" : "preview");
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFocusMode((f) => !f);
      } else if (e.key === "Escape" && focusMode && !document.querySelector('[role="listbox"]')) {
        setFocusMode(false);
      }
    };
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  });

  /* ----- derived ----- */

  const stats = useMemo(() => {
    if (!post) return { words: 0, minutes: 1, headings: [] };
    if (mode === "write") return { words: editorStats.words, minutes: readingMinutes(editorStats.words), headings: editorStats.headings };
    const words = countWords(markdownText(post.content));
    const headings = [...post.content.matchAll(/^(#{1,4})\s+(.+)$/gm)].map((m) => ({ level: m[1].length, text: m[2] }));
    return { words, minutes: readingMinutes(words), headings };
  }, [post, mode, editorStats]);

  const checklist = useMemo(() => {
    if (!post) return [];
    const content = mode === "write" ? null : post.content;
    const missingAlt = content ? /!\[\s*\]\(/.test(content) : false;
    return [
      { ok: Boolean(post.title.trim()), label: "Title", required: true },
      { ok: stats.words >= 150, label: `Substantial content (${stats.words} words)` },
      { ok: Boolean(post.excerpt.trim()), label: "Subtitle / excerpt — shown on the blog list and in search" },
      { ok: Boolean(post.coverImage?.url), label: "Cover image — shown on cards and social shares" },
      { ok: post.tags.length > 0, label: "At least one tag" },
      { ok: stats.headings.length > 0 || stats.words < 600, label: "Headings to break up a long post" },
      ...(content ? [{ ok: !missingAlt, label: "Every image has alt text" }] : []),
    ];
  }, [post, stats, mode]);

  /* ----- render ----- */

  if (loadError) {
    return (
      <div className="card mx-auto max-w-lg space-y-4 py-12 text-center">
        <p className="text-title">Couldn&apos;t open this post</p>
        <p className="text-small">It may have been deleted, or the connection dropped.</p>
        <button type="button" onClick={() => navigate("/dashboard/blog")} className="h-control rounded-control bg-primary px-6 font-medium text-background">
          Back to posts
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-6 pt-6">
        <div className="h-10 rounded-control bg-surface" />
        <div className="h-56 rounded-3xl bg-surface" />
        <div className="h-12 w-3/4 rounded-full bg-surface" />
        <div className="h-5 w-1/2 rounded-full bg-surface" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 rounded-full bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  const scheduled = !post.isVisible && post.scheduledAt && new Date(post.scheduledAt) > new Date();
  const status = post.isVisible ? "Published" : scheduled ? "Scheduled" : "Draft";
  const busy = saving || uploadingCover || uploadingBody;

  const saveState = saving
    ? "Saving…"
    : uploadingBody || uploadingCover
      ? "Uploading image…"
      : dirty
        ? savedLocallyAt
          ? `Unsaved · backed up ${fmtTime(savedLocallyAt)}`
          : "Unsaved changes"
        : meta?.updatedAt
          ? `Saved ${fmtTime(meta.updatedAt)}`
          : "New post";

  return (
    <div
      className={
        focusMode
          ? "fixed inset-0 z-50 overflow-y-auto bg-background admin-scroll"
          : "-mx-4 -my-6 sm:-mx-6 md:-mx-8 md:-my-8 xl:-mx-10 xl:-my-10"
      }
    >
      {/* Top bar. Sticky elements stay clear of the scroll container's
          padding, so offset by it to sit flush under the admin header. */}
      <div className={`sticky z-30 border-b border-border bg-background/85 backdrop-blur-xl ${focusMode ? "top-0" : "-top-6 md:-top-8 xl:-top-10"}`}>
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:px-5">
          <TopButton label="Back to posts" onClick={() => navigate("/dashboard/blog")}>
            <ArrowLeft size={17} />
          </TopButton>

          <span
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              status === "Published"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : status === "Scheduled"
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  : "bg-surface text-secondary"
            }`}
          >
            {status === "Published" ? <Globe size={12} /> : status === "Scheduled" ? <CalendarClock size={12} /> : <CircleDot size={12} />}
            {status === "Scheduled" ? `Scheduled · ${fmtDateTime(post.scheduledAt)}` : status}
          </span>

          <span className="hidden md:inline truncate text-xs text-muted">{saveState}</span>

          <div className="ml-auto flex items-center gap-0.5">
            <div className="mr-1 hidden sm:flex rounded-lg border border-border bg-surface/50 p-0.5">
              {[
                { id: "write", label: "Write", icon: PenLine },
                { id: "markdown", label: "Markdown", icon: FileCode },
                { id: "preview", label: "Preview", icon: Eye },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchMode(id)}
                  className={`relative inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs transition ${mode === id ? "text-primary" : "text-secondary hover:text-primary"}`}
                  title={id === "preview" ? "Preview (Ctrl+Shift+P)" : label}
                >
                  {mode === id && (
                    <motion.span layoutId="blog-mode" className="absolute inset-0 rounded-md border border-border bg-background shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                  )}
                  <Icon size={14} className="relative" />
                  <span className="relative hidden lg:inline">{label}</span>
                </button>
              ))}
            </div>

            <span className="sm:hidden">
              <TopButton label="Preview" onClick={() => switchMode(mode === "preview" ? "write" : "preview")} active={mode === "preview"}>
                <Eye size={17} />
              </TopButton>
            </span>
            <TopButton label={focusMode ? "Exit focus mode (Esc)" : "Focus mode (Ctrl+Shift+F)"} onClick={() => setFocusMode((f) => !f)} active={focusMode}>
              {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </TopButton>
            <TopButton label="Keyboard shortcuts" onClick={() => setShortcutsOpen(true)}>
              <Keyboard size={16} />
            </TopButton>
            <TopButton label="Post settings" onClick={() => setSettingsOpen(true)}>
              <Settings2 size={16} />
            </TopButton>

            {/* Save actions */}
            <div className="relative ml-1.5 flex items-center">
              {!post.isVisible && (
                <button
                  type="button"
                  onClick={() => save("draft")}
                  disabled={busy}
                  className="hidden md:inline-flex h-9 items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium text-secondary transition hover:bg-surface hover:text-primary disabled:opacity-40"
                  title="Save draft (Ctrl+S)"
                >
                  Save draft
                </button>
              )}

              <div className="flex">
                <button
                  type="button"
                  onClick={() => (post.isVisible ? save("update") : scheduled ? save("schedule") : setChecklistOpen(true))}
                  disabled={busy}
                  className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-l-lg bg-primary pl-3.5 pr-3 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : post.isVisible ? <Check size={14} /> : scheduled ? <CalendarClock size={14} /> : <Globe size={14} />}
                  {post.isVisible ? "Update" : scheduled ? "Schedule" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => setMoreOpen((o) => !o)}
                  disabled={busy}
                  className="inline-flex h-9 items-center rounded-r-lg border-l border-background/20 bg-primary px-1.5 text-background transition hover:opacity-90 disabled:opacity-50"
                  aria-label="More publishing options"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              <AnimatePresence>
                {moreOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} aria-hidden />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-border bg-card p-1.5 shadow-2xl"
                    >
                      {!post.isVisible && (
                        <>
                          <button type="button" onClick={() => { setMoreOpen(false); setChecklistOpen(true); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface">
                            <Globe size={14} /> Publish now…
                          </button>
                          <button type="button" onClick={() => { setMoreOpen(false); setSettingsOpen(true); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface">
                            <CalendarClock size={14} /> {scheduled ? "Change schedule" : "Schedule for later"}
                          </button>
                          <button type="button" onClick={() => save("draft")} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface md:hidden">
                            <Check size={14} /> Save draft
                          </button>
                        </>
                      )}
                      {post.isVisible && (
                        <button type="button" onClick={() => save("unpublish")} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-amber-600 hover:bg-surface dark:text-amber-400">
                          <History size={14} /> Unpublish (back to draft)
                        </button>
                      )}
                      {wasPublished && post.slug && (
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface">
                          <Eye size={14} /> View live post
                        </a>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8">
        {/* Banners */}
        <AnimatePresence>
          {recovery && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mb-6 flex flex-wrap items-center gap-3 rounded-control border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm">
              <History size={16} className="text-sky-600 dark:text-sky-400" />
              <span className="flex-1 min-w-48">You have unsaved changes from {fmtDateTime(recovery.savedAt)} in this browser.</span>
              <button type="button" onClick={restoreRecovery} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-background">Restore</button>
              <button type="button" onClick={discardRecovery} className="rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-surface">Discard</button>
            </motion.div>
          )}
          {fidelityWarning && mode === "markdown" && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mb-6 flex gap-3 rounded-control border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="flex-1">This post uses formatting the visual editor can&apos;t keep (like raw HTML), so it opened in Markdown mode to keep everything intact.</span>
              <button type="button" onClick={() => setFidelityWarning(false)} aria-label="Dismiss" className="rounded p-0.5 hover:bg-surface"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          {mode === "preview" ? (
            <motion.article key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs text-muted">
                <Eye size={12} /> Reader preview — exactly how it renders on your blog
              </p>
              {post.coverImage?.url && <img src={post.coverImage.url} alt="" className="mb-8 aspect-[2/1] w-full rounded-3xl object-cover" />}
              {post.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
              )}
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{post.title || "Untitled post"}</h1>
              {post.excerpt && <p className="mt-4 text-lg text-secondary">{post.excerpt}</p>}
              <p className="mt-5 text-sm text-muted">
                {meta?.publishedAt ? new Date(meta.publishedAt).toLocaleDateString(undefined, { dateStyle: "long" }) : "Not published yet"} · {stats.minutes} min read
              </p>
              <hr className="my-8 border-border" />
              <MarkdownRenderer content={post.content} />
            </motion.article>
          ) : (
            <motion.div key="write" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Cover */}
              {post.coverImage?.url ? (
                <div className="group relative mb-8 overflow-hidden rounded-3xl border border-border">
                  <img src={post.coverImage.url} alt="" className={`aspect-[2/1] w-full object-cover transition ${uploadingCover ? "opacity-50" : ""}`} />
                  {uploadingCover && (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                      <RefreshCw size={16} className="mr-2 animate-spin" /> Uploading…
                    </span>
                  )}
                  <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                    <button type="button" onClick={() => coverInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/75">
                      <RefreshCw size={13} /> Change
                    </button>
                    <button type="button" onClick={() => update({ coverImage: null })} className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/75">
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    uploadCover(e.dataTransfer.files?.[0]);
                  }}
                  className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition hover:bg-surface hover:text-primary"
                >
                  <ImagePlus size={16} /> Add cover image
                </button>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={(e) => { uploadCover(e.target.files?.[0]); e.target.value = ""; }} />

              {/* Title + subtitle */}
              <textarea
                value={post.title}
                onChange={(e) => update({ title: e.target.value.replace(/\n/g, " ").slice(0, 200) })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("post-excerpt")?.focus();
                  }
                }}
                placeholder="Post title"
                rows={1}
                autoFocus={!routeId}
                className="blog-autosize w-full bg-transparent focus:outline-none text-4xl font-semibold leading-[1.1] tracking-tight outline-none placeholder:text-muted/60 sm:text-5xl"
                aria-label="Title"
              />
              <textarea
                id="post-excerpt"
                value={post.excerpt}
                onChange={(e) => update({ excerpt: e.target.value.replace(/\n/g, " ").slice(0, 300) })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    editorRef.current?.focus();
                  }
                }}
                placeholder="Add a subtitle — a one-line summary readers see first"
                rows={1}
                className="blog-autosize mt-4 w-full bg-transparent focus:outline-none text-xl leading-relaxed text-secondary outline-none placeholder:text-muted/60"
                aria-label="Subtitle"
              />
              {post.excerpt.length > 240 && <p className="mt-1 text-right font-mono text-[11px] text-muted">{post.excerpt.length}/300</p>}

              {post.tags.length > 0 && (
                <button type="button" onClick={() => setSettingsOpen(true)} className="mt-4 flex flex-wrap gap-1.5" title="Edit tags">
                  {post.tags.map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </button>
              )}

              <hr className="my-8 border-border" />

              {mode === "write" ? (
                <RichEditor
                  key={editorKey}
                  ref={editorRef}
                  initialMarkdown={post.content}
                  onChange={(md) => setPost((p) => (p && p.content !== md ? { ...p, content: md } : p))}
                  onStats={setEditorStats}
                  onUploadingChange={setUploadingBody}
                />
              ) : (
                <textarea
                  value={post.content}
                  onChange={(e) => update({ content: e.target.value })}
                  placeholder="Write in Markdown…"
                  spellCheck
                  className="blog-autosize min-h-[60vh] w-full rounded-control border border-border bg-surface/40 p-5 font-mono text-[13.5px] leading-relaxed outline-none focus:outline-none focus:border-border-strong"
                  aria-label="Markdown content"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer stats + outline */}
      <div className={`z-20 border-t border-border bg-background/85 backdrop-blur-xl ${focusMode ? "fixed inset-x-0 bottom-0" : "sticky -bottom-6 md:-bottom-8 xl:-bottom-10"}`}>
        <div className="mx-auto flex h-10 max-w-6xl items-center gap-4 px-4 text-xs text-muted sm:px-6">
          <span>{stats.words.toLocaleString()} words</span>
          <span>{stats.minutes} min read</span>
          <div className="relative">
            <button type="button" onClick={() => setOutlineOpen((o) => !o)} className="inline-flex items-center gap-1 hover:text-primary" disabled={!stats.headings.length}>
              <ListTree size={13} /> {stats.headings.length} heading{stats.headings.length === 1 ? "" : "s"}
            </button>
            <AnimatePresence>
              {outlineOpen && stats.headings.length > 0 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOutlineOpen(false)} aria-hidden />
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute bottom-8 left-0 z-50 max-h-80 w-72 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-2xl"
                  >
                    <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted">Outline</p>
                    {stats.headings.map((h, i) => (
                      <button
                        key={`${i}-${h.text}`}
                        type="button"
                        onClick={() => {
                          setOutlineOpen(false);
                          if (mode === "write") editorRef.current?.scrollToHeading(i);
                        }}
                        className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm text-secondary hover:bg-surface hover:text-primary"
                        style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                      >
                        {h.text || "Untitled heading"}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <span className="ml-auto hidden sm:inline">Type “/” for blocks · Ctrl+S to save</span>
        </div>
      </div>

      <PostSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        post={post}
        update={update}
        slugLocked={slugLocked}
        setSlugLocked={setSlugLocked}
        wasPublished={wasPublished}
        savedSlug={snapshot ? JSON.parse(snapshot).slug : ""}
        existingTags={existingTags}
      />

      {/* Publish checklist */}
      <AnimatePresence>
        {checklistOpen && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setChecklistOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"
              role="dialog"
              aria-label="Ready to publish?"
            >
              <h2 className="text-title">Ready to publish?</h2>
              <p className="mt-1 text-small">
                It goes live at <span className="font-mono text-primary">/blog/{slugify(post.slug || post.title) || "…"}</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5 text-sm">
                    {item.ok ? (
                      <CircleCheck size={17} className="mt-0.5 shrink-0 text-emerald-500" />
                    ) : (
                      <CircleAlert size={17} className={`mt-0.5 shrink-0 ${item.required ? "text-red-500" : "text-amber-500"}`} />
                    )}
                    <span className={item.ok ? "text-secondary" : ""}>
                      {item.label}
                      {!item.ok && !item.required && <span className="text-muted"> — recommended</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setChecklistOpen(false)} className="h-10 rounded-control px-4 text-sm font-medium hover:bg-surface">
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={() => save("publish")}
                  disabled={busy || !post.title.trim()}
                  className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />} Publish now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts */}
      <AnimatePresence>
        {shortcutsOpen && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShortcutsOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"
              role="dialog"
              aria-label="Keyboard shortcuts"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-title">Writing shortcuts</h2>
                <button type="button" onClick={() => setShortcutsOpen(false)} className="rounded-lg p-1.5 hover:bg-surface" aria-label="Close"><X size={16} /></button>
              </div>
              <ul className="space-y-2">
                {SHORTCUTS.map(([keys, what]) => (
                  <li key={keys} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-secondary">{what}</span>
                    <kbd className="shrink-0 rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-[11px]">{keys}</kbd>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BlogEditor;
