import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const INTENT_PROMPT = `You are an intent parser for a Shopify store voice assistant. Determine the user's intent and extract structured data. You understand ALL languages.

Return ONLY valid JSON. ALWAYS include a "lang" field with the ISO 639-1 language code of the user's message (e.g. "en", "fr", "es", "ja", "zh", "de", "pt", "ko", "ar", "hi").

Formats:

SEARCH: {"action":"search","searchQuery":"keywords in English","lang":"xx"}
CREATE: {"action":"create","title":"product name","description":"brief description","price":"29.99","productType":"category","lang":"xx"}
ADD TO CART: {"action":"add_to_cart","productName":"name they referenced","lang":"xx"}
EDIT PRICE: {"action":"edit_price","productName":"product to update","newPrice":"29.99","lang":"xx"}
ANALYTICS: {"action":"analytics","query":"what they want to know","lang":"xx"}
DISCOUNT: {"action":"create_discount","code":"CODE_NAME","percentage":"20","description":"clean readable description","lang":"xx"}

Rules:
- "add", "create", "list", "put up", "new product" with product details → create
- "add to cart", "buy", "get me", "I'll take" referencing a product → add_to_cart
- "change price", "update price", "make it cost" → edit_price
- "sales", "analytics", "revenue", "orders", "best seller", "how's my store" → analytics
- "discount", "coupon", "promo code" → create_discount
- Everything else about finding/showing products → search
- For discount codes: if they don't specify a code name, generate a catchy one in ALL_CAPS
- For discount: percentage should be just the number (e.g. "20" not "20%")
- For discount description: ALWAYS rewrite into a clean, readable description. Never copy the user's raw text with typos or weird casing.
- IMPORTANT: searchQuery should ALWAYS be in English (translate if needed) so Shopify search works, but "lang" should reflect the ORIGINAL language the user spoke in
- Understand queries in any language: "Montre-moi des chandails" → {"action":"search","searchQuery":"sweaters","lang":"fr"}`;

const RESPONSE_PROMPT = `You are a friendly voice shopping assistant named ShopifyVoice. Generate a brief, natural spoken response (1-2 sentences, under 40 words).

Rules:
- Sound natural when spoken aloud — no markdown, no bullets, no special formatting
- Be warm, helpful, conversational
- Match the context: product found, product created, added to cart, price updated, analytics summary, discount created
- Never say "I found X products" — just naturally reference them
- CRITICAL: You MUST respond in the SAME LANGUAGE the user spoke in. If they spoke French, respond in French. If Spanish, respond in Spanish. Match their language exactly.`;

export async function parseIntent(
  userMessage: string,
  history: { role: string; content: string }[],
  lastProducts?: { title: string; variantId: string }[]
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const historyContext = history.length > 0
    ? `\nRecent conversation:\n${history.slice(-6).map(h => `${h.role}: ${h.content}`).join('\n')}\n`
    : '';

  const productsContext = lastProducts && lastProducts.length > 0
    ? `\nProducts currently shown to user:\n${lastProducts.map(p => `- ${p.title}`).join('\n')}\n`
    : '';

  const result = await model.generateContent(
    `${INTENT_PROMPT}\n${historyContext}${productsContext}\nUser: "${userMessage}"\n\nJSON:`
  );

  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    return { action: 'search', searchQuery: userMessage };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { action: 'search', searchQuery: userMessage };
  }
}

export async function generateResponse(
  userMessage: string,
  context: string,
  history: { role: string; content: string }[],
  lang?: string
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const historyContext = history.length > 0
    ? `\nRecent conversation:\n${history.slice(-4).map(h => `${h.role}: ${h.content}`).join('\n')}\n`
    : '';

  const langHint = lang && lang !== 'en'
    ? `\nIMPORTANT: The user is speaking ${lang}. You MUST respond in ${lang}.\n`
    : '';

  const result = await model.generateContent(
    `${RESPONSE_PROMPT}\n${langHint}${historyContext}\nUser asked: "${userMessage}"\n\nContext:\n${context}\n\nSpoken response:`
  );

  return result.response.text().trim().replace(/"/g, '');
}
