import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, context, type = 'description' } = await request.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const llmApiEndpoint = process.env.LLM_API_ENDPOINT;
    const llmApiKey = process.env.LLM_API_KEY;

    if (!llmApiEndpoint || !llmApiKey) {
      return NextResponse.json({ 
        error: 'LLM API not configured. Please set up LLM_API_ENDPOINT and LLM_API_KEY.' 
      }, { status: 503 });
    }

    // Create system prompt based on text type
    let systemPrompt = '';
    
    switch (type) {
      case 'description':
        systemPrompt = `You are an expert content editor specialized in optimizing descriptions. Your task is to improve the given text while maintaining its core meaning and intent.

Guidelines:
- Keep the same tone and style but make it more engaging and clear
- Improve readability and flow
- Fix grammar, spelling, and punctuation errors
- Make the text more concise while preserving key information
- Enhance clarity and professional presentation
- Maintain the original language (if Chinese, respond in Chinese; if English, respond in English)
- Do not change the fundamental meaning or add new information

Response format: Return only the optimized text, nothing else.`;
        break;
      
      case 'title':
        systemPrompt = `You are an expert content editor specialized in optimizing titles. Your task is to improve the given title while maintaining its core meaning.

Guidelines:
- Make it more engaging and compelling
- Ensure clarity and readability
- Keep it concise (ideally under 60 characters)
- Improve word choice and flow
- Fix any grammar or style issues
- Maintain the original language (if Chinese, respond in Chinese; if English, respond in English)
- Preserve the original intent and meaning

Response format: Return only the optimized title, nothing else.`;
        break;
        
      default:
        systemPrompt = `You are an expert content editor. Improve the given text by making it clearer, more engaging, and better written while preserving its original meaning and intent.

Guidelines:
- Improve readability and flow
- Fix grammar, spelling, and punctuation
- Make it more concise and impactful
- Maintain the original tone and style
- Preserve the original language
- Do not add new information or change the core meaning

Response format: Return only the optimized text, nothing else.`;
    }

    const userPrompt = context 
      ? `Optimize this ${type} with context "${context}":\n\n${text}`
      : `Optimize this ${type}:\n\n${text}`;

    const response = await fetch(llmApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more focused optimization
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return NextResponse.json({ error: 'Failed to optimize text' }, { status: 500 });
    }

    const data = await response.json();
    const optimizedText = data.choices?.[0]?.message?.content?.trim();

    if (!optimizedText) {
      return NextResponse.json({ error: 'No optimized text generated' }, { status: 500 });
    }

    return NextResponse.json({ 
      optimizedText,
      service: 'llm'
    });

  } catch (error) {
    console.error('Text optimization error:', error);
    return NextResponse.json({ error: 'Failed to optimize text' }, { status: 500 });
  }
}