import { Product } from '@/types';

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

const PRODUCTS_QUERY = `
  query searchProducts($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          description
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          onlineStoreUrl
        }
      }
    }
  }
`;

const MOCK_PRODUCTS: Record<string, Product[]> = {
  default: [
    {
      id: '1', title: 'Classic White Sneakers', description: 'Clean minimalist sneakers for everyday wear',
      handle: 'classic-white-sneakers', price: '89.99', currency: 'USD',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
      imageAlt: 'White sneakers', url: '#',
    },
    {
      id: '2', title: 'Running Performance Shoes', description: 'Lightweight and responsive running shoes',
      handle: 'running-shoes', price: '129.99', currency: 'USD',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
      imageAlt: 'Running shoes', url: '#',
    },
    {
      id: '3', title: 'Leather Chelsea Boots', description: 'Premium leather boots with elastic side panels',
      handle: 'chelsea-boots', price: '179.99', currency: 'USD',
      image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&h=400&fit=crop',
      imageAlt: 'Chelsea boots', url: '#',
    },
    {
      id: '4', title: 'Organic Cotton T-Shirt', description: 'Soft organic cotton tee in multiple colors',
      handle: 'organic-tshirt', price: '34.99', currency: 'USD',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      imageAlt: 'Cotton t-shirt', url: '#',
    },
    {
      id: '5', title: 'Wireless Noise-Canceling Headphones', description: 'Premium ANC headphones with 30hr battery',
      handle: 'wireless-headphones', price: '249.99', currency: 'USD',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      imageAlt: 'Headphones', url: '#',
    },
    {
      id: '6', title: 'Minimalist Watch', description: 'Japanese movement watch with leather strap',
      handle: 'minimalist-watch', price: '159.99', currency: 'USD',
      image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop',
      imageAlt: 'Watch', url: '#',
    },
  ],
};

function getMockProducts(query: string): Product[] {
  const q = query.toLowerCase();
  let products = MOCK_PRODUCTS.default;

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    q.split(' ').some(word => p.title.toLowerCase().includes(word) || p.description.toLowerCase().includes(word))
  );

  return filtered.length > 0 ? filtered : products.slice(0, 4);
}

export async function searchProducts(query: string, first: number = 6): Promise<Product[]> {
  if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) {
    return getMockProducts(query);
  }

  try {
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: PRODUCTS_QUERY,
          variables: { query, first },
        }),
      }
    );

    if (!res.ok) throw new Error(res.statusText);

    const data = await res.json();
    if (data.errors) throw new Error(JSON.stringify(data.errors));

    return data.data.products.edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      description: edge.node.description,
      handle: edge.node.handle,
      price: parseFloat(edge.node.priceRange.minVariantPrice.amount).toFixed(2),
      currency: edge.node.priceRange.minVariantPrice.currencyCode,
      image: edge.node.images.edges[0]?.node?.url || null,
      imageAlt: edge.node.images.edges[0]?.node?.altText || edge.node.title,
      url: edge.node.onlineStoreUrl || `https://${SHOPIFY_DOMAIN}/products/${edge.node.handle}`,
    }));
  } catch (err) {
    console.error('Shopify API error, falling back to mock:', err);
    return getMockProducts(query);
  }
}
