import { NextRequest, NextResponse } from 'next/server';

// Visual styles for image generation diversity
const VISUAL_STYLES = [
  'minimalist flat design',
  'modern geometric',
  'gradient mesh',
  'isometric 3D',
  'abstract shapes',
  'low poly',
  'line art illustration',
  'vibrant colorful',
  'monochromatic',
  'watercolor style',
  'paper cut art',
  'neon glow',
  'retro futuristic',
  'hand-drawn sketch',
  'corporate professional',
  'tech blueprint',
  'digital art',
  'pastel colors',
];

// Negative prompts to avoid common issues
const NEGATIVE_PROMPTS = [
  'blurry, low quality, distorted',
  'cluttered, messy, chaotic',
  'dark, gloomy, unclear',
  'oversaturated, garish',
  'photorealistic people, faces',
];

const getRandomStyle = (): string => {
  return VISUAL_STYLES[Math.floor(Math.random() * VISUAL_STYLES.length)];
};

const getRandomNegativePrompt = (): string => {
  return NEGATIVE_PROMPTS[Math.floor(Math.random() * NEGATIVE_PROMPTS.length)];
};

export async function POST(request: NextRequest) {
  try {
    const { context, type = 'general' } = await request.json();

    if (!context || typeof context !== 'string' || !context.trim()) {
      return NextResponse.json({ error: 'Context is required' }, { status: 400 });
    }

    const llmApiEndpoint = process.env.LLM_API_ENDPOINT;
    const llmApiKey = process.env.LLM_API_KEY;

    if (!llmApiEndpoint || !llmApiKey) {
      return NextResponse.json({
        error: 'LLM API not configured. Please set up LLM_API_ENDPOINT and LLM_API_KEY.'
      }, { status: 503 });
    }

    // Select random visual style for diversity
    const visualStyle = getRandomStyle();
    const negativePrompt = getRandomNegativePrompt();

    // Use LLM to generate smart image prompt
    const systemPrompt = `You are an expert at creating visual image generation prompts. Given a context/topic, generate a detailed, creative prompt for image generation that would create an engaging, professional-quality image.

Guidelines:
- Keep prompts concise but descriptive (1-2 sentences)
- Focus on visual style, composition, and mood
- Use professional photography or illustration terminology
- Consider the context and suggest appropriate visual themes
- Avoid complex scenes, focus on clear, impactful visuals
- IMPORTANT: For cover images, ALWAYS include "no text, no words, no labels" in the prompt to ensure clean visual design
- For cover images, focus on abstract concepts, technology symbols, or thematic visual metaphors
- IMPORTANT: You must incorporate the specified visual style: "${visualStyle}"

Response format: Just return the prompt text, nothing else.`;

    const userPrompt = `Generate an image prompt for: "${context}"
Type: ${type === 'cover' ? 'cover/hero image' : type === 'section' ? 'section/supporting image' : 'general image'}
Visual style to use: ${visualStyle}`;

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
        temperature: 0.8, // Increased for more variety
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return NextResponse.json({ error: 'Failed to generate prompt' }, { status: 500 });
    }

    const data = await response.json();
    const generatedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      return NextResponse.json({ error: 'No prompt generated' }, { status: 500 });
    }

    return NextResponse.json({
      prompt: generatedPrompt,
      negativePrompt,
      visualStyle,
      service: 'llm'
    });

  } catch (error) {
    console.error('Prompt generation error:', error);
    return NextResponse.json({ error: 'Failed to generate prompt' }, { status: 500 });
  }
}