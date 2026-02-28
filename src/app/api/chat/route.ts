import { NextRequest, NextResponse } from 'next/server';
import { parseShoppingIntent, generateResponse } from '@/lib/gemini';
import { searchProducts } from '@/lib/shopify';

export async function POST(req: NextRequest) {
  try {
    const { transcript, history } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
    }

    let searchQuery = transcript;
    try {
      const intent = await parseShoppingIntent(transcript, history || []);
      searchQuery = intent.searchQuery || transcript;
    } catch (err) {
      console.error('Gemini intent parsing failed, using raw transcript:', err);
    }

    const products = await searchProducts(searchQuery);

    let message = `I found some options for "${searchQuery}". Take a look!`;
    try {
      message = await generateResponse(
        transcript,
        products.map(p => ({ title: p.title, price: p.price })),
        history || []
      );
    } catch (err) {
      console.error('Gemini response generation failed:', err);
    }

    return NextResponse.json({ message, products });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
