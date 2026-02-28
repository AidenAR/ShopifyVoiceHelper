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
    } catch {
      setStatus('idle');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden backdrop-blur-sm hover:border-white/[0.12] hover:bg-white/[0.06] transition-colors duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-white/[0.02]">
        {product.image ? (
          <img
            src={product.image}
            alt={product.imageAlt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
        )}

        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          <span className="text-sm font-semibold text-white">
            ${parseFloat(product.price).toFixed(0)}
          </span>
        </div>

        <AnimatePresence>
          {status === 'added' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-medium text-slate-200 truncate leading-snug">
          {product.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-medium text-violet-400">
            ${product.price} {product.currency}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={status !== 'idle'}
            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-300 cursor-pointer disabled:cursor-default ${
              status === 'added'
                ? 'bg-emerald-500/20 text-emerald-300'
                : status === 'adding'
                ? 'bg-white/[0.06] text-slate-500'
                : 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/25'
            }`}
          >
            {status === 'added' ? 'Added!' : status === 'adding' ? '...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
