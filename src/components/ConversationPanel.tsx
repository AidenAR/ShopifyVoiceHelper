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
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <div className="w-6 h-6 rounded-full bg-[#008060] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">Iv</span>
              </div>
              <span className="text-[11px] font-medium text-[#6b6b6b]">Ivy</span>
            </div>
            <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-white border border-[#e8e6e1] shadow-sm">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#008060] animate-bounce"
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
