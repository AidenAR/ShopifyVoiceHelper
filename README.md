# ShopifyVoice — AI Voice Shopping Assistant

> Built at **ListenHacks 2025** — an invite-only hackday exploring the future of voice, audio, and AI.

ShopifyVoice is a voice-first Shopify store management tool. Speak naturally to search products, create listings with AI-generated images, manage prices and inventory, view analytics, create discount codes, fulfill orders, look up customers, compare products side by side, run bulk price operations, get restock suggestions, create collections, and add items to a real Shopify cart — all hands-free with "Hey Ivy" wake word, in any language.

## Demo

Tap the mic (or type) and say things like:

- *"Show me a hoodie"*
- *"Add a vintage denim jacket for $89"* — creates the product **and** generates a product photo with AI
- *"Change the price of all hoodies to $60"*
- *"Set hoodie stock to 200"*
- *"Delete the leather wallet"*
- *"How are my sales?"*
- *"How many customers do I have?"*
- *"Fulfill my latest order"*
- *"Create a 20% off code called LISTENHACKS"*
- *"Put a discount on that hoodie we just talked about"* — understands context
- *"Add the hoodie to my cart"*
- *"Compare the hoodie and the mug"* — side-by-side comparison
- *"Set all products to 10% off"* — bulk price operations
- *"What should I restock?"* — smart reorder suggestions
- *"Find me something like a cozy warm sweater"* — description-based search
- *"Create a Summer Sale collection with hoodies and t-shirts"* — voice collections
- *"Hey Ivy, show me hoodies"* — hands-free wake word activation
- *"Montre-moi des chandails"* — works in French, Spanish, and 25+ other languages

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + Framer Motion |
| Voice → Text | Google Gemini 2.5 Flash (audio transcription) |
| NLU / Intent | Google Gemini 2.5 Flash (17 intents, context-aware) |
| Image Generation | Google Gemini 2.0 Flash Image Generation |
| Text → Speech | ElevenLabs Multilingual v2 TTS |
| Persistent Memory | Backboard.io (cross-session shopper memory) |
| Store API | Shopify Storefront API (GraphQL) + Admin API (REST) |
| Auth | Shopify OAuth 2.0 for Admin scopes |

## Architecture

```
Browser (mic) → MediaRecorder → /api/transcribe (Gemini STT)
                                        ↓
                                  /api/chat (Gemini NLU — 17 intents)
                          ↓         ↓          ↓          ↓
                    Storefront   Admin API   Gemini      Backboard.io
                    (search,     (CRUD,      (product    (persistent
                     cart)        inventory,   images)     memory)
                                  orders,
                                  customers)
                          ↓
                     /api/tts (ElevenLabs Multilingual) → Audio playback
```

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd ShopifyVoiceHelper
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=your_storefront_token
SHOPIFY_CLIENT_ID=your_app_client_id
SHOPIFY_CLIENT_SECRET=your_app_client_secret
SHOPIFY_ADMIN_TOKEN=your_admin_api_token
BACKBOARD_API_KEY=your_backboard_api_key
```

### 3. Shopify App Scopes

Your Shopify app needs these scopes:

```
read_products, write_products, read_orders, read_analytics,
read_price_rules, write_price_rules, read_customers,
write_inventory, read_locations, write_fulfillments, read_fulfillments
```

### 4. Shopify Admin token (OAuth)

1. Visit `http://localhost:3000/api/auth/install` to start the OAuth flow
2. Authorize the app in your Shopify store
3. The token is automatically saved to `.env.local`

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main UI — voice + text input, conversation view
│   └── api/
│       ├── chat/route.ts     # Intent parsing → Shopify actions → response
│       ├── tts/route.ts      # ElevenLabs text-to-speech proxy
│       ├── transcribe/route.ts  # Gemini audio transcription
│       ├── cart/route.ts     # Shopify Storefront cart mutations
│       ├── memory/route.ts   # Backboard.io persistent memory
│       └── auth/             # Shopify OAuth install + callback
├── components/
│   ├── VoiceMic.tsx          # MediaRecorder mic with visual states
│   ├── ChatBubble.tsx        # Message bubbles + rich cards
│   ├── ConversationPanel.tsx # Scrollable message list
│   ├── ProductCard.tsx       # Product display with Add to Cart
│   └── ProductGrid.tsx       # Animated product grid
├── lib/
│   ├── gemini.ts             # Intent parsing + response generation (17 intents)
│   ├── shopify.ts            # Storefront API client (search, cart)
│   ├── shopify-admin.ts      # Admin API client (full CRUD, inventory, orders, customers)
│   ├── backboard.ts          # Backboard.io persistent memory client
│   └── elevenlabs.ts         # TTS client (multilingual)
└── types/
    └── index.ts              # Shared TypeScript interfaces
```

## Sponsors & APIs

- **Google Gemini** — NLU, speech-to-text, AI image generation
- **ElevenLabs** — multilingual text-to-speech
- **Shopify** — Storefront + Admin APIs (full store management)
- **Backboard.io** — persistent cross-session shopper memory

## Team

Built by Aiden at ListenHacks, February 2025.

## License

MIT
