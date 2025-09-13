'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, UploadIcon, Cross2Icon } from '@radix-ui/react-icons';

type ImagePickerProps = {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  // Context for smart prompt generation
  context?: string;
};

export default function ImagePicker({ value, onChange, label = "Image", placeholder = "Enter image URL or upload/generate", context }: ImagePickerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (url: string) => {
    setCurrentUrl(url);
  };

  const generateSmartPrompt = async () => {
    if (!context) return '';
    
    setPromptLoading(true);
    
    try {
      // Determine image type based on label
      const imageType = label.toLowerCase().includes('cover') ? 'cover' : 
                       label.toLowerCase().includes('section') ? 'section' : 'general';
      
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          context: context.trim(),
          type: imageType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prompt');
      }

      const data = await response.json();
      return data.prompt;
    } finally {
      setPromptLoading(false);
    }
  };

  const handleSmartGenerate = async () => {
    try {
      const smartPrompt = await generateSmartPrompt();
      setGeneratePrompt(smartPrompt);
    } catch (error) {
      console.error('Prompt generation error:', error);
      alert(`Failed to generate prompt: ${(error as Error).message}`);
    }
  };

  const handleSave = () => {
    onChange(currentUrl);
    setIsDialogOpen(false);
  };

  const handleClear = () => {
    setCurrentUrl('');
    onChange('');
    setIsDialogOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      setCurrentUrl(url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatePrompt.trim()) {
      alert('Please enter a prompt for image generation');
      return;
    }

    setGenerateLoading(true);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: generatePrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Image generation failed');
      }

      const { url } = await response.json();
      setCurrentUrl(url);
      setGeneratePrompt('');
    } catch (error) {
      console.error('Generation error:', error);
      alert(`Failed to generate image: ${(error as Error).message}`);
    } finally {
      setGenerateLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="flex items-center gap-2">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => {
                setCurrentUrl(value || '');
                setIsDialogOpen(true);
              }}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select or Generate Image</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Current Image Preview */}
              {currentUrl && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <Card>
                    <CardContent className="p-4">
                      <div className="relative">
                        <img
                          src={currentUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* URL Input */}
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={currentUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="flex-1"
                  >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    {uploadLoading ? 'Uploading...' : 'Choose File'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Supports JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>

              {/* AI Generation */}
              <div className="space-y-2">
                <Label>Generate with AI ✨</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                      placeholder="Describe the image you want to generate, e.g., 'A modern tech office with clean minimalist design, bright lighting, and plants'"
                      rows={3}
                      className="flex-1"
                    />
                    {context && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSmartGenerate}
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
                    onClick={handleGenerateImage}
                    disabled={generateLoading || !generatePrompt.trim()}
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

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                >
                  <Cross2Icon className="w-4 h-4 mr-2" />
                  Clear
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview thumbnail */}
      {value && (
        <div className="mt-2">
          <img
            src={value}
            alt="Selected"
            className="w-20 h-20 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
}