const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

interface CreateProductInput {
  title: string;
  description: string;
  price: string;
  productType?: string;
}

export async function createProduct(input: CreateProductInput) {
  if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN) {
    throw new Error('Shopify Admin API not configured (missing SHOPIFY_ADMIN_TOKEN)');
  }

  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/products.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ADMIN_TOKEN,
      },
      body: JSON.stringify({
        product: {
          title: input.title,
          body_html: input.description,
          product_type: input.productType || 'General',
          status: 'active',
          variants: [
            {
              price: input.price,
              inventory_quantity: 100,
              inventory_management: null,
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Admin API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const product = data.product;

  return {
    id: product.id,
    title: product.title,
    description: product.body_html,
    price: product.variants[0]?.price || input.price,
    handle: product.handle,
    url: `https://${SHOPIFY_DOMAIN}/products/${product.handle}`,
  };
}
