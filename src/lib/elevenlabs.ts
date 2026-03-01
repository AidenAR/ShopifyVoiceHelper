const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pFZP5JQG7iQjIQuC4Bku';

const LANG_MAP: Record<string, string> = {
  en: 'en', fr: 'fr', es: 'es', de: 'de', it: 'it', pt: 'pt',
  pl: 'pl', hi: 'hi', ar: 'ar', zh: 'zh', ja: 'ja', ko: 'ko',
};

export async function textToSpeechStream(text: string, lang?: string): Promise<Response> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not configured');
  }

  const languageCode = LANG_MAP[lang || 'en'] || 'en';

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        language_code: languageCode,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`ElevenLabs error ${res.status}: ${errorText}`);
  }

  return res;
}
