# ShopifyVoice — Features

## Voice & Text Input

- **Voice recording** via MediaRecorder API — tap the mic, speak naturally, tap again to send
- **Audio transcription** powered by Gemini 2.5 Flash — no reliance on browser Speech API
- **Text input** as an alternative — type queries directly in the chat bar
- **ElevenLabs Multilingual TTS** — every response is spoken aloud in the user's language
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

## Product Deletion

- **Voice-activated deletion** — "delete the leather wallet", "remove the snapback hat"
- Fuzzy product matching — handles plurals and partial names
- Completes full CRUD lifecycle: Create, Read, Update, Delete
- Confirmation card with product name and "Removed from your store" status

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

## Inventory Management

- **Update stock by voice** — "set hoodie stock to 200", "restock the mug to 500"
- **Check inventory** — "check my inventory", "what's in stock?"
- Inventory summary dashboard showing:
  - Total stock across all products
  - Per-product stock levels
  - Low stock alerts (≤10 units)
  - Out of stock items
- Updates all variants at the specified location

## Store Analytics

- **Voice analytics** — "how are my sales?", "what's my best seller?"
- Pulls real data from Shopify Admin API (orders, products)
- Dashboard card showing:
  - Total revenue & order count
  - Today's revenue & order count
  - Total products listed
  - Best selling product

## Order Fulfillment

- **Voice fulfillment** — "fulfill my latest order", "ship order #1001"
- Finds unfulfilled orders and processes fulfillment via Admin API
- Can target a specific order by number or default to the latest
- Confirmation card with order number, customer name, item count, and total

## Customer Lookup

- **Voice customer data** — "how many customers do I have?", "show me my customers"
- Fetches customer data from Shopify Admin API
- Customer list card showing:
  - Total customer count
  - Recent customers with name, email, order count, and total spent

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
  - *"Welcome Back! You searched for hoodies and added the Test Hoodie ($60) to your cart."*
- Memory is stored at the assistant level, so it persists across all sessions
- "Powered by Backboard.io Memory" badge shown on the welcome screen

## Multi-Language Support

- **Speak in any language** — Gemini detects the language automatically
- Search queries are internally translated to English for Shopify, but all responses come back in the user's language
- Supported for all features: search, product creation, price editing, analytics, discount codes
- **ElevenLabs multilingual TTS** — responses are spoken aloud in the detected language
- Examples:
  - French: "Montre-moi des chandails" → responds in French with product results
  - Spanish: "¿Cómo van mis ventas?" → analytics response in Spanish

## Context-Aware Conversations

- Gemini uses conversation history to resolve ambiguous references
- **Pronoun resolution** — "change its price" resolves to the last discussed product
- **Demonstrative resolution** — "put a discount on that hoodie" resolves to the hoodie from earlier
- **Contextual commands** — "delete it" after creating a product deletes what was just created
- Uses last shown products list for accurate product matching
- 10-message conversation window for deep context understanding

## Bulk Price Operations

- **Bulk percentage off** — "set all products to 10% off"
- **Bulk price increase** — "increase all prices by $5"
- **Bulk percentage increase** — "increase all prices by 20%"
- **Bulk flat decrease** — "decrease all prices by $3"
- **Bulk set price** — "set all products to $25"
- Updates every variant of every product in the store
- Summary card showing each product's old and new price

## Product Comparison

- **Side-by-side comparison** — "compare the hoodie and the mug"
- Fetches both products and displays them in a two-column layout
- Shows: price, stock, type, variant count, description, and product image
- Fuzzy product matching — handles partial names and plurals

## Description-Based Product Search

- **Semantic matching** — "find me something like a cozy warm sweater"
- Describe what you want in words instead of exact product names
- Gemini interprets the description and searches Shopify for matching products
- Works in any language — descriptions are internally translated to English

## Reorder Suggestions

- **Smart restock recommendations** — "what should I restock?"
- Analyzes all product inventory levels
- Color-coded urgency dashboard:
  - **Out of Stock** (red) — zero units
  - **Low Stock** (amber) — 1-10 units
  - **Watch** (yellow) — 11-20 units
- Sorted by urgency — most critical items first

## Voice-Powered Collections

- **Create collections by voice** — "create a Summer Sale collection with hoodies and t-shirts"
- Creates a custom collection via Shopify Admin API
- Automatically matches and adds specified products using fuzzy matching
- Confirmation card shows collection name and list of added products

## Conversation Export

- **Copy/share button** in the header — copies the full conversation to clipboard
- One-click export of the entire chat history
- "Copied!" feedback on success
- Available whenever there are messages in the conversation

## "Hey Ivy" Wake Word

- **Hands-free activation** — say "Hey Ivy" to trigger voice input without tapping the mic
- Toggle on/off from the header with a dedicated button
- Uses continuous low-power speech recognition in the background
- If you say "Hey Ivy, show me hoodies" — it detects the wake word and processes the command
- Auto-restarts listening after each command
- Works alongside the manual mic tap

## Intent Recognition

Gemini 2.5 Flash classifies every user message into one of 17 actions:

| Intent | Trigger Examples |
|--------|-----------------|
| `search` | "show me hoodies", "what products do you have?" |
| `create` | "add a leather wallet for $49", "create a new t-shirt" |
| `add_to_cart` | "add the hoodie to my cart", "I'll take the mug" |
| `edit_price` | "change hoodie price to $60", "make the mug $15" |
| `update_inventory` | "set hoodie stock to 200", "restock the mug" |
| `check_inventory` | "check my inventory", "what's in stock?" |
| `delete_product` | "delete the wallet", "remove the snapback hat" |
| `analytics` | "how are sales?", "what's my revenue?" |
| `fulfill_order` | "fulfill my latest order", "ship order #1001" |
| `customers` | "how many customers?", "show me my customers" |
| `create_discount` | "create a 20% off code called SAVE20" |
| `bulk_price` | "set all products to 10% off", "increase all prices by $5" |
| `compare` | "compare the hoodie and the mug" |
| `describe_search` | "find me something like a red winter jacket" |
| `restock` | "what should I restock?", "reorder suggestions" |
| `create_collection` | "create a Summer Sale collection with hoodies and shirts" |

## UI / UX

- Warm Shopify-esque light theme with animated floating orbs, dot grid, and shimmer effects
- Framer Motion animations on all transitions
- Responsive layout — works on desktop and mobile
- Conversational chat interface with user/assistant bubbles
- Rich response cards: product grids, analytics dashboards, inventory summaries, customer lists, discount badges, fulfillment confirmations, price and inventory update cards, product deletion confirmations, bulk price tables, side-by-side comparisons, restock urgency dashboards, collection creation cards
- Quick-start prompt buttons on the welcome screen (updated to showcase new features)
- "Hey Ivy" wake word toggle button in the header
- Conversation export/share button in the header
- Personalized "Welcome Back" screen with shopper memory summary
- Persistent bottom input bar during conversation
