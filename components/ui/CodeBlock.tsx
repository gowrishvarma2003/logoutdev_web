'use client';

import React, { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  className?: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  jsx: 'JSX',
  tsx: 'TSX',
  css: 'CSS',
  html: 'HTML',
  json: 'JSON',
  bash: 'Bash',
  shell: 'Shell',
  sql: 'SQL',
  xml: 'XML',
  yaml: 'YAML',
  markdown: 'Markdown',
};

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  showLineNumbers = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const languageLabel = LANGUAGE_LABELS[language] || language.toUpperCase();

  return (
    <div className={`relative rounded-lg overflow-hidden bg-zinc-900 ${className}`}>
      {/* Header with language badge and copy button */}
      <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 border-b border-zinc-700">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          {languageLabel}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium transition-colors duration-200"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code block */}
      <Highlight theme={themes.nightOwl} code={code} language={language as any}>
        {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${highlightClassName} overflow-x-auto p-4 text-sm font-mono leading-relaxed`}
            style={style}
          >
            {tokens.map((line, i) => (
              <div
                key={i}
                {...getLineProps({ line, key: i })}
                className={`${showLineNumbers ? 'flex' : ''}`}
              >
                {showLineNumbers && (
                  <span className="inline-block w-8 pr-4 text-right text-zinc-500 user-select-none select-none">
                    {i + 1}
                  </span>
                )}
                <span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
};

export default CodeBlock;
