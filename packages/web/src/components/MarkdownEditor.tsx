'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { EyeOpenIcon, Pencil2Icon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type MarkdownEditorProps = {
  value?: string
  onChange: (text: string) => void
  label?: string
  placeholder?: string
  rows?: number
  className?: string
  extra?: React.ReactNode
}

export function MarkdownEditor({ 
  value = '', 
  onChange, 
  label = "Content", 
  placeholder = "Enter your content here. Supports **bold**, *italic*, `code`, [links](url), and # headers",
  rows = 6,
  className = "",
  extra
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              type="button"
              variant={mode === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('edit')}
            >
              <Pencil2Icon className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              type="button"
              variant={mode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('preview')}
              disabled={!value || !value.trim()}
            >
              <EyeOpenIcon className="w-3 h-3 mr-1" />
              Preview
            </Button>
          </div>
          {extra && <div>{extra}</div>}
        </div>
      </div>

      {mode === 'edit' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="font-mono text-sm resize-none"
        />
      ) : (
        <div className="border rounded-lg px-4 py-2 min-h-[150px] bg-card">
          {value?.trim() ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-semibold mt-4 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold mt-3 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-2">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 list-disc list-inside">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 list-decimal list-inside">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                  pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">{children}</pre>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic">{children}</blockquote>,
                  a: ({ href, children }) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                }}
              >
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-gray-400 italic">Nothing to preview</div>
          )}
        </div>
      )}

      {/* Character count */}
      {value && (
        <div className="text-xs text-gray-400">
          {value.length} characters
        </div>
      )}
    </div>
  )
}