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

export interface ChatRequest {
  transcript: string;
  history: { role: string; content: string }[];
}

export interface CreatedProduct {
  id: number;
  title: string;
  price: string;
  handle: string;
}

export interface ChatResponse {
  message: string;
  products: Product[];
  created: CreatedProduct | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  created?: CreatedProduct | null;
}

export type MicState = 'idle' | 'listening' | 'processing' | 'speaking';
