import { NextRequest, NextResponse } from 'next/server';
import { parseIntent, generateResponse } from '@/lib/gemini';
import { searchProducts } from '@/lib/shopify';
import { createProduct, updateProductPrice, getStoreAnalytics, createDiscountCode } from '@/lib/shopify-admin';

function emptyResponse(message: string) {
  return { message, products: [], created: null, priceUpdate: null, analytics: null, discount: null, addedToCart: null };
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, history, lastProducts } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
    }

    let intent: any = { action: 'search', searchQuery: transcript };
    try {
      intent = await parseIntent(transcript, history || [], lastProducts);
    } catch (err) {
      console.error('Gemini intent parsing failed:', err);
    }

    // --- ADD TO CART ---
    if (intent.action === 'add_to_cart') {
      const name = (intent.productName || '').toLowerCase();
      const match = (lastProducts || []).find((p: any) =>
        p.title.toLowerCase().includes(name) || name.includes(p.title.toLowerCase())
      );

      if (match) {
        const context = `Added "${match.title}" to cart.`;
        let message = `Done, I added ${match.title} to your cart!`;
        try { message = await generateResponse(transcript, context, history || []); } catch {}
        return NextResponse.json({
          ...emptyResponse(message),
          addedToCart: { title: match.title, variantId: match.variantId },
        });
      } else {
        const message = `I couldn't find that product in what I showed you. Try searching for it first?`;
        return NextResponse.json(emptyResponse(message));
      }
    }

    // --- CREATE PRODUCT ---
    if (intent.action === 'create') {
      try {
        const created = await createProduct({
          title: intent.title || 'New Product',
          description: intent.description || '',
          price: intent.price || '9.99',
          productType: intent.productType,
        });
        const context = `Product created: "${created.title}" at $${created.price}`;
        let message = `Done! Created "${created.title}" for $${created.price}.`;
        try { message = await generateResponse(transcript, context, history || []); } catch {}
        return NextResponse.json({
          ...emptyResponse(message),
          created: { id: created.id, title: created.title, price: created.price, handle: created.handle, image: created.image },
        });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(err.message?.includes('not configured')
          ? "Admin API isn't configured yet — I can't create products."
          : "Sorry, couldn't create that product. Try again?"));
      }
    }

    // --- EDIT PRICE ---
    if (intent.action === 'edit_price') {
      try {
        const result = await updateProductPrice(intent.productName, intent.newPrice);
        const context = `Updated "${result.title}" price from $${result.oldPrice} to $${result.newPrice}`;
        let message = `Done! ${result.title} is now $${result.newPrice}, was $${result.oldPrice}.`;
        try { message = await generateResponse(transcript, context, history || []); } catch {}
        return NextResponse.json({
          ...emptyResponse(message),
          priceUpdate: { title: result.title, oldPrice: result.oldPrice, newPrice: result.newPrice },
        });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't update the price: ${err.message}`));
      }
    }

    // --- ANALYTICS ---
    if (intent.action === 'analytics') {
      try {
        const stats = await getStoreAnalytics();
        const context = `Store stats: ${stats.totalOrders} total orders, $${stats.totalRevenue} revenue, ${stats.todayOrders} orders today ($${stats.todayRevenue}), ${stats.totalProducts} products, best seller: ${stats.bestSeller}`;
        let message = `You have ${stats.totalOrders} orders totaling $${stats.totalRevenue}. Best seller is ${stats.bestSeller}.`;
        try { message = await generateResponse(transcript, context, history || []); } catch {}
        return NextResponse.json({
          ...emptyResponse(message),
          analytics: stats,
        });
      } catch (err: any) {
        return NextResponse.json(emptyResponse("Couldn't fetch analytics right now. Try again?"));
      }
    }

    // --- CREATE DISCOUNT ---
    if (intent.action === 'create_discount') {
      try {
        const result = await createDiscountCode(
          intent.code || 'SAVE20',
          intent.percentage || '20',
          intent.description
        );
        const context = `Discount code "${result.code}" created for ${result.percentage}% off`;
        let message = `Done! Discount code ${result.code} is live — ${result.percentage}% off.`;
        try { message = await generateResponse(transcript, context, history || []); } catch {}
        return NextResponse.json({
          ...emptyResponse(message),
          discount: { code: result.code, percentage: result.percentage, description: result.description },
        });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't create discount: ${err.message}`));
      }
    }

    // --- SEARCH (default) ---
    const searchQuery = intent.searchQuery || transcript;
    const products = await searchProducts(searchQuery);
    const context = products.length > 0
      ? products.map(p => `${p.title} — $${p.price}`).join('\n')
      : 'No products found.';
    let message = products.length > 0
      ? `Here's what I found for "${searchQuery}".`
      : `Couldn't find anything for "${searchQuery}". Try different words?`;
    try { message = await generateResponse(transcript, context, history || []); } catch {}
    return NextResponse.json({ ...emptyResponse(message), products });

  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
