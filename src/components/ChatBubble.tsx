'use client';

import { motion } from 'framer-motion';
import { Message } from '@/types';
import ProductGrid from './ProductGrid';

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Label */}
        <div className={`text-[10px] uppercase tracking-widest font-medium mb-1.5 px-1 ${
          isUser ? 'text-right text-violet-400/60' : 'text-left text-slate-500'
        }`}>
          {isUser ? 'You' : 'ShopifyVoice'}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-violet-500/15 border border-violet-500/20 text-slate-200'
              : 'bg-white/[0.04] border border-white/[0.06] text-slate-300'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* Products (only on assistant messages) */}
        {!isUser && message.products && message.products.length > 0 && (
          <ProductGrid products={message.products} />
        )}
      </div>
    </motion.div>
  );
}
