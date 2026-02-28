export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  price: string;
  currency: string;
  image: string | null;
  imageAlt: string;
  url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
}

export interface ChatRequest {
  transcript: string;
  history: { role: string; content: string }[];
}

export interface ChatResponse {
  message: string;
  products: Product[];
}

export type MicState = 'idle' | 'listening' | 'processing' | 'speaking';
