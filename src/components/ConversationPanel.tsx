'use client';

import { useEffect, useRef } from 'react';
import { Message, Product } from '@/types';
import ChatBubble from './ChatBubble';

interface ConversationPanelProps {
  messages: Message[];
  isLoading: boolean;
  onAddToCart?: (product: Product) => Promise<void>;
}

export default function ConversationPanel({ messages, isLoading, onAddToCart }: ConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 scroll-smooth">
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} onAddToCart={onAddToCart} />
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-[85%]">
            <div className="text-[10px] uppercase tracking-widest font-medium mb-1.5 px-1 text-slate-500">
              ShopifyVoice
            </div>
            <div className="rounded-2xl px-4 py-3 bg-white/[0.04] border border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
