import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const dashscopeApiKey = process.env.DASHSCOPE_API_KEY;
    
    if (!dashscopeApiKey) {
      return NextResponse.json({ 
        error: 'DASHSCOPE_API_KEY not configured. Please set up your API key to use image generation.' 
      }, { status: 503 });
    }

    // Use DashScope API for image generation
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dashscopeApiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-image',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  text: prompt.trim()
                }
              ]
            }
          ]
        },
        parameters: {
          negative_prompt: '',
          prompt_extend: true,
          watermark: false, // Set to false to avoid watermarks
          size: '1328*1328' // Square format from allowed sizes
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DashScope API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    const data = await response.json();
    
    // Check for API errors in response
    if (data.code && data.code !== '200') {
      console.error('DashScope API error response:', data);
      return NextResponse.json({ 
        error: data.message || 'Image generation failed' 
      }, { status: 500 });
    }

    // Extract image URL from response
    const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image;
    
    if (!imageUrl) {
      console.error('No image URL in response:', data);
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    // Download image to local uploads directory
    const downloadResponse = await fetch(imageUrl);
    if (!downloadResponse.ok) {
      console.error('Failed to download generated image');
      return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
    }

    const imageBuffer = Buffer.from(await downloadResponse.arrayBuffer());
    
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `generated-${timestamp}.png`;
    const filepath = join(uploadDir, filename);

    // Write the file
    await writeFile(filepath, imageBuffer);

    // Return local URL
    const localUrl = `/uploads/${filename}`;

    return NextResponse.json({ 
      url: localUrl,
      prompt: prompt.trim(),
      service: 'dashscope'
    });
    
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}