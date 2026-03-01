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
        <div className={`flex items-center gap-2 mb-1.5 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && (
            <div className="w-6 h-6 rounded-full bg-[#008060] flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">Iv</span>
            </div>
          )}
          <span className={`text-[11px] font-medium ${isUser ? 'text-[#999590]' : 'text-[#6b6b6b]'}`}>
            {isUser ? 'You' : 'Ivy'}
          </span>
        </div>

        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-[#008060] text-white rounded-tr-md shadow-sm'
            : 'bg-white border border-[#e3e5e7] text-[#1a1a1a] rounded-tl-md shadow-sm'
        }`}>
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* Created product */}
        {!isUser && message.created && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#008060]/20 overflow-hidden shadow-sm"
          >
            {message.created.image && (
              <div className="relative w-full aspect-square max-h-48 bg-[#faf9f6]">
                <img src={message.created.image} alt={message.created.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-[#008060] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow">AI Generated</div>
              </div>
            )}
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#e8f5e9] flex items-center justify-center shrink-0 text-[#008060]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 4v16m8-8H4" /></svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1a1a1a] truncate">{message.created.title}</p>
                <p className="text-xs text-[#008060]">${message.created.price} — Added to your store</p>
              </div>
            </div>
          </motion.div>
        )}

        {!isUser && message.priceUpdate && (
          <InfoCard color="amber" icon="tag" title={message.priceUpdate.title} subtitle={`$${message.priceUpdate.oldPrice} → $${message.priceUpdate.newPrice}`} />
        )}

        {!isUser && message.addedToCart && (
          <InfoCard color="green" icon="cart" title={message.addedToCart.title} subtitle="Added to your cart" />
        )}

        {/* Discount */}
        {!isUser && message.discount && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#5C6AC4]/20 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#5C6AC4]/10 flex items-center justify-center shrink-0 text-[#5C6AC4]">
                <span className="text-lg font-bold">%</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-mono font-bold text-[#5C6AC4]">{message.discount.code}</p>
                <p className="text-xs text-[#6b6b6b]">{message.discount.percentage}% off — {message.discount.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analytics */}
        {!isUser && message.analytics && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#e3e5e7] px-4 py-4 shadow-sm">
            <div className="grid grid-cols-2 gap-2.5">
              <StatBox label="Total Revenue" value={`$${message.analytics.totalRevenue}`} accent />
              <StatBox label="Total Orders" value={String(message.analytics.totalOrders)} />
              <StatBox label="Today" value={`$${message.analytics.todayRevenue}`} />
              <StatBox label="Today Orders" value={String(message.analytics.todayOrders)} />
              <StatBox label="Products" value={String(message.analytics.totalProducts)} />
              <StatBox label="Best Seller" value={message.analytics.bestSeller} small />
            </div>
          </motion.div>
        )}

        {!isUser && message.inventoryUpdate && (
          <InfoCard color="blue" icon="box" title={message.inventoryUpdate.title} subtitle={`${message.inventoryUpdate.oldQuantity} → ${message.inventoryUpdate.newQuantity} units`} />
        )}

        {/* Inventory Summary */}
        {!isUser && message.inventorySummary && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#e3e5e7] px-4 py-4 shadow-sm">
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <StatBox label="Total Stock" value={String(message.inventorySummary.totalStock)} accent />
              <StatBox label="Products" value={String(message.inventorySummary.totalProducts)} />
              <StatBox label="Low Stock" value={String(message.inventorySummary.lowStock.length)} warn />
              <StatBox label="Out of Stock" value={String(message.inventorySummary.outOfStock.length)} danger />
            </div>
            <div className="space-y-0">
              {message.inventorySummary.products.slice(0, 5).map((p) => (
                <div key={p.title} className="flex items-center justify-between text-xs py-2 border-t border-[#e3e5e7] first:border-0">
                  <span className="text-[#1a1a1a] truncate mr-2">{p.title}</span>
                  <span className={`font-mono font-medium ${p.stock <= 0 ? 'text-red-600' : p.stock <= 10 ? 'text-amber-600' : 'text-[#6b6b6b]'}`}>{p.stock} units</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {!isUser && message.deletedProduct && (
          <InfoCard color="red" icon="trash" title={message.deletedProduct.title} subtitle="Removed from your store" />
        )}

        {!isUser && message.fulfillment && (
          <InfoCard color="green" icon="truck" title={`Order #${message.fulfillment.orderNumber}`} subtitle={`${message.fulfillment.customerName} — ${message.fulfillment.itemCount} items, $${message.fulfillment.totalPrice}`} />
        )}

        {/* Customers */}
        {!isUser && message.customers && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#e3e5e7] px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#5C6AC4]/10 flex items-center justify-center text-[#5C6AC4]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
              </div>
              <span className="text-sm font-semibold text-[#1a1a1a]">{message.customers.totalCustomers} Customers</span>
            </div>
            <div className="space-y-1.5">
              {message.customers.recentCustomers.map((c) => (
                <div key={c.email} className="flex items-center justify-between text-xs bg-[#faf9f6] rounded-lg px-3 py-2.5">
                  <div><p className="text-[#1a1a1a] font-medium">{c.name}</p><p className="text-[#999590]">{c.email}</p></div>
                  <div className="text-right"><p className="text-[#1a1a1a]">{c.ordersCount} orders</p><p className="text-[#008060] font-semibold">${c.totalSpent}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bulk Price */}
        {!isUser && message.bulkPrice && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#e3e5e7] px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
              </div>
              <span className="text-sm font-semibold text-[#1a1a1a]">{message.bulkPrice.productsUpdated} Products Updated</span>
            </div>
            <div className="space-y-0">
              {message.bulkPrice.changes.slice(0, 8).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-2 border-t border-[#e3e5e7] first:border-0">
                  <span className="text-[#1a1a1a] truncate mr-2">{c.title}</span>
                  <span className="font-mono text-[#6b6b6b]">${c.oldPrice} → <span className="text-[#008060] font-semibold">${c.newPrice}</span></span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Comparison */}
        {!isUser && message.comparison && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#e3e5e7] p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-2.5">
              {[message.comparison.product1, message.comparison.product2].map((p, i) => (
                <div key={i} className="bg-[#faf9f6] rounded-lg p-3 space-y-2">
                  {p.image && <img src={p.image} alt={p.title} className="w-full h-24 object-cover rounded-md" />}
                  <p className="text-sm font-semibold text-[#1a1a1a] truncate">{p.title}</p>
                  <div className="space-y-1.5">
                    <Row label="Price" value={`$${p.price}`} accent />
                    <Row label="Stock" value={`${p.stock} units`} />
                    <Row label="Type" value={p.type} />
                    <Row label="Variants" value={String(p.variants)} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Restock */}
        {!isUser && message.restock && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#e3e5e7] px-4 py-4 shadow-sm">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-red-50 rounded-lg px-3 py-2 text-center border border-red-100">
                <p className="text-[10px] uppercase tracking-wider text-red-400 font-medium">Out</p>
                <p className="text-lg font-bold text-red-600">{message.restock.urgentCount}</p>
              </div>
              <div className="bg-amber-50 rounded-lg px-3 py-2 text-center border border-amber-100">
                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-medium">Low</p>
                <p className="text-lg font-bold text-amber-600">{message.restock.lowCount}</p>
              </div>
              <div className="bg-[#e8f5e9] rounded-lg px-3 py-2 text-center border border-[#008060]/15">
                <p className="text-[10px] uppercase tracking-wider text-[#008060]/60 font-medium">Watch</p>
                <p className="text-lg font-bold text-[#008060]">{message.restock.watchCount}</p>
              </div>
            </div>
            <div className="space-y-0">
              {message.restock.suggestions.map((s) => (
                <div key={s.title} className="flex items-center justify-between text-xs py-2 border-t border-[#e3e5e7] first:border-0">
                  <span className="text-[#1a1a1a] truncate mr-2">{s.title}</span>
                  <span className={`font-mono font-semibold ${s.stock <= 0 ? 'text-red-600' : s.stock <= 10 ? 'text-amber-600' : 'text-[#008060]'}`}>{s.stock} left</span>
                </div>
              ))}
              {message.restock.suggestions.length === 0 && (
                <p className="text-xs text-[#008060] text-center py-2 font-medium">All products well stocked!</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Collection */}
        {!isUser && message.collection && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#008060]/20 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#e8f5e9] flex items-center justify-center text-[#008060]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">{message.collection.title}</p>
                <p className="text-xs text-[#008060]">{message.collection.productsAdded.length} products added</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.collection.productsAdded.map((name) => (
                <span key={name} className="text-[11px] px-2.5 py-1 rounded-md bg-[#e8f5e9] text-[#008060] font-medium">{name}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Order Status */}
        {!isUser && message.orderStatus && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#e3e5e7] px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#5C6AC4]/10 flex items-center justify-center text-[#5C6AC4]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <span className="text-sm font-semibold text-[#1a1a1a]">{message.orderStatus.totalOrders} Orders</span>
            </div>
            <div className="space-y-0">
              {message.orderStatus.orders.map((o) => (
                <div key={o.orderNumber} className="flex items-center justify-between text-xs py-2.5 border-t border-[#e3e5e7] first:border-0">
                  <div>
                    <p className="text-[#1a1a1a] font-medium">#{o.orderNumber} — {o.customerName}</p>
                    <p className="text-[#999590]">{o.createdAt} · {o.itemCount} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1a1a1a]">${o.totalPrice}</p>
                    <p className={`text-[10px] font-medium ${o.fulfillmentStatus === 'fulfilled' ? 'text-[#008060]' : o.fulfillmentStatus === 'Unfulfilled' ? 'text-amber-600' : 'text-[#6b6b6b]'}`}>
                      {o.fulfillmentStatus} · {o.financialStatus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Refund */}
        {!isUser && message.refund && (
          <InfoCard color="red" icon="refund" title={`Order #${message.refund.orderNumber}`} subtitle={`$${message.refund.refundAmount} refunded — ${message.refund.lineItems} items`} />
        )}

        {/* SEO */}
        {!isUser && message.seo && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#008060]/20 px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#e8f5e9] flex items-center justify-center text-[#008060]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              </div>
              <span className="text-sm font-semibold text-[#1a1a1a]">SEO — {message.seo.title}</span>
            </div>
            <div className="space-y-2.5">
              <div className="bg-[#faf9f6] rounded-lg px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-[#999590] font-medium mb-1">Meta Title</p>
                <p className="text-xs text-[#999590] line-through">{message.seo.oldMetaTitle || 'None'}</p>
                <p className="text-xs text-[#008060] font-medium">{message.seo.newMetaTitle}</p>
              </div>
              <div className="bg-[#faf9f6] rounded-lg px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-[#999590] font-medium mb-1">Meta Description</p>
                <p className="text-xs text-[#999590] line-through">{message.seo.oldMetaDescription || 'None'}</p>
                <p className="text-xs text-[#008060] font-medium">{message.seo.newMetaDescription}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Social Caption */}
        {!isUser && message.socialCaption && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#5C6AC4]/20 px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#5C6AC4]/10 flex items-center justify-center text-[#5C6AC4]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-[#1a1a1a] capitalize">{message.socialCaption.platform}</span>
                <span className="text-xs text-[#6b6b6b] ml-2">· {message.socialCaption.productTitle}</span>
              </div>
            </div>
            <div className="bg-[#faf9f6] rounded-lg px-3 py-3 mb-2.5">
              <p className="text-sm text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">{message.socialCaption.caption}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.socialCaption.hashtags.map((tag) => (
                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md bg-[#5C6AC4]/10 text-[#5C6AC4] font-medium">#{tag}</span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pricing Suggestion */}
        {!isUser && message.pricingSuggestion && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#008060]/20 px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#e8f5e9] flex items-center justify-center text-[#008060]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
              </div>
              <span className="text-sm font-semibold text-[#1a1a1a]">{message.pricingSuggestion.productTitle}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <StatBox label="Current Price" value={`$${message.pricingSuggestion.currentPrice}`} />
              <StatBox label="Suggested Price" value={`$${message.pricingSuggestion.suggestedPrice}`} accent />
              <StatBox label="Store Average" value={`$${message.pricingSuggestion.storeAvgPrice}`} />
              <StatBox label="Price Range" value={message.pricingSuggestion.storePriceRange} small />
            </div>
            <div className="bg-[#e8f5e9] rounded-lg px-3 py-2.5">
              <p className="text-xs text-[#008060] leading-relaxed">{message.pricingSuggestion.reasoning}</p>
            </div>
          </motion.div>
        )}

        {/* Revenue Forecast */}
        {!isUser && message.revenueForecast && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-[#e3e5e7] px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#e8f5e9] flex items-center justify-center text-[#008060]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-[#1a1a1a]">Revenue Forecast</span>
                <span className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${message.revenueForecast.trend === 'growing' ? 'bg-[#e8f5e9] text-[#008060]' : message.revenueForecast.trend === 'declining' ? 'bg-red-50 text-red-600' : 'bg-[#faf9f6] text-[#6b6b6b]'}`}>
                  {message.revenueForecast.trend === 'growing' ? '↑ Growing' : message.revenueForecast.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <StatBox label="Predicted Next Month" value={`$${message.revenueForecast.predictedNextMonth}`} accent />
              <StatBox label="This Month" value={`$${message.revenueForecast.currentMonthRevenue}`} />
              <StatBox label="Last Month" value={`$${message.revenueForecast.lastMonthRevenue}`} />
              <StatBox label="Avg Order Value" value={`$${message.revenueForecast.avgOrderValue}`} />
            </div>
            {message.revenueForecast.monthlyBreakdown.length > 0 && (
              <div className="space-y-0">
                {message.revenueForecast.monthlyBreakdown.map((m) => (
                  <div key={m.month} className="flex items-center justify-between text-xs py-2 border-t border-[#e3e5e7] first:border-0">
                    <span className="text-[#6b6b6b]">{m.month}</span>
                    <span className="font-mono font-semibold text-[#1a1a1a]">${m.revenue}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Ad Copy */}
        {!isUser && message.adCopy && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-3 rounded-xl bg-white border border-amber-200 px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-[#1a1a1a] capitalize">{message.adCopy.platform} Ad</span>
                <span className="text-xs text-[#6b6b6b] ml-2">· {message.adCopy.productTitle}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-amber-50 rounded-lg px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-medium mb-1">Headline</p>
                <p className="text-sm font-bold text-[#1a1a1a]">{message.adCopy.headline}</p>
              </div>
              <div className="bg-[#faf9f6] rounded-lg px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-[#999590] font-medium mb-1">Body</p>
                <p className="text-xs text-[#1a1a1a] leading-relaxed">{message.adCopy.body}</p>
              </div>
              <div className="flex items-center justify-between bg-[#008060] rounded-lg px-3 py-2">
                <span className="text-[10px] uppercase tracking-wider text-white/70 font-medium">CTA</span>
                <span className="text-xs font-bold text-white">{message.adCopy.cta}</span>
              </div>
            </div>
          </motion.div>
        )}

        {!isUser && message.products && message.products.length > 0 && (
          <ProductGrid products={message.products} onAddToCart={onAddToCart} />
        )}
      </div>
    </motion.div>
  );
}

function InfoCard({ color, icon, title, subtitle }: { color: string; icon: string; title: string; subtitle: string }) {
  const borderMap: Record<string, string> = { green: 'border-[#008060]/20', amber: 'border-amber-200', blue: 'border-[#5C6AC4]/20', red: 'border-red-200' };
  const iconBgMap: Record<string, string> = { green: 'bg-[#e8f5e9] text-[#008060]', amber: 'bg-amber-50 text-amber-600', blue: 'bg-[#5C6AC4]/10 text-[#5C6AC4]', red: 'bg-red-50 text-red-500' };
  const subColorMap: Record<string, string> = { green: 'text-[#008060]', amber: 'text-amber-600', blue: 'text-[#5C6AC4]', red: 'text-red-500' };

  const icons: Record<string, React.ReactElement> = {
    plus: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 4v16m8-8H4" /></svg>,
    tag: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
    cart: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>,
    box: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
    trash: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>,
    truck: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
    refund: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className={`mt-3 rounded-xl border px-4 py-3 flex items-center gap-3 bg-white shadow-sm ${borderMap[color] || 'border-[#e3e5e7]'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBgMap[color]}`}>{icons[icon]}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#1a1a1a] truncate">{title}</p>
        <p className={`text-xs ${subColorMap[color] || 'text-[#6b6b6b]'}`}>{subtitle}</p>
      </div>
    </motion.div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-[#999590]">{label}</span>
      <span className={accent ? 'text-[#008060] font-semibold' : 'text-[#1a1a1a]'}>{value}</span>
    </div>
  );
}

function StatBox({ label, value, small, accent, warn, danger }: { label: string; value: string; small?: boolean; accent?: boolean; warn?: boolean; danger?: boolean }) {
  const valueColor = danger ? 'text-red-600' : warn ? 'text-amber-600' : accent ? 'text-[#008060]' : 'text-[#1a1a1a]';
  return (
    <div className="bg-[#faf9f6] rounded-lg px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[#999590] mb-0.5 font-medium">{label}</p>
      <p className={`font-semibold ${valueColor} ${small ? 'text-xs' : 'text-sm'}`}>{value}</p>
    </div>
  );
}
