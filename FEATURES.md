# ShopifyVoice — Features

## Voice & Text Input

- **Voice recording** via MediaRecorder API — tap the mic, speak naturally, tap again to send
- **Audio transcription** powered by Gemini 2.5 Flash — no reliance on browser Speech API
- **Text input** as an alternative — type queries directly in the chat bar
- **ElevenLabs TTS** — every response is spoken aloud with natural voice synthesis
- Real-time status indicators: idle, listening, thinking, speaking

## Product Search

- **Natural language search** — "show me hoodies", "what mugs do you have?"
- Queries the Shopify Storefront API (GraphQL)
- Smart plural/singular handling — "hoodies" finds "Test Hoodie"
- Falls back to individual word search and wildcard if exact match fails
- Product cards with image, title, price, and Add to Cart button

## Product Creation with AI Images

- **Voice-activated product creation** — "add a red sneaker for $120"
- Gemini parses title, description, price, and category from natural speech
- **AI product image generation** using Gemini 2.0 Flash Image Generation
  - Generates a professional e-commerce product photo based on the product description
  - Automatically uploads the image to the Shopify product listing
- Product appears immediately as active in the Shopify store
- Rich UI card shows the AI-generated image with an "AI Generated" badge

## Shopping Cart

- **Add to Cart from product cards** — click the button on any search result
- **Voice Add to Cart** — "add the hoodie to my cart" adds the last shown product
- Real Shopify Storefront cart via GraphQL mutations (cartCreate, cartLinesAdd)
- Live cart badge in the header showing item count and total
- Direct link to Shopify checkout

## Price Management

- **Voice price editing** — "change the price of all hoodies to $60"
- Fuzzy product matching — handles plurals, "all", "the", "my" prefixes
- Updates **all variants** of the matched product (not just the first)
- Confirmation card shows old price → new price

## Store Analytics

- **Voice analytics** — "how are my sales?", "what's my best seller?"
- Pulls real data from Shopify Admin API (orders, products)
- Dashboard card showing:
  - Total revenue & order count
  - Today's revenue & order count
  - Total products listed
  - Best selling product

## Discount Code Creation

- **Voice discount codes** — "create a 20% off code called LISTENHACKS"
- Creates a real Shopify price rule + discount code via Admin API
- Handles duplicate codes gracefully — auto-appends a suffix if the code already exists
- Clean description generation — Gemini rewrites messy voice input into proper text
- Confirmation card with code, percentage, and description

## Cross-Session Memory (Backboard.io)

- **Persistent shopper memory** powered by Backboard.io — remembers what you browsed, bought, and created across sessions
- On every interaction, shopping events are automatically saved to Backboard with `memory: "Auto"`
  - Product searches, cart additions, product creation, price changes, discount codes
- **Personalized welcome on return** — when you reopen the app, Backboard recalls your history:
  - *"Welcome Back! You searched for hoodies and added the Test Hoodie ($60) to your cart. You created a discount code LISTENHACKS and show interest in streetwear."*
- Memory is stored at the assistant level, so it persists across all sessions
- "Powered by Backboard.io Memory" badge shown on the welcome screen
- Uses the Backboard.io SDK with assistant threads and automatic memory extraction

## Intent Recognition

Gemini 2.5 Flash classifies every user message into one of 6 actions:

| Intent | Trigger Examples |
|--------|-----------------|
| `search` | "show me hoodies", "what products do you have?" |
| `create` | "add a leather wallet for $49", "create a new t-shirt" |
| `add_to_cart` | "add the hoodie to my cart", "I'll take the mug" |
| `edit_price` | "change hoodie price to $60", "make the mug $15" |
| `analytics` | "how are sales?", "what's my revenue?" |
| `create_discount` | "create a 20% off code called SAVE20" |

## Multi-Language Support

- **Speak in any language** — Gemini detects the language automatically
- Search queries are internally translated to English for Shopify, but all responses come back in the user's language
- Supported for all features: search, product creation, price editing, analytics, discount codes
- **ElevenLabs multilingual TTS** — responses are spoken aloud in the detected language using `eleven_multilingual_v2`
- Examples:
  - French: "Montre-moi des chandails" → responds in French with product results
  - Spanish: "¿Cómo van mis ventas?" → analytics response in Spanish
  - Any of the 29 languages ElevenLabs supports

## UI / UX

- Dark gradient mesh background with ambient animated orbs
- Framer Motion animations on all transitions
- Responsive layout — works on desktop and mobile
- Conversational chat interface with user/assistant bubbles
- Rich response cards: product grids, analytics dashboards, discount badges, price update confirmations
- Quick-start prompt buttons on the welcome screen
- Personalized "Welcome Back" screen with shopper memory summary
- Persistent bottom input bar during conversation
