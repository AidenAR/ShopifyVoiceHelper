import { BackboardClient } from 'backboard-sdk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY!;
const STATE_FILE = join(process.cwd(), '.backboard-state.json');

const SYSTEM_PROMPT = `You are a shopping memory assistant for a Shopify voice commerce app called ShopifyVoice.
Your job is to remember everything about the shopper's behavior:
- What products they searched for
- What they added to cart
- What products they created in the store
- Price changes they made
- Discount codes they created
- Their style preferences (inferred from searches and purchases)

When asked what you remember, give a warm, concise summary of their shopping history and preferences.
Keep responses under 50 words. Be specific about product names, prices, and categories.
If you don't remember anything, just say so briefly.`;

function getClient() {
  if (!BACKBOARD_API_KEY) throw new Error('Backboard API key not configured');
  return new BackboardClient({ apiKey: BACKBOARD_API_KEY });
}

function loadState(): { assistantId?: string; threadId?: string } {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveState(state: { assistantId?: string; threadId?: string }) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function ensureAssistant(client: BackboardClient): Promise<string> {
  const state = loadState();
  if (state.assistantId) {
    try {
      await client.getAssistant(state.assistantId);
      return state.assistantId;
    } catch {}
  }

  const assistant = await client.createAssistant({
    name: 'ShopifyVoice Shopping Memory',
    description: 'Remembers shopper behavior across sessions for personalized experience',
    system_prompt: SYSTEM_PROMPT,
  });

  saveState({ ...state, assistantId: assistant.assistantId });
  return assistant.assistantId;
}

async function ensureThread(client: BackboardClient, assistantId: string): Promise<string> {
  const state = loadState();
  if (state.threadId) {
    try {
      await client.getThread(state.threadId);
      return state.threadId;
    } catch {}
  }

  const thread = await client.createThread(assistantId);
  saveState({ ...state, threadId: thread.threadId });
  return thread.threadId;
}

export async function saveShoppingEvent(event: string): Promise<void> {
  try {
    const client = getClient();
    const assistantId = await ensureAssistant(client);
    const threadId = await ensureThread(client, assistantId);

    await client.addMessage(threadId, {
      content: `[Shopping Event] ${event}`,
      memory: 'Auto',
      stream: false,
    });
  } catch (err) {
    console.error('Backboard save error:', err);
  }
}

export async function getShopperMemory(): Promise<string | null> {
  try {
    const client = getClient();
    const assistantId = await ensureAssistant(client);
    const threadId = await ensureThread(client, assistantId);

    const response = await client.addMessage(threadId, {
      content: 'What do you remember about this shopper? Summarize their shopping history, preferences, and recent activity. If nothing, just say "new shopper".',
      memory: 'Auto',
      stream: false,
    });

    const content = (response as any).content?.trim();
    if (!content || content.toLowerCase().includes('new shopper') || content.toLowerCase().includes("don't have any") || content.toLowerCase().includes('no information')) {
      return null;
    }
    return content;
  } catch (err) {
    console.error('Backboard memory fetch error:', err);
    return null;
  }
}
