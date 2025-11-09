'use client'

import ReactMarkdown from 'react-markdown'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className="prose prose-lg dark:prose-invert max-w-none
        prose-headings:font-bold
        prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
        prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8
        prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6
        prose-p:mb-4 prose-p:leading-relaxed
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:font-bold prose-strong:text-gray-900 dark:prose-strong:text-white
        prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
        prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded-lg
        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
        prose-li:mb-2
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
        prose-img:rounded-lg prose-img:shadow-md
      "
    >
      {content}
    </ReactMarkdown>
  )
}
