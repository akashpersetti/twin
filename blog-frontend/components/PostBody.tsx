import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

export default function PostBody({ content }: { content: string }) {
  return (
    <div className="prose">
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{content}</ReactMarkdown>
    </div>
  );
}
