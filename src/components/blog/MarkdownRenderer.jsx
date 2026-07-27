import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

/*
  Single source of markdown rendering, shared by the admin editor's live
  preview and the public post page — what you see while writing IS what
  readers see, since both go through this exact component.
*/
function MarkdownRenderer({ content }) {
  return (
    <div className="prose-blog">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
