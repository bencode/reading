import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { context, type = 'general' } = await request.json();

    if (!context || typeof context !== 'string' || !context.trim()) {
      return NextResponse.json({ error: 'Context is required' }, { status: 400 });
    }

    const llmApiEndpoint = process.env.LLM_API_ENDPOINT;
    const llmApiKey = process.env.LLM_API_KEY;

    if (!llmApiEndpoint || !llmApiKey) {
      console.warn('LLM API not configured, using fallback prompts');
      
      // Fallback to template-based generation
      const fallbackPrompts = {
        cover: [
          `A professional cover image representing "${context}", modern design, clean composition, vibrant colors`,
          `An abstract conceptual illustration for "${context}", minimalist style, engaging visual elements`,
          `A hero banner for "${context}", high-quality photography style, professional lighting`
        ],
        section: [
          `A supporting image for "${context}", complementary visual style, clean and focused`,
          `An illustration representing "${context}", modern flat design, clear and simple`,
          `A visual element for "${context}", professional quality, engaging composition`
        ],
        general: [
          `A clean, modern image representing "${context}", professional style, high quality`,
          `An engaging visual for "${context}", contemporary design, appealing aesthetics`,
          `A conceptual image for "${context}", artistic and professional appearance`
        ]
      };

      const prompts = fallbackPrompts[type as keyof typeof fallbackPrompts] || fallbackPrompts.general;
      const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

      return NextResponse.json({ 
        prompt: selectedPrompt,
        service: 'fallback'
      });
    }

    // Use LLM to generate smart image prompt
    const systemPrompt = `You are an expert at creating visual image generation prompts. Given a context/topic, generate a detailed, creative prompt for image generation that would create an engaging, professional-quality image.

Guidelines:
- Keep prompts concise but descriptive (1-2 sentences)
- Focus on visual style, composition, and mood
- Use professional photography or illustration terminology
- Consider the context and suggest appropriate visual themes
- Avoid complex scenes, focus on clear, impactful visuals
- Include style keywords like "modern", "clean", "professional", "vibrant", etc.

Response format: Just return the prompt text, nothing else.`;

    const userPrompt = `Generate an image prompt for: "${context}"
Type: ${type === 'cover' ? 'cover/hero image' : type === 'section' ? 'section/supporting image' : 'general image'}`;

    const response = await fetch(llmApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus', // or whatever model you're using
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7, // Some creativity but not too random
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      console.error('LLM API error:', response.status, response.statusText);
      throw new Error('LLM API request failed');
    }

    const data = await response.json();
    const generatedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      throw new Error('No prompt generated');
    }

    return NextResponse.json({ 
      prompt: generatedPrompt,
      service: 'llm'
    });

  } catch (error) {
    console.error('Prompt generation error:', error);
    
    // Fallback in case of any error
    const simpleFallback = `A professional, modern image representing "${context}", clean design, high quality`;
    
    return NextResponse.json({ 
      prompt: simpleFallback,
      service: 'error_fallback'
    });
  }
}