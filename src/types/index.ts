export interface Product {
  id: string;
  variantId: string;
  title: string;
  description: string;
  handle: string;
  price: string;
  currency: string;
  image: string | null;
  imageAlt: string;
  url: string;
}

export interface CreatedProduct {
  id: number;
  title: string;
  price: string;
  handle: string;
  image?: string | null;
}

export interface PriceUpdate {
  title: string;
  oldPrice: string;
  newPrice: string;
}

export interface Analytics {
  totalOrders: number;
  totalRevenue: string;
  todayOrders: number;
  todayRevenue: string;
  totalProducts: number;
  bestSeller: string;
  currency: string;
}

export interface Discount {
  code: string;
  percentage: string;
  description: string;
}

export interface InventoryUpdate {
  title: string;
  oldQuantity: number;
  newQuantity: number;
  variantsUpdated: number;
}

export interface InventorySummary {
  products: { title: string; stock: number; variants: number }[];
  totalStock: number;
  totalProducts: number;
  lowStock: { title: string; stock: number }[];
  outOfStock: { title: string; stock: number }[];
}

export interface DeletedProduct {
  id: number;
  title: string;
}

export interface Fulfillment {
  orderNumber: number;
  customerName: string;
  itemCount: number;
  totalPrice: string;
}

export interface CustomerData {
  totalCustomers: number;
  recentCustomers: { name: string; email: string; ordersCount: number; totalSpent: string }[];
}

export interface BulkPriceResult {
  productsUpdated: number;
  changes: { title: string; oldPrice: string; newPrice: string }[];
}

export interface ComparisonResult {
  product1: { title: string; price: string; description: string; type: string; stock: number; variants: number; image: string | null; createdAt: string };
  product2: { title: string; price: string; description: string; type: string; stock: number; variants: number; image: string | null; createdAt: string };
}

export interface RestockSuggestions {
  suggestions: { title: string; stock: number; type: string }[];
  urgentCount: number;
  lowCount: number;
  watchCount: number;
}

export interface CollectionResult {
  id: number;
  title: string;
  productsAdded: string[];
}

export interface OrderStatus {
  orders: { orderNumber: number; status: string; fulfillmentStatus: string; financialStatus: string; customerName: string; totalPrice: string; itemCount: number; createdAt: string }[];
  totalOrders: number;
}

export interface RefundResult {
  orderNumber: number;
  refundAmount: string;
  lineItems: number;
}

export interface SEOResult {
  title: string;
  oldMetaTitle: string;
  newMetaTitle: string;
  oldMetaDescription: string;
  newMetaDescription: string;
}

export interface SocialCaption {
  platform: string;
  productTitle: string;
  caption: string;
  hashtags: string[];
}

export interface PricingSuggestion {
  productTitle: string;
  currentPrice: string;
  suggestedPrice: string;
  reasoning: string;
  storeAvgPrice: string;
  storePriceRange: string;
}

export interface RevenueForecast {
  currentMonthRevenue: string;
  lastMonthRevenue: string;
  predictedNextMonth: string;
  trend: string;
  avgOrderValue: string;
  totalOrders: number;
  monthlyBreakdown: { month: string; revenue: string }[];
}

export interface AdCopy {
  platform: string;
  productTitle: string;
  headline: string;
  body: string;
  cta: string;
}

export interface ChatResponse {
  message: string;
  products: Product[];
  created: CreatedProduct | null;
  priceUpdate: PriceUpdate | null;
  analytics: Analytics | null;
  discount: Discount | null;
  addedToCart: { title: string; variantId: string } | null;
  inventoryUpdate: InventoryUpdate | null;
  inventorySummary: InventorySummary | null;
  deletedProduct: DeletedProduct | null;
  fulfillment: Fulfillment | null;
  customers: CustomerData | null;
  bulkPrice: BulkPriceResult | null;
  comparison: ComparisonResult | null;
  restock: RestockSuggestions | null;
  collection: CollectionResult | null;
  orderStatus: OrderStatus | null;
  refund: RefundResult | null;
  seo: SEOResult | null;
  socialCaption: SocialCaption | null;
  pricingSuggestion: PricingSuggestion | null;
  revenueForecast: RevenueForecast | null;
  adCopy: AdCopy | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  created?: CreatedProduct | null;
  priceUpdate?: PriceUpdate | null;
  analytics?: Analytics | null;
  discount?: Discount | null;
  addedToCart?: { title: string; variantId: string } | null;
  inventoryUpdate?: InventoryUpdate | null;
  inventorySummary?: InventorySummary | null;
  deletedProduct?: DeletedProduct | null;
  fulfillment?: Fulfillment | null;
  customers?: CustomerData | null;
  bulkPrice?: BulkPriceResult | null;
  comparison?: ComparisonResult | null;
  restock?: RestockSuggestions | null;
  collection?: CollectionResult | null;
  orderStatus?: OrderStatus | null;
  refund?: RefundResult | null;
  seo?: SEOResult | null;
  socialCaption?: SocialCaption | null;
  pricingSuggestion?: PricingSuggestion | null;
  revenueForecast?: RevenueForecast | null;
  adCopy?: AdCopy | null;
}

export interface ChatRequest {
  transcript: string;
  history: { role: string; content: string }[];
  lastProducts?: { title: string; variantId: string }[];
}

export type MicState = 'idle' | 'listening' | 'processing' | 'speaking';
