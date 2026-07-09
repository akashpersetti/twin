import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";

// dev.to exports leave a bare `align="center"` after the image URL, which
// breaks CommonMark image syntax (`![alt](url "title")` requires a quoted
// title). Strip it so the URL parses cleanly.
function sanitizeMarkdown(content: string): string {
  return content.replace(/(!\[[^\]]*]\([^)\s]+)\s+align="[^"]*"\)/g, "$1)");
}

export default function PostBody({ content }: { content: string }) {
  return (
    <div className="prose">
      <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
        {sanitizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
