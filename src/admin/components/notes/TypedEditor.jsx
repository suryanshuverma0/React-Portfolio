import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  FileCode2,
  Minus,
  Link2,
  ImagePlus,
  Table,
  Undo2,
  Redo2,
  Rows3,
  Columns3,
  Trash2,
} from "lucide-react";

import { uploadImage } from "../../services/upload.service";

/* ========================================
   TYPED NOTE EDITOR (Tiptap)
   Markdown-style shortcuts work as you type
   (# heading, - list, [ ] task, ``` code,
   > quote). Changes are reported upward and
   autosaved by the parent.
========================================= */

const Btn = ({ onClick, active, disabled, label, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()} // keep the editor selection
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    aria-pressed={active}
    title={label}
    className={`h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg transition disabled:opacity-30 ${
      active ? "bg-primary text-background" : "hover:bg-surface"
    }`}
  >
    {children}
  </button>
);

const Divider = () => <span className="mx-1 h-6 w-px shrink-0 bg-border" />;

function Toolbar({ editor }) {
  const fileRef = useRef(null);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      highlight: e.isActive("highlight"),
      code: e.isActive("code"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      task: e.isActive("taskList"),
      quote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      table: e.isActive("table"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  const setLink = () => {
    const previous = editor.getAttributes("link").href || "";
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (!url.trim()) {
      chain().extendMarkRange("link").unsetLink().run();
      return;
    }
    chain().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const addImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const { url } = await uploadImage(file, "notes");
      chain().setImage({ src: url }).run();
    } catch {
      toast.error("Image upload failed");
    }
  };

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border bg-background/95 px-3 py-2 backdrop-blur">
      <Btn label="Undo" onClick={() => chain().undo().run()} disabled={!state.canUndo}><Undo2 size={17} /></Btn>
      <Btn label="Redo" onClick={() => chain().redo().run()} disabled={!state.canRedo}><Redo2 size={17} /></Btn>
      <Divider />
      <Btn label="Heading 1" active={state.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}><Heading1 size={17} /></Btn>
      <Btn label="Heading 2" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}><Heading2 size={17} /></Btn>
      <Btn label="Heading 3" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}><Heading3 size={17} /></Btn>
      <Divider />
      <Btn label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}><Bold size={17} /></Btn>
      <Btn label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}><Italic size={17} /></Btn>
      <Btn label="Underline" active={state.underline} onClick={() => chain().toggleUnderline().run()}><Underline size={17} /></Btn>
      <Btn label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}><Strikethrough size={17} /></Btn>
      <Btn label="Highlight" active={state.highlight} onClick={() => chain().toggleHighlight().run()}><Highlighter size={17} /></Btn>
      <Btn label="Inline code" active={state.code} onClick={() => chain().toggleCode().run()}><Code size={17} /></Btn>
      <Btn label="Link" active={state.link} onClick={setLink}><Link2 size={17} /></Btn>
      <Divider />
      <Btn label="Bullet list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}><List size={17} /></Btn>
      <Btn label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}><ListOrdered size={17} /></Btn>
      <Btn label="Checklist" active={state.task} onClick={() => chain().toggleTaskList().run()}><ListChecks size={17} /></Btn>
      <Btn label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}><Quote size={17} /></Btn>
      <Btn label="Code block" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}><FileCode2 size={17} /></Btn>
      <Btn label="Divider" onClick={() => chain().setHorizontalRule().run()}><Minus size={17} /></Btn>
      <Divider />
      <Btn label="Image" onClick={() => fileRef.current?.click()}><ImagePlus size={17} /></Btn>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={addImage} />
      <Btn label="Insert table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table size={17} /></Btn>
      {state.table && (
        <>
          <Btn label="Add row" onClick={() => chain().addRowAfter().run()}><Rows3 size={17} /></Btn>
          <Btn label="Add column" onClick={() => chain().addColumnAfter().run()}><Columns3 size={17} /></Btn>
          <Btn label="Delete table" onClick={() => chain().deleteTable().run()}><Trash2 size={17} /></Btn>
        </>
      )}
    </div>
  );
}

function TypedEditor({ initialDoc, onChange }) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: false } }),
      Image,
      Highlight,
      Placeholder.configure({ placeholder: "Start typing… use # for headings, - for lists, [ ] for checklists" }),
    ],
    content: initialDoc || { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: { class: "note-prose focus:outline-none" },
    },
    onUpdate: ({ editor: e }) => {
      onChangeRef.current?.({ doc: e.getJSON(), text: e.getText({ blockSeparator: "\n" }) });
    },
  });

  if (!editor) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Toolbar editor={editor} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

export default TypedEditor;
