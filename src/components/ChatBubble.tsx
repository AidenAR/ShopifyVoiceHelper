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

        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-violet-500/15 border border-violet-500/20 text-slate-200'
            : 'bg-white/[0.04] border border-white/[0.06] text-slate-300'
        }`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* Created product */}
        {!isUser && message.created && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 overflow-hidden"
          >
            {message.created.image && (
              <div className="relative w-full aspect-square max-h-48 bg-white/5">
                <img
                  src={message.created.image}
                  alt={message.created.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  AI Generated
                </div>
              </div>
            )}
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 4v16m8-8H4" /></svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-300 truncate">{message.created.title}</p>
                <p className="text-xs text-emerald-400/60">${message.created.price} — Added to your store</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Price update */}
        {!isUser && message.priceUpdate && (
          <InfoCard color="amber" icon="tag" title={message.priceUpdate.title}
            subtitle={`$${message.priceUpdate.oldPrice} → $${message.priceUpdate.newPrice}`} />
        )}

        {/* Added to cart */}
        {!isUser && message.addedToCart && (
          <InfoCard color="violet" icon="cart" title={message.addedToCart.title} subtitle="Added to your cart" />
        )}

        {/* Discount */}
        {!isUser && message.discount && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0">
                <span className="text-lg">%</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-mono font-bold text-pink-300">{message.discount.code}</p>
                <p className="text-xs text-pink-400/60">{message.discount.percentage}% off — {message.discount.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analytics */}
        {!isUser && message.analytics && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Total Revenue" value={`$${message.analytics.totalRevenue}`} />
              <StatBox label="Total Orders" value={String(message.analytics.totalOrders)} />
              <StatBox label="Today's Revenue" value={`$${message.analytics.todayRevenue}`} />
              <StatBox label="Today's Orders" value={String(message.analytics.todayOrders)} />
              <StatBox label="Products" value={String(message.analytics.totalProducts)} />
              <StatBox label="Best Seller" value={message.analytics.bestSeller} small />
            </div>
          </motion.div>
        )}

        {/* Products */}
        {!isUser && message.products && message.products.length > 0 && (
          <ProductGrid products={message.products} onAddToCart={onAddToCart} />
        )}
      </div>
    </motion.div>
  );
}

function InfoCard({ color, icon, title, subtitle }: { color: string; icon: string; title: string; subtitle: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
    violet: 'bg-violet-500/10 border-violet-500/20',
  };
  const iconColorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    violet: 'bg-violet-500/20 text-violet-400',
  };
  const textMap: Record<string, string> = {
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    violet: 'text-violet-300',
  };
  const subMap: Record<string, string> = {
    emerald: 'text-emerald-400/60',
    amber: 'text-amber-400/60',
    violet: 'text-violet-400/60',
  };

  const icons: Record<string, JSX.Element> = {
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 4v16m8-8H4" /></svg>,
    tag: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
    cart: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`mt-3 rounded-2xl border px-4 py-3 flex items-center gap-3 ${colorMap[color]}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColorMap[color]}`}>
        {icons[icon]}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate ${textMap[color]}`}>{title}</p>
        <p className={`text-xs ${subMap[color]}`}>{subtitle}</p>
      </div>
    </motion.div>
  );
}

function StatBox({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-cyan-500/5 rounded-xl px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-cyan-400/50 mb-0.5">{label}</p>
      <p className={`font-semibold text-cyan-200 ${small ? 'text-xs' : 'text-sm'}`}>{value}</p>
    </div>
  );
}
