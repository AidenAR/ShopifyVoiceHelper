# ShopifyVoice — AI Voice Shopping Assistant

> Built at **ListenHacks 2025** — an invite-only hackday exploring the future of voice, audio, and AI.

ShopifyVoice is a voice-first Shopify store management tool. Speak naturally to search products, create new listings with AI-generated images, manage prices, view analytics, create discount codes, and add items to a real Shopify cart — all hands-free.

## Demo

Tap the mic (or type) and say things like:

- *"Show me a hoodie"*
- *"Add a vintage denim jacket for $89"* — creates the product **and** generates a product photo with AI
- *"Change the price of all hoodies to $60"*
- *"How are my sales?"*
- *"Create a 20% off code called LISTENHACKS"*
- *"Add the hoodie to my cart"*
- *"Montre-moi des chandails"* — works in French, Spanish, and 25+ other languages

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + Framer Motion |
| Voice → Text | Google Gemini 2.5 Flash (audio transcription) |
| NLU / Intent | Google Gemini 2.5 Flash |
| Image Generation | Google Gemini 2.0 Flash Image Generation |
| Text → Speech | ElevenLabs Streaming TTS |
| Persistent Memory | Backboard.io (cross-session shopper memory) |
| Store API | Shopify Storefront API (GraphQL) + Admin API (REST) |
| Auth | Shopify OAuth 2.0 for Admin scopes |

## Architecture

```
Browser (mic) → MediaRecorder → /api/transcribe (Gemini STT)
                                        ↓
                                  /api/chat (Gemini NLU)
                                   ↓          ↓          ↓          ↓
                             Storefront    Admin API   Gemini      Backboard.io
                             (search)      (CRUD)      (images)    (memory)
                                   ↓                                    ↓
                              /api/tts (ElevenLabs)        "Welcome back! You
                                   ↓                        were looking at hoodies"
                             Audio playback
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

### 3. Shopify Admin token (OAuth)

If you don't have an Admin API token yet:

1. Visit `http://localhost:3000/api/auth/install` to start the OAuth flow
2. Authorize the app in your Shopify store
3. The token is automatically saved to `.env.local`

### 4. Run

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
│       ├── memory/route.ts  # Backboard.io persistent memory
│       └── auth/             # Shopify OAuth install + callback
├── components/
│   ├── VoiceMic.tsx          # MediaRecorder mic with visual states
│   ├── ChatBubble.tsx        # Message bubbles + rich cards (products, analytics, etc.)
│   ├── ConversationPanel.tsx # Scrollable message list
│   ├── ProductCard.tsx       # Product display with Add to Cart
│   └── ProductGrid.tsx       # Animated product grid
├── lib/
│   ├── gemini.ts             # Intent parsing + response generation
│   ├── shopify.ts            # Storefront API client (search, cart)
│   ├── shopify-admin.ts      # Admin API client (CRUD, analytics, discounts, image gen)
│   ├── backboard.ts          # Backboard.io persistent memory client
│   └── elevenlabs.ts         # TTS client
└── types/
    └── index.ts              # Shared TypeScript interfaces
```

## Sponsors & APIs

- **Google Gemini** — NLU, speech-to-text, AI image generation
- **ElevenLabs** — natural text-to-speech
- **Shopify** — Storefront + Admin APIs
- **Backboard.io** — persistent cross-session shopper memory

## Team

Built by Aiden at ListenHacks, February 2025.

## License

MIT
