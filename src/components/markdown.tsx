import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-tas max-w-none prose-headings:font-serif prose-headings:font-medium prose-h2:text-2xl prose-h3:text-xl prose-h3:mt-8 prose-p:leading-relaxed prose-li:my-1 prose-li:leading-relaxed prose-strong:font-semibold prose-table:text-sm prose-th:bg-secondary prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-blockquote:font-serif prose-blockquote:text-lg prose-blockquote:font-normal prose-blockquote:not-italic",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="not-prose my-6 overflow-x-auto rounded-lg border">
              <table className="w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:bg-secondary [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-tas-navy">
                {children}
              </table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
