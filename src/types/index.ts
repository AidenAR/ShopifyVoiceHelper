export interface Product {
  id: string;
  variantId: string;
  title: string;
  description: string;
  handle: string;
  price: string;
  currency: string;
  image: string | null;
  imageAlt: string;
  url: string;
}

export interface CreatedProduct {
  id: number;
  title: string;
  price: string;
  handle: string;
  image?: string | null;
}

export interface PriceUpdate {
  title: string;
  oldPrice: string;
  newPrice: string;
}

export interface Analytics {
  totalOrders: number;
  totalRevenue: string;
  todayOrders: number;
  todayRevenue: string;
  totalProducts: number;
  bestSeller: string;
  currency: string;
}

export interface Discount {
  code: string;
  percentage: string;
  description: string;
}

export interface ChatResponse {
  message: string;
  products: Product[];
  created: CreatedProduct | null;
  priceUpdate: PriceUpdate | null;
  analytics: Analytics | null;
  discount: Discount | null;
  addedToCart: { title: string; variantId: string } | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  created?: CreatedProduct | null;
  priceUpdate?: PriceUpdate | null;
  analytics?: Analytics | null;
  discount?: Discount | null;
  addedToCart?: { title: string; variantId: string } | null;
}

export interface ChatRequest {
  transcript: string;
  history: { role: string; content: string }[];
  lastProducts?: { title: string; variantId: string }[];
}

export type MicState = 'idle' | 'listening' | 'processing' | 'speaking';
