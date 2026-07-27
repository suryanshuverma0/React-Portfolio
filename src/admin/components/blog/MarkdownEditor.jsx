import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Quote,
  Code,
  FileCode2,
  List,
  ListOrdered,
  Image as ImageIcon,
} from "lucide-react";

import MarkdownRenderer from "../../../components/blog/MarkdownRenderer";
import { uploadImage } from "../../services/upload.service";

function MarkdownEditor({ value, onChange, label = "Content" }) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingSelection = useRef(null);

  const [mobileTab, setMobileTab] = useState("write");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Restore cursor position after a toolbar action rewrites `value` — this
  // is a controlled textarea, so the new selection can only be applied
  // once the prop round-trips back from the parent.
  useEffect(() => {
    if (pendingSelection.current && textareaRef.current) {
      const { start, end } = pendingSelection.current;

      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      pendingSelection.current = null;
    }
  }, [value]);

  const applyFormat = (before, after = before, placeholder = "") => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || placeholder;

    const newValue =
      value.slice(0, start) + before + selected + after + value.slice(end);

    const selectionStart = start + before.length;
    const selectionEnd = selectionStart + selected.length;

    pendingSelection.current = { start: selectionStart, end: selectionEnd };

    onChange(newValue);
  };

  const applyLinePrefix = (prefix) => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;

    const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);

    const cursor = start + prefix.length;

    pendingSelection.current = { start: cursor, end: cursor };

    onChange(newValue);
  };

  const insertAtCursor = (text) => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue = value.slice(0, start) + text + value.slice(end);

    const cursor = start + text.length;

    pendingSelection.current = { start: cursor, end: cursor };

    onChange(newValue);
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploadingImage(true);

      const image = await uploadImage(file, "blog");

      insertAtCursor(`![${file.name}](${image.url})`);
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  // Data-driven by command name rather than storing ref-closing functions
  // directly in the array, so the array itself holds no ref references.
  const toolbarButtons = useMemo(
    () => [
      { icon: Bold, label: "Bold", command: "bold" },
      { icon: Italic, label: "Italic", command: "italic" },
      { icon: Heading1, label: "Heading 1", command: "h1" },
      { icon: Heading2, label: "Heading 2", command: "h2" },
      { icon: Heading3, label: "Heading 3", command: "h3" },
      { icon: Quote, label: "Quote", command: "quote" },
      { icon: Code, label: "Inline code", command: "inline-code" },
      { icon: FileCode2, label: "Code block", command: "code-block" },
      { icon: List, label: "Bullet list", command: "bullet-list" },
      { icon: ListOrdered, label: "Numbered list", command: "numbered-list" },
      { icon: Link2, label: "Link", command: "link" },
    ],
    [],
  );

  const runCommand = (command) => {
    switch (command) {
      case "bold":
        return applyFormat("**", "**", "bold text");
      case "italic":
        return applyFormat("*", "*", "italic text");
      case "h1":
        return applyLinePrefix("# ");
      case "h2":
        return applyLinePrefix("## ");
      case "h3":
        return applyLinePrefix("### ");
      case "quote":
        return applyLinePrefix("> ");
      case "inline-code":
        return applyFormat("`", "`", "code");
      case "code-block":
        return applyFormat("\n```\n", "\n```\n", "code");
      case "bullet-list":
        return applyLinePrefix("- ");
      case "numbered-list":
        return applyLinePrefix("1. ");
      case "link":
        return applyFormat("[", "](https://)", "link text");
      default:
        return undefined;
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-label">{label}</label>

      <div className="rounded-3xl border border-border bg-surface overflow-hidden">
        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border bg-card">
          {toolbarButtons.map(({ icon: Icon, label: btnLabel, command }) => (
            <button
              key={btnLabel}
              type="button"
              onClick={() => runCommand(command)}
              title={btnLabel}
              aria-label={btnLabel}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
            >
              <Icon size={15} />
            </button>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            title="Insert image"
            aria-label="Insert image"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition disabled:opacity-50"
          >
            {uploadingImage ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <ImageIcon size={15} />
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelected}
            hidden
          />

          {/* MOBILE WRITE/PREVIEW TABS */}
          <div className="ml-auto flex lg:hidden gap-1">
            <button
              type="button"
              onClick={() => setMobileTab("write")}
              className={`h-8 px-3 rounded-lg text-xs transition ${
                mobileTab === "write"
                  ? "bg-primary text-background"
                  : "text-secondary"
              }`}
            >
              Write
            </button>

            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`h-8 px-3 rounded-lg text-xs transition ${
                mobileTab === "preview"
                  ? "bg-primary text-background"
                  : "text-secondary"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* WRITE + LIVE PREVIEW */}
        <div className="grid lg:grid-cols-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your post in markdown..."
            className={`
              w-full min-h-[420px] p-5 bg-background outline-none resize-y
              font-mono text-[13.5px] leading-relaxed
              lg:border-r lg:border-border
              ${mobileTab === "preview" ? "hidden lg:block" : "block"}
            `}
          />

          <div
            className={`
              min-h-[420px] max-h-[640px] overflow-y-auto p-5 bg-background
              ${mobileTab === "write" ? "hidden lg:block" : "block"}
            `}
          >
            {value?.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-muted text-small">
                Preview will appear here...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarkdownEditor;
