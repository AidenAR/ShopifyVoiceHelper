const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

function adminFetch(endpoint: string, options: RequestInit = {}) {
  if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN) {
    throw new Error('Shopify Admin API not configured');
  }
  return fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-01${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      ...options.headers,
    },
  });
}

// --- AI Image Generation ---

async function generateProductImage(title: string, description: string): Promise<Buffer | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `Professional e-commerce product photo of ${title}. ${description || ''}. Clean white background, studio lighting, high quality product photography.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
    if (!imagePart) return null;

    return Buffer.from(imagePart.inlineData.data, 'base64');
  } catch {
    return null;
  }
}

async function attachImageToProduct(productId: number, imageBuffer: Buffer): Promise<string | null> {
  try {
    const base64 = imageBuffer.toString('base64');
    const res = await adminFetch(`/products/${productId}/images.json`, {
      method: 'POST',
      body: JSON.stringify({
        image: { attachment: base64, filename: `product-${productId}.png` },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.image?.src || null;
  } catch {
    return null;
  }
}

// --- Create Product ---

interface CreateProductInput {
  title: string;
  description: string;
  price: string;
  productType?: string;
}

export async function createProduct(input: CreateProductInput) {
  const res = await adminFetch('/products.json', {
    method: 'POST',
    body: JSON.stringify({
      product: {
        title: input.title,
        body_html: input.description,
        product_type: input.productType || 'General',
        status: 'active',
        variants: [{
          price: input.price,
          inventory_quantity: 100,
          inventory_management: null,
        }],
      },
    }),
  });

  if (!res.ok) throw new Error(`Create product failed: ${await res.text()}`);
  const data = await res.json();
  const p = data.product;

  // Generate AI image and attach to the product
  let image: string | null = null;
  const imageBuffer = await generateProductImage(input.title, input.description);
  if (imageBuffer) {
    image = await attachImageToProduct(p.id, imageBuffer);
  }

  return {
    id: p.id,
    title: p.title,
    description: p.body_html,
    price: p.variants[0]?.price || input.price,
    handle: p.handle,
    image,
  };
}

// --- Update Product Price ---

export async function updateProductPrice(productName: string, newPrice: string) {
  const baseName = productName.toLowerCase().replace(/^(all|the|my)\s+/i, '').trim();
  const nameVariants = new Set([
    baseName,
    baseName.replace(/s$/, ''),
    baseName.replace(/es$/, ''),
    baseName.replace(/ies$/, 'y'),
  ]);

  const searchRes = await adminFetch(`/products.json?limit=50`);
  if (!searchRes.ok) throw new Error('Failed to search products');
  const searchData = await searchRes.json();

  const product = searchData.products?.find((p: any) => {
    const title = p.title.toLowerCase();
    return [...nameVariants].some(v => title.includes(v) || v.includes(title.replace('test ', '')));
  });

  if (!product) throw new Error(`Product "${productName}" not found`);

  const variants = product.variants || [];
  if (variants.length === 0) throw new Error('No variants found');

  const oldPrice = variants[0]?.price;

  await Promise.all(
    variants.map((v: any) =>
      adminFetch(`/variants/${v.id}.json`, {
        method: 'PUT',
        body: JSON.stringify({ variant: { id: v.id, price: newPrice } }),
      })
    )
  );

  return {
    productId: product.id,
    title: product.title,
    oldPrice,
    newPrice,
    variantsUpdated: variants.length,
  };
}

// --- Store Analytics ---

export async function getStoreAnalytics() {
  // Fetch recent orders
  const ordersRes = await adminFetch('/orders.json?status=any&limit=50');
  if (!ordersRes.ok) throw new Error('Failed to fetch orders');
  const ordersData = await ordersRes.json();
  const orders = ordersData.orders || [];

  // Fetch products for best seller calc
  const productsRes = await adminFetch('/products.json?limit=50');
  if (!productsRes.ok) throw new Error('Failed to fetch products');
  const productsData = await productsRes.json();
  const products = productsData.products || [];

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);

  // Count product appearances in orders for best seller
  const productCounts: Record<string, { title: string; count: number }> = {};
  for (const order of orders) {
    for (const item of order.line_items || []) {
      const key = item.product_id?.toString() || item.title;
      if (!productCounts[key]) {
        productCounts[key] = { title: item.title, count: 0 };
      }
      productCounts[key].count += item.quantity;
    }
  }

  const bestSeller = Object.values(productCounts).sort((a, b) => b.count - a.count)[0] || null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o: any) => o.created_at?.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);

  return {
    totalOrders,
    totalRevenue: totalRevenue.toFixed(2),
    todayOrders: todayOrders.length,
    todayRevenue: todayRevenue.toFixed(2),
    totalProducts: products.length,
    bestSeller: bestSeller ? `${bestSeller.title} (${bestSeller.count} sold)` : 'No sales yet',
    currency: orders[0]?.currency || 'CAD',
  };
}

// --- Create Discount ---

export async function createDiscountCode(code: string, percentage: string, description?: string) {
  // Create a price rule first
  const now = new Date().toISOString();
  const priceRuleRes = await adminFetch('/price_rules.json', {
    method: 'POST',
    body: JSON.stringify({
      price_rule: {
        title: description || `${percentage}% off - ${code}`,
        target_type: 'line_item',
        target_selection: 'all',
        allocation_method: 'across',
        value_type: 'percentage',
        value: `-${percentage}`,
        customer_selection: 'all',
        starts_at: now,
        usage_limit: 100,
      },
    }),
  });

  if (!priceRuleRes.ok) throw new Error(`Price rule creation failed: ${await priceRuleRes.text()}`);
  const priceRuleData = await priceRuleRes.json();
  const priceRuleId = priceRuleData.price_rule.id;

  // Create the discount code — retry with suffix if duplicate
  let finalCode = code.toUpperCase();
  let discountRes = await adminFetch(`/price_rules/${priceRuleId}/discount_codes.json`, {
    method: 'POST',
    body: JSON.stringify({ discount_code: { code: finalCode } }),
  });

  if (!discountRes.ok) {
    const errText = await discountRes.text();
    if (errText.includes('must be unique')) {
      finalCode = `${code.toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
      discountRes = await adminFetch(`/price_rules/${priceRuleId}/discount_codes.json`, {
        method: 'POST',
        body: JSON.stringify({ discount_code: { code: finalCode } }),
      });
      if (!discountRes.ok) throw new Error(`Discount code creation failed: ${await discountRes.text()}`);
    } else {
      throw new Error(`Discount code creation failed: ${errText}`);
    }
  }

  const discountData = await discountRes.json();

  return {
    code: discountData.discount_code.code,
    percentage,
    description: description || `${percentage}% off everything`,
    priceRuleId,
  };
}
