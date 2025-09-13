'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type AIGenerationProps = {
  prompt: string
  onPromptChange: (prompt: string) => void
  onGenerate: () => Promise<void>
  onSmartGenerate?: () => Promise<void>
  generateLoading: boolean
  promptLoading?: boolean
  context?: string
}

export function AIGeneration({ 
  prompt, 
  onPromptChange, 
  onGenerate,
  onSmartGenerate,
  generateLoading,
  promptLoading = false,
  context 
}: AIGenerationProps) {
  return (
    <div className="space-y-2">
      <Label>Generate with AI ✨</Label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe the image you want to generate, e.g., 'A modern tech office with clean minimalist design, bright lighting, and plants'"
            rows={3}
            className="flex-1"
          />
          {context && onSmartGenerate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSmartGenerate}
              disabled={promptLoading}
              className="h-fit mt-0 px-3 py-2"
              title="Generate smart prompt with AI"
            >
              {promptLoading ? '⏳' : '💡'}
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant="default"
          onClick={onGenerate}
          disabled={generateLoading || !prompt.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <span className="w-4 h-4 mr-2">🎨</span>
          {generateLoading ? 'Generating... (this may take a moment)' : 'Generate Image with AI'}
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        {context && '💡 Click the lightbulb for AI-powered smart suggestions • '}Powered by Qwen Image Generation • Free to use
      </p>
    </div>
  )
}