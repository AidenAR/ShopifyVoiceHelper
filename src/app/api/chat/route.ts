import { NextRequest, NextResponse } from 'next/server';
import { parseIntent, generateResponse } from '@/lib/gemini';
import { searchProducts } from '@/lib/shopify';
import { createProduct, updateProductPrice, getStoreAnalytics, createDiscountCode, updateInventory, getInventorySummary, deleteProduct, fulfillOrder, getCustomers, bulkPriceUpdate, compareProducts, getRestockSuggestions, createCollection, getOrderStatus, refundOrder, optimizeSEO, generateSocialCaption, getPricingSuggestion, getRevenueForecast, generateAdCopy } from '@/lib/shopify-admin';
import { saveShoppingEvent } from '@/lib/backboard';

function emptyResponse(message: string) {
  return { message, products: [], created: null, priceUpdate: null, analytics: null, discount: null, addedToCart: null, inventoryUpdate: null, inventorySummary: null, deletedProduct: null, fulfillment: null, customers: null, bulkPrice: null, comparison: null, restock: null, collection: null, orderStatus: null, refund: null, seo: null, socialCaption: null, pricingSuggestion: null, revenueForecast: null, adCopy: null };
}

function rememberEvent(event: string) {
  saveShoppingEvent(event).catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, history, lastProducts } = await req.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
    }

    let intent: any = { action: 'search', searchQuery: transcript, lang: 'en' };
    try {
      intent = await parseIntent(transcript, history || [], lastProducts);
    } catch (err) {
      console.error('Gemini intent parsing failed:', err);
    }
    const lang = intent.lang || 'en';

    // --- ADD TO CART ---
    if (intent.action === 'add_to_cart') {
      const name = (intent.productName || '').toLowerCase();
      const match = (lastProducts || []).find((p: any) =>
        p.title.toLowerCase().includes(name) || name.includes(p.title.toLowerCase())
      );

      if (match) {
        const context = `Added "${match.title}" to cart.`;
        let message = `Done, I added ${match.title} to your cart!`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper added "${match.title}" to their cart`);
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
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper created a new product: "${created.title}" priced at $${created.price}`);
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
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper changed price of "${result.title}" from $${result.oldPrice} to $${result.newPrice}`);
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
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper checked store analytics: ${stats.totalOrders} orders, $${stats.totalRevenue} revenue, best seller: ${stats.bestSeller}`);
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
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper created discount code "${result.code}" for ${result.percentage}% off`);
        return NextResponse.json({
          ...emptyResponse(message),
          discount: { code: result.code, percentage: result.percentage, description: result.description },
        });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't create discount: ${err.message}`));
      }
    }

    // --- UPDATE INVENTORY ---
    if (intent.action === 'update_inventory') {
      try {
        const result = await updateInventory(intent.productName, parseInt(intent.quantity));
        const context = `Updated "${result.title}" inventory from ${result.oldQuantity} to ${result.newQuantity} units`;
        let message = `Done! ${result.title} now has ${result.newQuantity} units in stock.`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper updated inventory for "${result.title}" to ${result.newQuantity} units`);
        return NextResponse.json({ ...emptyResponse(message), inventoryUpdate: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't update inventory: ${err.message}`));
      }
    }

    // --- CHECK INVENTORY ---
    if (intent.action === 'check_inventory') {
      try {
        const summary = await getInventorySummary();
        const context = `Inventory: ${summary.totalStock} total units across ${summary.totalProducts} products. ${summary.lowStock.length} low stock, ${summary.outOfStock.length} out of stock.`;
        let message = `You have ${summary.totalStock} units across ${summary.totalProducts} products.`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        return NextResponse.json({ ...emptyResponse(message), inventorySummary: summary });
      } catch (err: any) {
        return NextResponse.json(emptyResponse("Couldn't check inventory right now. Try again?"));
      }
    }

    // --- DELETE PRODUCT ---
    if (intent.action === 'delete_product') {
      try {
        const result = await deleteProduct(intent.productName);
        const context = `Deleted product "${result.title}" from the store`;
        let message = `Done! "${result.title}" has been removed from your store.`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper deleted product "${result.title}" from the store`);
        return NextResponse.json({ ...emptyResponse(message), deletedProduct: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't delete product: ${err.message}`));
      }
    }

    // --- FULFILL ORDER ---
    if (intent.action === 'fulfill_order') {
      try {
        const result = await fulfillOrder(intent.orderRef);
        const context = `Fulfilled order #${result.orderNumber} for ${result.customerName} — ${result.itemCount} items, $${result.totalPrice}`;
        let message = `Order #${result.orderNumber} for ${result.customerName} is now fulfilled!`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper fulfilled order #${result.orderNumber} for ${result.customerName}`);
        return NextResponse.json({ ...emptyResponse(message), fulfillment: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't fulfill order: ${err.message}`));
      }
    }

    // --- CUSTOMER LOOKUP ---
    if (intent.action === 'customers') {
      try {
        const result = await getCustomers();
        const context = `Store has ${result.totalCustomers} customers. Recent: ${result.recentCustomers.map((c: { name: string; ordersCount: number; totalSpent: string }) => `${c.name} (${c.ordersCount} orders, $${c.totalSpent})`).join(', ')}`;
        let message = `You have ${result.totalCustomers} customers.`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        return NextResponse.json({ ...emptyResponse(message), customers: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse("Couldn't fetch customer data right now. Try again?"));
      }
    }

    // --- BULK PRICE ---
    if (intent.action === 'bulk_price') {
      try {
        const result = await bulkPriceUpdate(intent.operation, intent.value);
        const context = `Bulk price update: ${result.productsUpdated} products updated with operation "${intent.operation}" value ${intent.value}`;
        let message = `Done! Updated prices across ${result.productsUpdated} products.`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper did bulk price update: ${intent.operation} ${intent.value} on ${result.productsUpdated} products`);
        return NextResponse.json({ ...emptyResponse(message), bulkPrice: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't do bulk price update: ${err.message}`));
      }
    }

    // --- COMPARE PRODUCTS ---
    if (intent.action === 'compare') {
      try {
        const result = await compareProducts(intent.product1, intent.product2);
        const context = `Comparing "${result.product1.title}" ($${result.product1.price}, ${result.product1.stock} in stock) vs "${result.product2.title}" ($${result.product2.price}, ${result.product2.stock} in stock)`;
        let message = `Here's a side-by-side comparison of ${result.product1.title} and ${result.product2.title}.`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper compared "${result.product1.title}" vs "${result.product2.title}"`);
        return NextResponse.json({ ...emptyResponse(message), comparison: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't compare products: ${err.message}`));
      }
    }

    // --- DESCRIBE SEARCH (semantic matching) ---
    if (intent.action === 'describe_search') {
      const searchQuery = intent.description || transcript;
      const products = await searchProducts(searchQuery);
      const context = products.length > 0
        ? `Found products matching description "${searchQuery}": ${products.map(p => `${p.title} — $${p.price}`).join(', ')}`
        : 'No products matched that description.';
      let message = products.length > 0
        ? `I found some items matching your description!`
        : `Nothing matched that description. Try different words?`;
      try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
      if (products.length > 0) {
        rememberEvent(`Shopper searched by description: "${searchQuery}" and found: ${products.map(p => p.title).join(', ')}`);
      }
      return NextResponse.json({ ...emptyResponse(message), products });
    }

    // --- RESTOCK SUGGESTIONS ---
    if (intent.action === 'restock') {
      try {
        const result = await getRestockSuggestions();
        const context = `Restock suggestions: ${result.urgentCount} out of stock, ${result.lowCount} low stock, ${result.watchCount} to watch. Top items: ${result.suggestions.slice(0, 5).map((s: { title: string; stock: number }) => `${s.title} (${s.stock} left)`).join(', ')}`;
        let message = result.suggestions.length > 0
          ? `Found ${result.suggestions.length} products needing attention — ${result.urgentCount} urgent.`
          : 'All your products are well stocked!';
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper checked restock suggestions: ${result.urgentCount} urgent, ${result.lowCount} low`);
        return NextResponse.json({ ...emptyResponse(message), restock: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse("Couldn't get restock suggestions. Try again?"));
      }
    }

    // --- CREATE COLLECTION ---
    if (intent.action === 'create_collection') {
      try {
        const result = await createCollection(intent.title || 'New Collection', intent.productNames || []);
        const context = `Created collection "${result.title}" with ${result.productsAdded.length} products: ${result.productsAdded.join(', ')}`;
        let message = `Collection "${result.title}" is live with ${result.productsAdded.length} products!`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper created collection "${result.title}" with ${result.productsAdded.join(', ')}`);
        return NextResponse.json({ ...emptyResponse(message), collection: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't create collection: ${err.message}`));
      }
    }

    // --- ORDER STATUS ---
    if (intent.action === 'order_status') {
      try {
        const result = await getOrderStatus(intent.orderRef);
        const context = `Found ${result.totalOrders} orders. Recent: ${result.orders.slice(0, 3).map((o: { orderNumber: number; status: string; totalPrice: string }) => `#${o.orderNumber} (${o.status}, $${o.totalPrice})`).join(', ')}`;
        let message = `Here are your recent orders.`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper checked order status`);
        return NextResponse.json({ ...emptyResponse(message), orderStatus: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't fetch orders: ${err.message}`));
      }
    }

    // --- REFUND ---
    if (intent.action === 'refund') {
      try {
        const result = await refundOrder(intent.orderRef);
        const context = `Refunded order #${result.orderNumber} — $${result.refundAmount} for ${result.lineItems} items`;
        let message = `Done! Refunded $${result.refundAmount} for order #${result.orderNumber}.`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper refunded order #${result.orderNumber} for $${result.refundAmount}`);
        return NextResponse.json({ ...emptyResponse(message), refund: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't process refund: ${err.message}`));
      }
    }

    // --- SEO OPTIMIZE ---
    if (intent.action === 'seo_optimize') {
      try {
        const result = await optimizeSEO(intent.productName);
        const context = `Optimized SEO for "${result.title}". New title: "${result.newMetaTitle}", new description: "${result.newMetaDescription}"`;
        let message = `Done! I've optimized the SEO for ${result.title}.`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper optimized SEO for "${result.title}"`);
        return NextResponse.json({ ...emptyResponse(message), seo: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't optimize SEO: ${err.message}`));
      }
    }

    // --- SOCIAL CAPTION ---
    if (intent.action === 'social_caption') {
      try {
        const result = await generateSocialCaption(intent.productName, intent.platform || 'instagram');
        const context = `Generated ${result.platform} caption for "${result.productTitle}"`;
        let message = `Here's your ${result.platform} caption for ${result.productTitle}!`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper generated ${result.platform} caption for "${result.productTitle}"`);
        return NextResponse.json({ ...emptyResponse(message), socialCaption: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't generate caption: ${err.message}`));
      }
    }

    // --- PRICING SUGGESTION ---
    if (intent.action === 'pricing_suggestion') {
      try {
        const result = await getPricingSuggestion(intent.productName);
        const context = `Pricing suggestion for "${result.productTitle}": current $${result.currentPrice}, suggested $${result.suggestedPrice}. ${result.reasoning}`;
        let message = `I'd suggest pricing ${result.productTitle} at $${result.suggestedPrice}.`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper got pricing suggestion for "${result.productTitle}": $${result.suggestedPrice}`);
        return NextResponse.json({ ...emptyResponse(message), pricingSuggestion: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't generate pricing suggestion: ${err.message}`));
      }
    }

    // --- REVENUE FORECAST ---
    if (intent.action === 'revenue_forecast') {
      try {
        const result = await getRevenueForecast();
        const context = `Revenue forecast: this month $${result.currentMonthRevenue}, last month $${result.lastMonthRevenue}, predicted next month $${result.predictedNextMonth}. Trend: ${result.trend}. Avg order: $${result.avgOrderValue}`;
        let message = `Based on your data, next month's projected revenue is $${result.predictedNextMonth}.`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper checked revenue forecast: predicted $${result.predictedNextMonth} next month`);
        return NextResponse.json({ ...emptyResponse(message), revenueForecast: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't generate forecast: ${err.message}`));
      }
    }

    // --- AD COPY ---
    if (intent.action === 'generate_ad') {
      try {
        const result = await generateAdCopy(intent.productName, intent.platform || 'facebook');
        const context = `Generated ${result.platform} ad for "${result.productTitle}": headline "${result.headline}"`;
        let message = `Here's your ${result.platform} ad for ${result.productTitle}!`;
        try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
        rememberEvent(`Shopper generated ${result.platform} ad for "${result.productTitle}"`);
        return NextResponse.json({ ...emptyResponse(message), adCopy: result });
      } catch (err: any) {
        return NextResponse.json(emptyResponse(`Couldn't generate ad copy: ${err.message}`));
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
    try { message = await generateResponse(transcript, context, history || [], lang); } catch {}
    if (products.length > 0) {
      rememberEvent(`Shopper searched for "${searchQuery}" and found: ${products.map(p => p.title).join(', ')}`);
    }
    return NextResponse.json({ ...emptyResponse(message), products });

  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
