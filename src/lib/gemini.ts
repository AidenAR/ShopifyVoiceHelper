import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const INTENT_PROMPT = `You are a shopping intent parser for a Shopify store voice assistant. Given a user's natural language message and optional conversation history, extract a product search query.

Return ONLY valid JSON:
{
  "searchQuery": "product search keywords",
  "priceMax": null,
  "priceMin": null
}

Rules:
- Extract the most relevant product search terms
- If the user is asking a follow-up (e.g. "something cheaper", "in blue"), use conversation history to refine the query
- priceMax/priceMin should be numbers or null
- Keep searchQuery concise (2-5 words)`;

const RESPONSE_PROMPT = `You are a friendly voice shopping assistant named ShopifyVoice. Generate a brief, natural spoken response (1-2 sentences, under 35 words).

Rules:
- Sound natural when spoken aloud — no markdown, no bullets, no special formatting
- If products were found, mention 1-2 by name and price
- If no products found, suggest trying different terms
- Be warm, helpful, conversational
- Never say "I found X products" — just naturally reference them`;

export async function parseShoppingIntent(
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
    return { searchQuery: userMessage, priceMax: null, priceMin: null };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { searchQuery: userMessage, priceMax: null, priceMin: null };
  }
}

export async function generateResponse(
  userMessage: string,
  products: { title: string; price: string }[],
  history: { role: string; content: string }[]
) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const productList = products.length > 0
    ? products.map(p => `${p.title} — $${p.price}`).join('\n')
    : 'No products found.';

  const historyContext = history.length > 0
    ? `\nRecent conversation:\n${history.slice(-4).map(h => `${h.role}: ${h.content}`).join('\n')}\n`
    : '';

  const result = await model.generateContent(
    `${RESPONSE_PROMPT}\n${historyContext}\nUser asked: "${userMessage}"\n\nProducts found:\n${productList}\n\nSpoken response:`
  );

  return result.response.text().trim().replace(/"/g, '');
}
