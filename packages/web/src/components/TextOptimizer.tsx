'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { MagicWandIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons';

type TextOptimizerProps = {
  value?: string;
  onChange: (text: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  context?: string;
  type?: 'description' | 'title' | 'general';
};

export default function TextOptimizer({ 
  value, 
  onChange, 
  label = "Text", 
  placeholder = "Enter text...", 
  rows = 4,
  context,
  type = 'description'
}: TextOptimizerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [currentText, setCurrentText] = useState(value || '');
  const [optimizedText, setOptimizedText] = useState('');
  const [hasOptimized, setHasOptimized] = useState(false);

  const handleOptimize = async () => {
    if (!currentText.trim()) {
      alert('Please enter some text to optimize');
      return;
    }

    setOptimizing(true);
    setHasOptimized(false);

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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to optimize text');
      }

      const data = await response.json();
      setOptimizedText(data.optimizedText);
      setHasOptimized(true);
    } catch (error) {
      console.error('Optimization error:', error);
      alert(`Failed to optimize text: ${(error as Error).message}`);
    } finally {
      setOptimizing(false);
    }
  };

  const handleAcceptOptimized = () => {
    setCurrentText(optimizedText);
    setOptimizedText('');
    setHasOptimized(false);
  };

  const handleSave = () => {
    onChange(currentText);
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setCurrentText(value || '');
    setOptimizedText('');
    setHasOptimized(false);
    setIsDialogOpen(false);
  };

  const openDialog = () => {
    setCurrentText(value || '');
    setOptimizedText('');
    setHasOptimized(false);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="flex items-start gap-2">
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="flex-1"
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={openDialog}
              className="mt-0 h-10"
              title="Optimize with AI"
            >
              <MagicWandIcon className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>AI Text Optimizer ✨</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Original Text */}
              <div className="space-y-2">
                <Label>Original Text</Label>
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
                  {optimizing ? 'Optimizing...' : 'Optimize with AI'}
                </Button>
              </div>

              {/* Optimized Text */}
              {hasOptimized && optimizedText && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Optimized Text</Label>
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
                  <li>The AI will improve clarity, grammar, and engagement while preserving your original meaning</li>
                  <li>Review the optimized text and use it as a starting point for further refinement</li>
                  <li>You can edit the text manually after using the AI suggestions</li>
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
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!currentText.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Character count */}
      {value && (
        <div className="text-xs text-gray-500">
          {value.length} characters
        </div>
      )}
    </div>
  );
}