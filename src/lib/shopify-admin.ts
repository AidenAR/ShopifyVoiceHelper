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

// --- Shared: fuzzy product finder ---

async function fetchAllProducts() {
  const res = await adminFetch('/products.json?limit=50');
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  return data.products || [];
}

function fuzzyFindProduct(products: any[], name: string) {
  const baseName = name.toLowerCase().replace(/^(all|the|my)\s+/i, '').trim();
  const nameVariants = new Set([
    baseName,
    baseName.replace(/s$/, ''),
    baseName.replace(/es$/, ''),
    baseName.replace(/ies$/, 'y'),
  ]);
  return products.find((p: any) => {
    const title = p.title.toLowerCase();
    return [...nameVariants].some(v => title.includes(v) || v.includes(title.replace('test ', '')));
  });
}

// --- Update Product Price ---

export async function updateProductPrice(productName: string, newPrice: string) {
  const products = await fetchAllProducts();
  const product = fuzzyFindProduct(products, productName);
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

// --- Update Inventory ---

export async function updateInventory(productName: string, quantity: number) {
  const products = await fetchAllProducts();
  const product = fuzzyFindProduct(products, productName);
  if (!product) throw new Error(`Product "${productName}" not found`);

  // Get the first location
  const locRes = await adminFetch('/locations.json');
  if (!locRes.ok) throw new Error('Failed to fetch locations');
  const locData = await locRes.json();
  const locationId = locData.locations?.[0]?.id;
  if (!locationId) throw new Error('No locations found');

  const variants = product.variants || [];
  const oldQuantity = variants.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0);

  await Promise.all(
    variants
      .filter((v: any) => v.inventory_item_id)
      .map((v: any) =>
        adminFetch('/inventory_levels/set.json', {
          method: 'POST',
          body: JSON.stringify({
            location_id: locationId,
            inventory_item_id: v.inventory_item_id,
            available: quantity,
          }),
        })
      )
  );

  return {
    title: product.title,
    oldQuantity,
    newQuantity: quantity * variants.length,
    variantsUpdated: variants.length,
  };
}

export async function getInventorySummary() {
  const products = await fetchAllProducts();
  const inventory = products.map((p: any) => {
    const totalStock = (p.variants || []).reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0);
    return { title: p.title, stock: totalStock, variants: (p.variants || []).length };
  });

  const totalStock = inventory.reduce((sum: number, p: any) => sum + p.stock, 0);
  const lowStock = inventory.filter((p: any) => p.stock > 0 && p.stock <= 10);
  const outOfStock = inventory.filter((p: any) => p.stock <= 0);

  return { products: inventory, totalStock, totalProducts: products.length, lowStock, outOfStock };
}

// --- Delete Product ---

