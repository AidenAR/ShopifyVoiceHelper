'use client';

import { motion } from 'framer-motion';
import { Message, Product } from '@/types';
import ProductGrid from './ProductGrid';

interface ChatBubbleProps {
  message: Message;
  onAddToCart?: (product: Product) => Promise<void>;
}

export default function ChatBubble({ message, onAddToCart }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`text-[10px] uppercase tracking-widest font-medium mb-1.5 px-1 ${
          isUser ? 'text-right text-violet-400/60' : 'text-left text-slate-500'
        }`}>
          {isUser ? 'You' : 'ShopifyVoice'}
        </div>

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-violet-500/15 border border-violet-500/20 text-slate-200'
              : 'bg-white/[0.04] border border-white/[0.06] text-slate-300'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* Product created confirmation */}
        {!isUser && message.created && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-300 truncate">{message.created.title}</p>
              <p className="text-xs text-emerald-400/60">${message.created.price} — Added to your store</p>
            </div>
          </motion.div>
        )}

        {/* Product search results */}
        {!isUser && message.products && message.products.length > 0 && (
          <ProductGrid products={message.products} onAddToCart={onAddToCart} />
        )}
      </div>
    </motion.div>
  );
}
