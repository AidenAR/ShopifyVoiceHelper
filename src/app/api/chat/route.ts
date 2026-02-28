import { NextRequest, NextResponse } from 'next/server';
import { parseIntent, generateResponse } from '@/lib/gemini';
import { searchProducts } from '@/lib/shopify';
import { createProduct } from '@/lib/shopify-admin';

export async function POST(req: NextRequest) {
  try {
    const { transcript, history } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
    }

    let intent: any = { action: 'search', searchQuery: transcript };
    try {
      intent = await parseIntent(transcript, history || []);
    } catch (err) {
      console.error('Gemini intent parsing failed, defaulting to search:', err);
    }

    // CREATE product flow
    if (intent.action === 'create') {
      try {
        const created = await createProduct({
          title: intent.title || 'New Product',
          description: intent.description || '',
          price: intent.price || '9.99',
          productType: intent.productType,
        });

        const context = `Product created successfully: "${created.title}" at $${created.price}`;

        let message = `Done! I created "${created.title}" for $${created.price}.`;
        try {
          message = await generateResponse(transcript, context, history || []);
        } catch (err) {
          console.error('Gemini response generation failed:', err);
        }

        return NextResponse.json({
          message,
          products: [],
          created: {
            id: created.id,
            title: created.title,
            price: created.price,
            handle: created.handle,
          },
        });
      } catch (err: any) {
        console.error('Product creation failed:', err);
        const message = err.message?.includes('not configured')
          ? "I can't create products yet — the admin API token needs to be set up."
          : "Sorry, I couldn't create that product. Try again?";
        return NextResponse.json({ message, products: [], created: null });
      }
    }

    // SEARCH product flow
    const searchQuery = intent.searchQuery || transcript;
    const products = await searchProducts(searchQuery);

    const context = products.length > 0
      ? products.map(p => `${p.title} — $${p.price}`).join('\n')
      : 'No products found.';

    let message = products.length > 0
      ? `I found some options for "${searchQuery}". Take a look!`
      : `I couldn't find anything for "${searchQuery}". Try different words?`;

    try {
      message = await generateResponse(transcript, context, history || []);
    } catch (err) {
      console.error('Gemini response generation failed:', err);
    }

    return NextResponse.json({ message, products, created: null });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
