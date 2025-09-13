'use client'

import { useState } from 'react'
import { MagicWandIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'

type TextAssistantProps = {
  value?: string
  onChange: (text: string) => void
  context?: string
  type?: 'description' | 'title' | 'general'
  placeholder?: string
  triggerClassName?: string
}

export function TextAssistant({ 
  value, 
  onChange, 
  context,
  type = 'description',
  placeholder = "Enter text...",
  triggerClassName = ""
}: TextAssistantProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [currentText, setCurrentText] = useState(value || '')
  const [optimizedText, setOptimizedText] = useState('')
  const [hasOptimized, setHasOptimized] = useState(false)

  const handleOptimize = async () => {
    if (!currentText.trim()) {
      alert('Please enter some text to optimize')
      return
    }

    setOptimizing(true)
    setHasOptimized(false)

    try {
      const response = await fetch('/api/optimize-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: currentText.trim(),
          context: context?.trim(),
          type
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to optimize text')
      }

      const data = await response.json()
      setOptimizedText(data.optimizedText)
      setHasOptimized(true)
    } catch (error) {
      console.error('Optimization error:', error)
      alert(`Failed to optimize text: ${(error as Error).message}`)
    } finally {
      setOptimizing(false)
    }
  }

  const handleAcceptOptimized = () => {
    setCurrentText(optimizedText)
    setOptimizedText('')
    setHasOptimized(false)
  }

  const handleSave = () => {
    onChange(currentText)
    setIsDialogOpen(false)
  }

  const handleCancel = () => {
    setCurrentText(value || '')
    setOptimizedText('')
    setHasOptimized(false)
    setIsDialogOpen(false)
  }

  const openDialog = () => {
    setCurrentText(value || '')
    setOptimizedText('')
    setHasOptimized(false)
    setIsDialogOpen(true)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={openDialog}
          className={`${triggerClassName}`}
          title="Text Assistant - Improve and optimize your text"
        >
          <MagicWandIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Text Assistant ✨</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Original Text */}
          <div className="space-y-2">
            <Label>Your Text</Label>
            <Textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder={placeholder}
              rows={6}
              className="w-full"
            />
          </div>

          {/* Context Info */}
          {context && (
            <div className="space-y-2">
              <Label>Context</Label>
              <Card>
                <CardContent className="p-3">
                  <p className="text-sm text-gray-600">{context}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Optimize Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleOptimize}
              disabled={optimizing || !currentText.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <MagicWandIcon className="w-4 h-4 mr-2" />
              {optimizing ? 'Optimizing...' : 'Improve with AI'}
            </Button>
          </div>

          {/* Optimized Text */}
          {hasOptimized && optimizedText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>AI Suggestion</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptOptimized}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <CheckIcon className="w-4 h-4 mr-1" />
                  Use This Version
                </Button>
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="whitespace-pre-wrap text-sm">
                    {optimizedText}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tips */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 <strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>AI will improve clarity, grammar, and engagement while preserving your meaning</li>
              <li>Review the suggestion and use it as a starting point for further refinement</li>
              <li>You can continue editing the text after applying AI suggestions</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            <Cross2Icon className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          <Button
            type="button"
            onClick={handleSave}
            disabled={!currentText.trim()}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}