import { NextRequest } from 'next/server';
import { textToSpeechStream } from '@/lib/elevenlabs';

export async function POST(req: NextRequest) {
  try {
    const { text, lang } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response('Missing text', { status: 400 });
    }

    const elevenLabsRes = await textToSpeechStream(text, lang || 'en');

    return new Response(elevenLabsRes.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err: any) {
    console.error('TTS API error:', err);
    return new Response(err.message || 'TTS failed', { status: 500 });
  }
}
