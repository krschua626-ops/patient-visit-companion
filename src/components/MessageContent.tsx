import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MessageContentProps {
  text: string
}

export function MessageContent({ text }: MessageContentProps) {
  return (
    <div className="text-sm leading-relaxed text-stone-800 [&>*+*]:mt-2.5">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-stone-900">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="space-y-1.5 ml-1 my-0.5">{children}</ul>,
          ol: ({ children }) => (
            <ol className="space-y-1.5 ml-1 my-0.5 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="flex gap-2 leading-relaxed">
              <span className="text-stone-400 select-none mt-1.5 shrink-0">
                <span className="block h-1 w-1 rounded-full bg-stone-400" />
              </span>
              <span className="flex-1 min-w-0">{children}</span>
            </li>
          ),
          code: ({ children }) => (
            <code className="bg-stone-100 px-1 py-0.5 rounded text-[12px] font-mono text-stone-800">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary-600 underline underline-offset-2 hover:text-primary-700"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => <p className="font-semibold text-stone-900">{children}</p>,
          h2: ({ children }) => <p className="font-semibold text-stone-900">{children}</p>,
          h3: ({ children }) => <p className="font-semibold text-stone-900">{children}</p>,
          hr: () => <hr className="border-stone-200" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
