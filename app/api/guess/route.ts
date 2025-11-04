import { NextRequest } from 'next/server';

// Calls an OpenAI-compatible Chat Completions endpoint with an image (base64 data URL)
// Env vars:
// - OPENAI_BASE_URL (e.g. https://your-proxy.example.com)
// - OPENAI_API_KEY
// - OPENAI_MODEL (e.g. gpt-4o-mini)
export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(JSON.stringify({ error: 'imageBase64 is required' }), { status: 400 });
    }

    const baseUrl = process.env.OPENAI_BASE_URL;
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!baseUrl || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing OPENAI_BASE_URL or OPENAI_API_KEY' }),
        { status: 500 }
      );
    }

    const url = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

    const prompt =
      '你正在玩你画我猜。根据玩家提供的涂鸦图片给出一个最可能的中文猜测。' +
      '输出 JSON：{"guess":"<不超过8个字的中文词/短语>","confidence":<0到1的小数>}' +
      '若无法判断，guess="不确定"，confidence=0.0。只输出JSON。';

    // Compose OpenAI Chat Completions payload with multimodal content
    const body = {
      model,
      temperature: 0.2,
      max_tokens: 64,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${imageBase64}` },
            },
          ],
        },
      ],
    } as const;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(
        JSON.stringify({ error: 'OpenAI proxy error', details: errText }),
        { status: 502 }
      );
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? '';

    let result: { guess: string; confidence: number | null };
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      result = {
        guess: String(parsed?.guess ?? '').slice(0, 16) || '不确定',
        confidence:
          typeof parsed?.confidence === 'number' ? parsed.confidence : null,
      };
    } catch {
      const text = typeof content === 'string' ? content : '';
      result = { guess: text.slice(0, 16) || '不确定', confidence: null };
    }

    return Response.json(result);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
