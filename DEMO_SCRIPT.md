# Ivy — Demo Script (4-5 minutes)

> **Hackathon:** ListenHacks — Build the Future of Voice & Audio
> **Team Project:** Ivy — Voice-Powered Shopify Store Management

---

## Opening (30s)

> "Meet Ivy — she's an AI store assistant that lets Shopify merchants run their entire store with just their voice. No clicking through dashboards, no typing — just talk."

**Show:** The welcome screen with the animated background, Ivy avatar, and Backboard.io memory banner ("Welcome back!").

> "Ivy already remembers me from earlier — that's powered by Backboard.io cross-session memory."

---

## 1. Product Search + Multi-Language (30s)

**Say or type:** `"Show me hoodies"`

> "Natural language product search — Ivy understands what I want, queries Shopify's Storefront API, and shows results as product cards."

**Then say:** `"Montre-moi des chandails"` *(French)*

> "Multi-language — powered by Gemini and ElevenLabs multilingual TTS. She responds in whatever language you speak."

---

## 2. Add to Cart → Real Checkout (20s)

**Say:** `"Add the hoodie to my cart"`

> "That's a real Shopify cart — see the cart badge update? If I click it, it goes straight to Shopify checkout. This isn't a mockup."

---

## 3. Create a Product with AI Image (40s)

**Say:** `"Create a vintage leather backpack for $89"`

> "Ivy parsed the title, description, and price from my voice. Now she's generating a product image using Gemini's image generation model and uploading it to Shopify. The product is now live in the store — with an AI-generated hero image."

**Show:** The product card with the "AI Generated" badge.

---

## 4. Price Management (20s)

**Say:** `"Change the backpack price to $99"`

> "Instant price update across all variants via the Admin API."

**Then say:** `"Set all products to 10% off"`

> "Bulk operations — she just updated every product in the store. Here's the summary."

---

## 5. Inventory + Restock Suggestions (25s)

**Say:** `"What should I restock?"`

> "She analyzes inventory levels across the entire store and gives color-coded urgency — out of stock in red, low stock in amber, watch items in yellow."

**Say:** `"Set hoodie stock to 500"`

> "Done — inventory updated."

---

## 6. Analytics + Customers (20s)

**Say:** `"How are my sales?"`

> "Real-time analytics pulled from Shopify — total revenue, orders today, best seller."

**Say:** `"How many customers do I have?"`

> "Customer lookup with order counts and spend."

---

## 7. Smart Operations (30s)

**Say:** `"Compare the hoodie and the mug"`

> "Side-by-side product comparison — price, stock, type, variants, everything."

**Say:** `"Create a Spring Sale collection with the hoodie and backpack"`

> "Just created a custom collection in Shopify and added the products. All by voice."

---

## 8. Discount Codes (15s)

**Say:** `"Create a 15% off code called LISTENHACKS"`

> "Real Shopify discount code — usable at checkout right now."

---

## 9. Context Awareness (20s)

**Say:** `"Delete it"`

> "She knows 'it' refers to the backpack we just created. That's Gemini maintaining conversation context across 10 messages."

---

## 10. Wake Word (15s)

**Toggle on "Hey Ivy" in the header.**

**Say:** `"Hey Ivy, how are my sales?"`

> "Hands-free wake word — no tapping. Powered by the Web Speech API running continuous background recognition."

---

## Closing (20s)

> "So that's Ivy — 17 voice intents, real Shopify integration, AI image generation, multi-language support, cross-session memory, and a wake word. Built with Next.js, Gemini, ElevenLabs, Backboard.io, and Shopify's APIs. Everything you saw was live — real store, real data, real checkout."

---

## Tech Stack Slide (for Q&A)

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router), Tailwind CSS 4, Framer Motion |
| NLU + Intent | Google Gemini 2.5 Flash |
| Image Generation | Gemini 2.0 Flash Image Generation |
| Text-to-Speech | ElevenLabs Multilingual v2 |
| Memory | Backboard.io |
| Store APIs | Shopify Storefront API (GraphQL) + Admin API (REST) |
| Wake Word | Web Speech API (SpeechRecognition) |
| Hosting | Railway |

---

## Tips

- If voice isn't working (network error), use the text input — it works identically.
- Have some products already in the store so search demos work instantly.
- The "Welcome back" memory only appears if you've used the app before in the same session context.
- Keep energy up — the voice responses from ElevenLabs are fast and impressive live.
