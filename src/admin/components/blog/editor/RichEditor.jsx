import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link2,
  Heading2,
  Heading3,
  Quote,
  Plus,
  Check,
  X,
  Trash2,
  Unlink,
  Rows3,
  Columns3,
} from "lucide-react";

import { buildExtensions, filterCommands, countWords } from "./editorKit";
import { uploadImage } from "../../../services/upload.service";
import "./blogEditor.css";

/* ========================================
   RICH EDITOR — the visual writing surface.

   Type like a document; markdown shortcuts
   (#, -, 1., >, ```, ---) still work. "/"
   opens the block menu, selecting text shows
   formatting, images can be pasted, dropped
   or chosen. Output is markdown (onChange),
   styled with the same CSS as the public
   post so it looks the way readers see it.
========================================= */

const MAX_IMAGE_MB = 8;

const MenuBtn = ({ onClick, active, label, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    title={label}
    className={`h-8 min-w-8 px-1.5 inline-flex items-center justify-center rounded-lg text-[13px] transition ${
      active ? "bg-primary text-background" : "text-secondary hover:bg-surface hover:text-primary"
    }`}
  >
    {children}
  </button>
);

const Sep = () => <span className="mx-0.5 h-5 w-px bg-border" />;

const RichEditor = forwardRef(function RichEditor({ initialMarkdown, onChange, onStats, onUploadingChange }, ref) {
  const [slash, setSlash] = useState(null); // { query, from, to, top, left, index }
  const [linkEditing, setLinkEditing] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [altValue, setAltValue] = useState("");
  const fileRef = useRef(null);
  const slashRef = useRef(null);
  const wrapRef = useRef(null);
  const uploads = useRef(0);
  const changeTimer = useRef(null);
  const insertAtRef = useRef(null);
  // True once the user actually edits — re-serializing an untouched post
  // would only reformat its markdown and make it look changed.
  const changedRef = useRef(false);

  // Key handling runs outside React; keep it reading the latest menu state.
  useLayoutEffect(() => {
    slashRef.current = slash;
  }, [slash]);

  const setUploading = (delta) => {
    uploads.current += delta;
    onUploadingChange?.(uploads.current > 0);
  };

  /* ----- images ----- */

  const uploadFiles = useCallback(
    async (editor, files, pos) => {
      const images = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
      if (!images.length) return false;

      for (const file of images) {
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
          toast.error(`${file.name} is larger than ${MAX_IMAGE_MB} MB`);
          continue;
        }

        // Show it immediately from a local URL, swap in the real one after upload.
        const tempSrc = URL.createObjectURL(file);
        const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 120);
        const node = { type: "image", attrs: { src: tempSrc, alt } };

        if (typeof pos === "number") editor.chain().insertContentAt(pos, node).run();
        else editor.chain().focus().insertContent(node).run();

        setUploading(1);
        try {
          const image = await uploadImage(file, "blog");
          const { tr } = editor.state;
          editor.state.doc.descendants((n, p) => {
            if (n.type.name === "image" && n.attrs.src === tempSrc) tr.setNodeMarkup(p, undefined, { ...n.attrs, src: image.url });
          });
          editor.view.dispatch(tr);
        } catch {
          const { tr } = editor.state;
          const found = [];
          editor.state.doc.descendants((n, p) => {
            if (n.type.name === "image" && n.attrs.src === tempSrc) found.push(p);
          });
          found.reverse().forEach((p) => tr.delete(p, p + 1));
          editor.view.dispatch(tr);
          toast.error(`Couldn't upload ${file.name}`);
        } finally {
          URL.revokeObjectURL(tempSrc);
          setUploading(-1);
        }
      }
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* ----- slash menu ----- */

  const updateSlash = (editor) => {
    const { selection } = editor.state;
    const { $from, empty } = selection;

    if (!empty || $from.parent.type.name === "codeBlock") return setSlash(null);

    const before = $from.parent.textBetween(0, $from.parentOffset, undefined, "￼");
    const match = before.match(/(?:^|\s)\/([\p{L}\p{N}-]{0,24})$/u);
    if (!match) return setSlash(null);

    const from = $from.pos - match[1].length - 1;
    const coords = editor.view.coordsAtPos(from);
    const box = wrapRef.current?.getBoundingClientRect();

    setSlash((prev) => ({
      query: match[1],
      from,
      to: $from.pos,
      top: coords.bottom - (box?.top || 0) + 6,
      left: Math.max(0, coords.left - (box?.left || 0)),
      index: prev && prev.query === match[1] ? prev.index : 0,
    }));
  };

  const runSlash = (editor, command) => {
    const current = slashRef.current;
    if (!current) return;

    const chain = editor.chain().focus().deleteRange({ from: current.from, to: current.to });
    setSlash(null);

    if (command.action === "image") {
      chain.run();
      insertAtRef.current = null;
      fileRef.current?.click();
      return;
    }

    command.run(chain).run();
  };

  /* ----- editor ----- */

  const editor = useEditor({
    extensions: buildExtensions(),
    content: initialMarkdown || "",
    contentType: "markdown",
    immediatelyRender: true,
    editorProps: {
      attributes: {
        class: "prose-blog blog-editor-prose focus:outline-none",
        spellcheck: "true",
      },
      handleKeyDown: (view, event) => {
        const current = slashRef.current;
        if (!current) return false;

        const items = filterCommands(current.query);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const step = event.key === "ArrowDown" ? 1 : -1;
          setSlash({ ...current, index: (current.index + step + items.length) % Math.max(items.length, 1) });
          return true;
        }
        if ((event.key === "Enter" || event.key === "Tab") && items.length) {
          event.preventDefault();
          runSlash(editorRef.current, items[current.index] || items[0]);
          return true;
        }
        if (event.key === "Escape") {
          setSlash(null);
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const files = event.clipboardData?.files;
        if (files?.length && Array.from(files).some((f) => f.type.startsWith("image/"))) {
          event.preventDefault();
          uploadFiles(editorRef.current, files);
          return true;
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        const files = event.dataTransfer?.files;
        if (moved || !files?.length) return false;
        if (!Array.from(files).some((f) => f.type.startsWith("image/"))) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        uploadFiles(editorRef.current, files, pos);
        return true;
      },
    },
    onUpdate: ({ editor: e }) => {
      changedRef.current = true;
      updateSlash(e);
      // Serializing a long post on every keystroke is wasteful — batch it.
      clearTimeout(changeTimer.current);
      changeTimer.current = setTimeout(() => onChange?.(e.getMarkdown()), 250);
    },
    onSelectionUpdate: ({ editor: e }) => updateSlash(e),
    onBlur: () => setTimeout(() => setSlash(null), 150),
  });

  const editorRef = useRef(null);
  useLayoutEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useImperativeHandle(ref, () => ({
    getMarkdown: () => editor?.getMarkdown() ?? "",
    hasChanges: () => changedRef.current,
    focus: () => editor?.commands.focus("start"),
    scrollToHeading: (index) => {
      let seen = -1;
      editor?.state.doc.descendants((node, pos) => {
        if (node.type.name !== "heading") return true;
        seen += 1;
        if (seen === index) {
          editor.chain().focus().setTextSelection(pos + 1).run();
          editor.view.domAtPos(pos + 1)?.node?.parentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
          return false;
        }
        return true;
      });
    },
  }));

  // Flush the last edit when unmounting (e.g. switching to Markdown mode).
  useEffect(
    () => () => {
      clearTimeout(changeTimer.current);
      if (changedRef.current && editorRef.current && !editorRef.current.isDestroyed) onChange?.(editorRef.current.getMarkdown());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const headings = [];
      e.state.doc.descendants((node) => {
        if (node.type.name === "heading") headings.push({ level: node.attrs.level, text: node.textContent });
        return node.type.name !== "heading";
      });
      return {
        words: countWords(e.getText({ blockSeparator: " " })),
        chars: e.storage.characterCount.characters(),
        headings,
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        strike: e.isActive("strike"),
        code: e.isActive("code"),
        link: e.isActive("link"),
        h2: e.isActive("heading", { level: 2 }),
        h3: e.isActive("heading", { level: 3 }),
        quote: e.isActive("blockquote"),
        image: e.isActive("image"),
        table: e.isActive("table"),
        href: e.getAttributes("link").href || "",
        alt: e.getAttributes("image").alt || "",
      };
    },
  });

  const statsKey = `${state?.words}|${state?.chars}|${JSON.stringify(state?.headings)}`;
  useEffect(() => {
    if (state) onStats?.({ words: state.words, chars: state.chars, headings: state.headings });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsKey]);

  if (!editor) return null;

  const items = slash ? filterCommands(slash.query) : [];

  const openLink = () => {
    setLinkValue(state.href);
    setLinkEditing(true);
  };

  const applyLink = () => {
    const href = linkValue.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!href) chain.unsetLink().run();
    else chain.setLink({ href: /^(https?:|mailto:|\/|#)/i.test(href) ? href : `https://${href}` }).run();
    setLinkEditing(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <EditorContent editor={editor} />

      {/* Formatting toolbar on selection (text) / alt text (image) / table tools */}
      <BubbleMenu
        editor={editor}
        options={{ placement: "top", offset: 10 }}
        shouldShow={({ editor: e, state: s }) => {
          if (e.isActive("image")) return true;
          if (e.isActive("codeBlock")) return false;
          if (!s.selection.empty) return true;
          return e.isActive("table");
        }}
      >
        <div className="blog-bubble flex items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-xl">
          {state.image ? (
            <>
              <input
                value={altValue}
                onChange={(e) => setAltValue(e.target.value)}
                onFocus={() => setAltValue(state.alt)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    editor.chain().focus().updateAttributes("image", { alt: altValue.trim() }).run();
                  }
                }}
                onBlur={() => editor.chain().updateAttributes("image", { alt: altValue.trim() }).run()}
                placeholder={state.alt || "Describe the image (alt text)"}
                className="h-8 w-56 rounded-lg bg-surface px-2 text-[13px] outline-none"
                aria-label="Image alt text"
              />
              <MenuBtn label="Delete image" onClick={() => editor.chain().focus().deleteSelection().run()}>
                <Trash2 size={15} />
              </MenuBtn>
            </>
          ) : linkEditing ? (
            <>
              <input
                autoFocus
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  }
                  if (e.key === "Escape") setLinkEditing(false);
                }}
                placeholder="Paste or type a link…"
                className="h-8 w-60 rounded-lg bg-surface px-2 text-[13px] outline-none"
                aria-label="Link URL"
              />
              <MenuBtn label="Apply link" onClick={applyLink}>
                <Check size={15} />
              </MenuBtn>
              {state.link && (
                <MenuBtn label="Remove link" onClick={() => { editor.chain().focus().extendMarkRange("link").unsetLink().run(); setLinkEditing(false); }}>
                  <Unlink size={15} />
                </MenuBtn>
              )}
              <MenuBtn label="Cancel" onClick={() => setLinkEditing(false)}>
                <X size={15} />
              </MenuBtn>
            </>
          ) : editor.state.selection.empty && state.table ? (
            <>
              <MenuBtn label="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
                <Rows3 size={15} />
              </MenuBtn>
              <MenuBtn label="Add column" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                <Columns3 size={15} />
              </MenuBtn>
              <MenuBtn label="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
                <span className="text-xs">−row</span>
              </MenuBtn>
              <MenuBtn label="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
                <span className="text-xs">−col</span>
              </MenuBtn>
              <MenuBtn label="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
                <Trash2 size={15} />
              </MenuBtn>
            </>
          ) : (
            <>
              <MenuBtn label="Bold (Ctrl+B)" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
                <Bold size={15} />
              </MenuBtn>
              <MenuBtn label="Italic (Ctrl+I)" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic size={15} />
              </MenuBtn>
              <MenuBtn label="Strikethrough" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
                <Strikethrough size={15} />
              </MenuBtn>
              <MenuBtn label="Inline code (Ctrl+E)" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}>
                <Code size={15} />
              </MenuBtn>
              <MenuBtn label="Link" active={state.link} onClick={openLink}>
                <Link2 size={15} />
              </MenuBtn>
              <Sep />
              <MenuBtn label="Heading" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                <Heading2 size={15} />
              </MenuBtn>
              <MenuBtn label="Subheading" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                <Heading3 size={15} />
              </MenuBtn>
              <MenuBtn label="Quote" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                <Quote size={15} />
              </MenuBtn>
            </>
          )}
        </div>
      </BubbleMenu>

      {/* "+" on empty lines opens the block menu */}
      <FloatingMenu
        editor={editor}
        options={{ placement: "left", offset: 12 }}
        shouldShow={({ editor: e, state: s }) => {
          const { $from, empty } = s.selection;
          return (
            empty &&
            e.isEditable &&
            $from.parent.type.name === "paragraph" &&
            $from.parent.content.size === 0 &&
            $from.depth === 1
          );
        }}
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().insertContent("/").run()}
          className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted shadow-sm transition hover:text-primary hover:border-border-strong"
          aria-label="Add a block"
          title="Add a block"
        >
          <Plus size={15} />
        </button>
      </FloatingMenu>

      {/* Slash command menu */}
      <AnimatePresence>
        {slash && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            style={{ top: slash.top, left: slash.left }}
            className="absolute z-30 w-72 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-2xl"
            role="listbox"
            aria-label="Insert block"
            onMouseDown={(e) => e.preventDefault()}
          >
            {items.length ? (
              <>
                <p className="px-2 pt-1 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">Blocks</p>
                {items.map((cmd, i) => {
                  const Icon = cmd.icon;
                  const active = i === slash.index;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      ref={(el) => active && el?.scrollIntoView({ block: "nearest" })}
                      onMouseEnter={() => setSlash((s) => (s ? { ...s, index: i } : s))}
                      onClick={() => runSlash(editor, cmd)}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition ${active ? "bg-surface" : ""}`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{cmd.label}</span>
                        <span className="block truncate text-xs text-muted">{cmd.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </>
            ) : (
              <p className="px-3 py-2 text-sm text-muted">No blocks match “{slash.query}”</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          uploadFiles(editor, e.target.files, insertAtRef.current ?? undefined);
          e.target.value = "";
        }}
      />
    </div>
  );
});

export default RichEditor;
