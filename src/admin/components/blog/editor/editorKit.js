import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import { Placeholder, CharacterCount } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import {
  Pilcrow,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  FileCode2,
  Minus,
  ImagePlus,
  Table,
  Lightbulb,
  TriangleAlert,
} from "lucide-react";

/* ========================================
   BLOG EDITOR KIT

   Posts are stored as markdown and rendered
   publicly by MarkdownRenderer (react-markdown
   + GFM). The visual editor only uses blocks
   that round-trip through GFM, so whatever is
   written here renders the same on the site:
   no underline, no highlight, no raw HTML.
========================================= */

export const buildExtensions = ({ placeholder = true } = {}) => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4] },
    underline: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: { rel: "noopener noreferrer", target: null },
    },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit.configure({ table: { resizable: false } }),
  Image.configure({ inline: false, allowBase64: false }),
  CharacterCount,
  ...(placeholder
    ? [
        Placeholder.configure({
          includeChildren: false,
          placeholder: ({ node }) => {
            if (node.type.name === "heading") return `Heading ${node.attrs.level}`;
            if (node.type.name === "codeBlock") return "";
            return "Write something, or type “/” for blocks…";
          },
        }),
      ]
    : []),
  Markdown.configure({ indentation: { style: "space", size: 2 } }),
];

/* ---------- slash commands ---------- */

// `run(chain)` receives a focused chain with the "/query" already removed.
export const SLASH_COMMANDS = [
  { id: "text", label: "Text", hint: "Plain paragraph", icon: Pilcrow, keywords: "paragraph p", run: (c) => c.setParagraph() },
  { id: "h2", label: "Heading", hint: "Section title", icon: Heading2, keywords: "h2 title big", run: (c) => c.setHeading({ level: 2 }) },
  { id: "h3", label: "Subheading", hint: "Smaller section title", icon: Heading3, keywords: "h3 medium", run: (c) => c.setHeading({ level: 3 }) },
  { id: "h4", label: "Small heading", hint: "Minor title", icon: Heading4, keywords: "h4 small", run: (c) => c.setHeading({ level: 4 }) },
  { id: "bullet", label: "Bulleted list", hint: "Simple list", icon: List, keywords: "ul unordered -", run: (c) => c.toggleBulletList() },
  { id: "ordered", label: "Numbered list", hint: "Steps in order", icon: ListOrdered, keywords: "ol ordered 1.", run: (c) => c.toggleOrderedList() },
  { id: "todo", label: "Checklist", hint: "Items with checkboxes", icon: ListChecks, keywords: "task todo check", run: (c) => c.toggleTaskList() },
  { id: "quote", label: "Quote", hint: "Pull quote or citation", icon: Quote, keywords: "blockquote cite", run: (c) => c.toggleBlockquote() },
  {
    id: "note",
    label: "Tip callout",
    hint: "Highlighted tip for readers",
    icon: Lightbulb,
    keywords: "callout note info tip",
    run: (c) => c.insertContent({ type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "💡 " }, { type: "text", marks: [{ type: "bold" }], text: "Tip:" }, { type: "text", text: " " }] }] }),
  },
  {
    id: "warning",
    label: "Warning callout",
    hint: "Something to watch out for",
    icon: TriangleAlert,
    keywords: "callout caution warning danger",
    run: (c) => c.insertContent({ type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "⚠️ " }, { type: "text", marks: [{ type: "bold" }], text: "Heads up:" }, { type: "text", text: " " }] }] }),
  },
  { id: "code", label: "Code block", hint: "Tip: type ```js for a language", icon: FileCode2, keywords: "pre snippet ```", run: (c) => c.toggleCodeBlock() },
  { id: "image", label: "Image", hint: "Upload, paste or drop", icon: ImagePlus, keywords: "photo picture upload img", action: "image" },
  { id: "table", label: "Table", hint: "3 × 3 grid", icon: Table, keywords: "grid rows columns", run: (c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }) },
  { id: "divider", label: "Divider", hint: "Horizontal line", icon: Minus, keywords: "hr rule line ---", run: (c) => c.setHorizontalRule() },
];

export const filterCommands = (query) => {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter((cmd) => `${cmd.label} ${cmd.keywords}`.toLowerCase().includes(q));
};

/* ---------- fidelity check ---------- */

// Words/numbers in reading order, ignoring markdown syntax (list markers,
// numbering, emphasis, table pipes), so only real content is compared.
const contentTokens = (markdown) =>
  (markdown || "")
    .replace(/^\s*(\d+[.)]|[-*+])\s+(\[[ xX]\]\s+)?/gm, "")
    .match(/[\p{L}\p{N}]+/gu)
    ?.join(" ") || "";

// True when this markdown survives a trip through the visual editor with
// all of its content intact. Posts that use things the editor can't
// represent (raw HTML, footnotes…) open in Markdown mode instead, so
// nothing is silently lost.
export const survivesVisualEditor = (markdown) => {
  if (!markdown?.trim()) return true;

  const editor = new Editor({ extensions: buildExtensions({ placeholder: false }), content: markdown, contentType: "markdown" });

  try {
    return contentTokens(editor.getMarkdown()) === contentTokens(markdown);
  } catch {
    return false;
  } finally {
    editor.destroy();
  }
};

/* ---------- stats ---------- */

export const WORDS_PER_MINUTE = 200; // same as the server's reading time

export const countWords = (text) => (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;

export const readingMinutes = (words) => Math.max(1, Math.round(words / WORDS_PER_MINUTE));
