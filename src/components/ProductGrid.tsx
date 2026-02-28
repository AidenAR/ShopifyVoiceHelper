'use client';

import { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => Promise<void>;
}

export default function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
