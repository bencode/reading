import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const dashscopeApiKey = process.env.DASHSCOPE_API_KEY;
    
    if (!dashscopeApiKey) {
      console.warn('DASHSCOPE_API_KEY not configured, using placeholder service');
      
      // Fallback to placeholder service
      const placeholderUrls = [
        'https://picsum.photos/512/512?random=1',
        'https://picsum.photos/512/512?random=2',
        'https://picsum.photos/512/512?random=3',
        'https://picsum.photos/512/512?random=4',
        'https://picsum.photos/512/512?random=5'
      ];

      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const randomUrl = placeholderUrls[Math.floor(Math.random() * placeholderUrls.length)];
      
      return NextResponse.json({ 
        url: randomUrl,
        prompt: prompt.trim(),
        service: 'placeholder'
      });
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
          size: '1024*1024' // Good balance of quality and file size
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
    const imageUrl = data.output?.task_result?.images?.[0]?.url;
    
    if (!imageUrl) {
      console.error('No image URL in response:', data);
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    return NextResponse.json({ 
      url: imageUrl,
      prompt: prompt.trim(),
      service: 'dashscope'
    });
    
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}