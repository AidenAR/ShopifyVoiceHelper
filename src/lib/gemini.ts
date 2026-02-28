import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const INTENT_PROMPT = `You are an intent parser for a Shopify store voice assistant. Given a user's message, determine if they want to SEARCH for products or CREATE a new product.

Return ONLY valid JSON in one of these two formats:

For SEARCH:
{
  "action": "search",
  "searchQuery": "product search keywords",
  "priceMax": null,
  "priceMin": null
}

For CREATE:
{
  "action": "create",
  "title": "product name",
  "description": "brief product description",
  "price": "29.99",
  "productType": "category"
}

Rules:
- If the user says things like "add", "create", "list", "put up", "new product" → action is "create"
- If the user says "show me", "find", "search", "I want", "looking for" → action is "search"
- For create: extract a reasonable title, description, price, and product type from their message
- If they don't specify a price for create, set a reasonable default
- Keep searchQuery concise (2-5 words)`;

const RESPONSE_PROMPT = `You are a friendly voice shopping assistant named ShopifyVoice. Generate a brief, natural spoken response (1-2 sentences, under 35 words).

Rules:
- Sound natural when spoken aloud — no markdown, no bullets, no special formatting
- If products were found, mention 1-2 by name and price
- If no products found, suggest trying different terms
- If a product was just created, confirm with its name and price
- Be warm, helpful, conversational
- Never say "I found X products" — just naturally reference them`;

export async function parseIntent(
  userMessage: string,
  history: { role: string; content: string }[]
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const historyContext = history.length > 0
    ? `\nRecent conversation:\n${history.slice(-6).map(h => `${h.role}: ${h.content}`).join('\n')}\n`
    : '';

  const result = await model.generateContent(
    `${INTENT_PROMPT}\n${historyContext}\nUser: "${userMessage}"\n\nJSON:`
  );

  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    return { action: 'search', searchQuery: userMessage, priceMax: null, priceMin: null };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { action: 'search', searchQuery: userMessage, priceMax: null, priceMin: null };
  }
}

export async function generateResponse(
  userMessage: string,
  context: string,
  history: { role: string; content: string }[]
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const historyContext = history.length > 0
    ? `\nRecent conversation:\n${history.slice(-4).map(h => `${h.role}: ${h.content}`).join('\n')}\n`
    : '';

  const result = await model.generateContent(
    `${RESPONSE_PROMPT}\n${historyContext}\nUser asked: "${userMessage}"\n\nContext:\n${context}\n\nSpoken response:`
  );

  return result.response.text().trim().replace(/"/g, '');
}