export async function deleteProduct(productName: string) {
  const products = await fetchAllProducts();
  const product = fuzzyFindProduct(products, productName);
  if (!product) throw new Error(`Product "${productName}" not found`);

  const res = await adminFetch(`/products/${product.id}.json`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: ${await res.text()}`);

  return { id: product.id, title: product.title };
}

// --- Order Fulfillment ---

export async function fulfillOrder(orderRef?: string) {
  // Get orders
  const ordersRes = await adminFetch('/orders.json?status=any&limit=20&fulfillment_status=unfulfilled');
  if (!ordersRes.ok) throw new Error('Failed to fetch orders');
  const { orders } = await ordersRes.json();

  if (!orders || orders.length === 0) throw new Error('No unfulfilled orders found');

  // Find the right order — latest by default, or match by number
  let order;
  if (orderRef) {
    const num = orderRef.replace(/[^0-9]/g, '');
    order = orders.find((o: any) => String(o.order_number) === num || String(o.id) === num);
  }
  if (!order) order = orders[0];

  // Get fulfillment orders
  const foRes = await adminFetch(`/orders/${order.id}/fulfillment_orders.json`);
  if (!foRes.ok) throw new Error('Failed to get fulfillment orders');
  const foData = await foRes.json();
  const fulfillmentOrders = foData.fulfillment_orders?.filter((fo: any) => fo.status === 'open') || [];

  if (fulfillmentOrders.length === 0) throw new Error(`Order #${order.order_number} has no items to fulfill`);

  const fulfillRes = await adminFetch('/fulfillments.json', {
    method: 'POST',
    body: JSON.stringify({
      fulfillment: {
        line_items_by_fulfillment_order: fulfillmentOrders.map((fo: any) => ({
          fulfillment_order_id: fo.id,
        })),
      },
    }),
  });

  if (!fulfillRes.ok) throw new Error(`Fulfillment failed: ${await fulfillRes.text()}`);

  const itemCount = order.line_items?.length || 0;
  return {
    orderNumber: order.order_number,
    orderId: order.id,
    customerName: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 'Guest',
    itemCount,
    totalPrice: order.total_price,
  };
}

// --- Customer Lookup ---

export async function getCustomers() {
  const res = await adminFetch('/customers.json?limit=50');
  if (!res.ok) throw new Error('Failed to fetch customers');
  const { customers } = await res.json();

  const recent = (customers || []).slice(0, 5).map((c: any) => ({
    name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
    email: c.email || 'N/A',
    ordersCount: c.orders_count || 0,
    totalSpent: c.total_spent || '0.00',
  }));

  return {
    totalCustomers: customers?.length || 0,
    recentCustomers: recent,
  };
}

// --- Bulk Price Operations ---

export async function bulkPriceUpdate(operation: string, value: string) {
  const products = await fetchAllProducts();
  if (products.length === 0) throw new Error('No products found');

  const results: { title: string; oldPrice: string; newPrice: string }[] = [];

  for (const product of products) {
    for (const v of product.variants || []) {
      const oldPrice = parseFloat(v.price);
      let newPrice: number;

      if (operation === 'percentage_off') {
        newPrice = oldPrice * (1 - parseFloat(value) / 100);
      } else if (operation === 'percentage_increase') {
        newPrice = oldPrice * (1 + parseFloat(value) / 100);
      } else if (operation === 'flat_increase') {
        newPrice = oldPrice + parseFloat(value);
      } else if (operation === 'flat_decrease') {
        newPrice = oldPrice - parseFloat(value);
      } else if (operation === 'set_price') {
        newPrice = parseFloat(value);
      } else {
        continue;
      }

      newPrice = Math.max(0, Math.round(newPrice * 100) / 100);

      await adminFetch(`/variants/${v.id}.json`, {
        method: 'PUT',
        body: JSON.stringify({ variant: { id: v.id, price: String(newPrice) } }),
      });

      results.push({ title: product.title, oldPrice: v.price, newPrice: String(newPrice) });
    }
  }

  return { productsUpdated: products.length, changes: results };
}

// --- Product Comparison ---

export async function compareProducts(name1: string, name2: string) {
  const products = await fetchAllProducts();
  const p1 = fuzzyFindProduct(products, name1);
  const p2 = fuzzyFindProduct(products, name2);

  if (!p1) throw new Error(`Product "${name1}" not found`);
  if (!p2) throw new Error(`Product "${name2}" not found`);

  const format = (p: any) => ({
    title: p.title,
    price: p.variants?.[0]?.price || '0',
    description: p.body_html?.replace(/<[^>]*>/g, '') || '',
    type: p.product_type || 'General',
    stock: (p.variants || []).reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0),
    variants: (p.variants || []).length,
    image: p.images?.[0]?.src || null,
    createdAt: p.created_at?.split('T')[0] || '',
  });

  return { product1: format(p1), product2: format(p2) };
}

// --- Reorder Suggestions ---

export async function getRestockSuggestions() {
  const products = await fetchAllProducts();

  const suggestions = products
    .map((p: any) => {
      const stock = (p.variants || []).reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0);
      return { title: p.title, stock, type: p.product_type || 'General' };
    })
    .filter((p: any) => p.stock <= 20)
    .sort((a: any, b: any) => a.stock - b.stock);

  return {
    suggestions,
    urgentCount: suggestions.filter((s: any) => s.stock <= 0).length,
    lowCount: suggestions.filter((s: any) => s.stock > 0 && s.stock <= 10).length,
    watchCount: suggestions.filter((s: any) => s.stock > 10 && s.stock <= 20).length,
  };
}

// --- Create Collection ---

export async function createCollection(title: string, productNames: string[]) {
  // Create a custom collection
  const res = await adminFetch('/custom_collections.json', {
    method: 'POST',
    body: JSON.stringify({
      custom_collection: { title, published: true },
    }),
  });

  if (!res.ok) throw new Error(`Collection creation failed: ${await res.text()}`);
  const { custom_collection } = await res.json();

  // Add products to collection
  const products = await fetchAllProducts();
  const matched: string[] = [];

  for (const name of productNames) {
    const product = fuzzyFindProduct(products, name);
    if (product) {
      await adminFetch('/collects.json', {
        method: 'POST',
        body: JSON.stringify({
          collect: { product_id: product.id, collection_id: custom_collection.id },
        }),
      });
      matched.push(product.title);
    }
  }

  return {
    id: custom_collection.id,
    title: custom_collection.title,
    productsAdded: matched,
  };
}
