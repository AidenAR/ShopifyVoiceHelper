'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  index: number;
  onAddToCart?: (product: Product) => Promise<void>;
}

export default function ProductCard({ product, index, onAddToCart }: ProductCardProps) {
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle');

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status !== 'idle') return;
    setStatus('adding');
    try {
      await onAddToCart?.(product);
      setStatus('added');
      setTimeout(() => setStatus('idle'), 2500);
    } catch { setStatus('idle'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3 }}
      className="group rounded-xl bg-white border border-[#e8e6e1] overflow-hidden hover:shadow-lg hover:border-[#008060]/30 transition-all duration-200"
    >
      <div className="relative aspect-square overflow-hidden bg-[#faf9f6]">
        {product.image ? (
          <img src={product.image} alt={product.imageAlt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#d4d1cb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
        )}
        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-[#e8e6e1] shadow-sm">
          <span className="text-sm font-semibold text-[#1a1a1a]">${parseFloat(product.price).toFixed(0)}</span>
        </div>
        <AnimatePresence>
          {status === 'added' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#008060]/15 backdrop-blur-sm flex items-center justify-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }} className="w-12 h-12 rounded-full bg-[#008060] flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="p-3.5">
        <h3 className="text-sm font-medium text-[#1a1a1a] truncate">{product.title}</h3>
        <p className="text-xs text-[#6b6b6b] mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#008060]">${product.price} {product.currency}</span>
          <button
            onClick={handleAddToCart}
            disabled={status !== 'idle'}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer disabled:cursor-default ${
              status === 'added' ? 'bg-[#e8f5e9] text-[#008060]'
              : status === 'adding' ? 'bg-[#faf9f6] text-[#999590]'
              : 'bg-[#008060] text-white hover:bg-[#006e52] shadow-sm'
            }`}
          >
            {status === 'added' ? 'Added!' : status === 'adding' ? '...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
