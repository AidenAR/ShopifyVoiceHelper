'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, MicState, ChatResponse, Product } from '@/types';
import VoiceMic from '@/components/VoiceMic';
import ConversationPanel from '@/components/ConversationPanel';

interface CartState {
  cartId: string;
  checkoutUrl: string;
  totalQuantity: number;
  totalAmount: string;
  currency: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [micState, setMicState] = useState<MicState>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [cart, setCart] = useState<CartState | null>(null);
  const [shopperMemory, setShopperMemory] = useState<string | null>(null);
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const wakeWordRef = useRef<any>(null);
  const lastProductsRef = useRef<{ title: string; variantId: string }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idCounter = useRef(0);

  const genId = () => `msg-${++idCounter.current}-${Date.now()}`;

  useEffect(() => {
    fetch('/api/memory')
      .then(r => r.json())
      .then(data => setShopperMemory(data.memory))
      .catch(() => {})
      .finally(() => setMemoryLoading(false));
  }, []);

  const playTTS = useCallback(async (text: string) => {
    try {
      setMicState('speaking');
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) { setMicState('idle'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setMicState('idle'); URL.revokeObjectURL(url); audioRef.current = null; };
      audio.onerror = () => { setMicState('idle'); URL.revokeObjectURL(url); audioRef.current = null; };
      await audio.play();
    } catch (err) {
      console.error('TTS playback error:', err);
      setMicState('idle');
    }
  }, []);

  const handleAddToCart = useCallback(async (product: Product) => {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId: product.variantId, cartId: cart?.cartId || null }),
    });
    if (!res.ok) throw new Error('Cart failed');
    const data = await res.json();
    setCart({ cartId: data.cartId, checkoutUrl: data.checkoutUrl, totalQuantity: data.totalQuantity, totalAmount: data.totalAmount, currency: data.currency });
  }, [cart]);

  const handleTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    setMicState('processing');
    setInterimText('');
    setIsLoading(true);

    const userMessage: Message = { id: genId(), role: 'user', content: transcript };
    setMessages(prev => [...prev, userMessage]);

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, history, lastProducts: lastProductsRef.current }),
      });
      const data: ChatResponse = await res.json();

      if (data.products?.length > 0) {
        lastProductsRef.current = data.products.map(p => ({ title: p.title, variantId: p.variantId }));
      }

      if (data.addedToCart?.variantId) {
        try {
          const cartRes = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variantId: data.addedToCart.variantId, cartId: cart?.cartId || null }),
          });
          if (cartRes.ok) {
            const cd = await cartRes.json();
            setCart({ cartId: cd.cartId, checkoutUrl: cd.checkoutUrl, totalQuantity: cd.totalQuantity, totalAmount: cd.totalAmount, currency: cd.currency });
          }
        } catch (e) { console.error('Voice cart error:', e); }
      }

      const assistantMessage: Message = {
        id: genId(), role: 'assistant', content: data.message,
        products: data.products, created: data.created, priceUpdate: data.priceUpdate,
        analytics: data.analytics, discount: data.discount, addedToCart: data.addedToCart,
        inventoryUpdate: data.inventoryUpdate, inventorySummary: data.inventorySummary,
        deletedProduct: data.deletedProduct, fulfillment: data.fulfillment, customers: data.customers,
        bulkPrice: data.bulkPrice, comparison: data.comparison, restock: data.restock, collection: data.collection,
        orderStatus: data.orderStatus, refund: data.refund, seo: data.seo, socialCaption: data.socialCaption,
        pricingSuggestion: data.pricingSuggestion, revenueForecast: data.revenueForecast, adCopy: data.adCopy,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
      await playTTS(data.message);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { id: genId(), role: 'assistant', content: "Sorry, I couldn't process that. Try again?" }]);
      setIsLoading(false);
      setMicState('idle');
    }
  }, [messages, playTTS, cart]);

  useEffect(() => {
    if (!wakeWordEnabled) {
      if (wakeWordRef.current) { wakeWordRef.current.abort = true; wakeWordRef.current = null; }
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const startWake = () => {
      if (!wakeWordEnabled) return;
      const r = new SR(); r.continuous = true; r.interimResults = true; r.lang = 'en-US';
      const ref = { abort: false }; wakeWordRef.current = ref;
      r.onresult = (e: any) => {
        const t = e.results[e.results.length - 1][0]?.transcript?.toLowerCase() || '';
        if (t.includes('hey ivy') || t.includes('hey shopify') || t.includes('hey shop')) {
          r.stop();
          const cmd = t.replace(/hey ivy|hey shopify|hey shop/i, '').trim();
          if (cmd.length > 3) {
            handleTranscript(cmd);
          } else {
            // No command — Ivy greets
            playTTS("Hey! I'm Ivy, what can I help you with?");
            setMicState('idle');
          }
        }
      };
      r.onend = () => { if (!ref.abort && wakeWordEnabled) setTimeout(startWake, 300); };
      r.onerror = () => { if (!ref.abort && wakeWordEnabled) setTimeout(startWake, 1000); };
      try { r.start(); } catch {}
    };

    if (micState === 'idle') startWake();
    return () => { if (wakeWordRef.current) wakeWordRef.current.abort = true; };
  }, [wakeWordEnabled, micState, handleTranscript, playTTS]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading || micState === 'processing') return;
    const text = textInput.trim();
    setTextInput('');
    handleTranscript(text);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-[#faf9f6]">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-3 bg-white border-b border-[#e8e6e1]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#008060] flex items-center justify-center shadow-md shadow-[#008060]/15">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-[#1a1a1a]">Ivy</h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#999590] font-medium">by ShopifyVoice</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMessages && (
            <button
              onClick={() => {
                const text = messages.map(m => `${m.role === 'user' ? 'You' : 'Ivy'}: ${m.content}`).join('\n\n');
                navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#faf9f6] border border-[#e8e6e1] hover:border-[#008060]/30 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#6b6b6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
              <span className="text-[10px] text-[#6b6b6b] font-medium">{copied ? 'Copied!' : 'Share'}</span>
            </button>
          )}

          <button
            onClick={() => setWakeWordEnabled(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
              wakeWordEnabled
                ? 'bg-[#e8f5e9] border-[#008060]/30 text-[#008060]'
                : 'bg-[#faf9f6] border-[#e8e6e1] text-[#999590] hover:border-[#008060]/30'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
            <span className="text-[10px] font-medium">{wakeWordEnabled ? '"Hey Ivy" On' : 'Hey Ivy'}</span>
          </button>

          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
            micState === 'idle' ? 'bg-[#faf9f6] border-[#e8e6e1]' :
            micState === 'listening' ? 'bg-[#e8f5e9] border-[#008060]/30' :
            micState === 'processing' ? 'bg-[#5C6AC4]/5 border-[#5C6AC4]/20' :
            'bg-[#e8f5e9] border-[#008060]/30'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              micState === 'idle' ? 'bg-[#d4d1cb]' :
              micState === 'listening' ? 'bg-[#008060] animate-pulse' :
              micState === 'processing' ? 'bg-[#5C6AC4] animate-pulse' :
              'bg-[#008060] animate-pulse'
            }`} />
            <span className={`text-[10px] font-medium ${
              micState === 'idle' ? 'text-[#999590]' :
              micState === 'listening' ? 'text-[#008060]' :
              micState === 'processing' ? 'text-[#5C6AC4]' :
              'text-[#008060]'
            }`}>
              {micState === 'idle' ? 'Ready' : micState === 'listening' ? 'Listening' : micState === 'processing' ? 'Thinking' : 'Speaking'}
            </span>
          </div>

          {cart && (
            <motion.a
              href={cart.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#008060] hover:bg-[#006e52] transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="text-xs font-semibold text-white">{cart.totalQuantity} — ${parseFloat(cart.totalAmount).toFixed(2)}</span>
            </motion.a>
          )}
        </div>
      </header>

      {/* Main */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center px-6 gap-6 relative overflow-hidden"
            >
              {/* Animated background layer */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="dot-grid absolute inset-0 opacity-60" />
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
                <div className="orb orb-4" />
                <div className="shimmer-line absolute top-[30%] left-0 right-0 h-[1px]" />
                <div className="shimmer-line absolute top-[65%] left-0 right-0 h-[1px]" style={{ animationDelay: '4s' }} />
              </div>

              {/* Ivy avatar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 180, damping: 14 }}
                className="float-animation relative z-10"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-[#008060]/20 avatar-glow scale-125" />
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#008060] via-[#009e73] to-[#00a47c] flex items-center justify-center shadow-2xl shadow-[#008060]/25 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 400 }}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-[#faf9f6] flex items-center justify-center shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#008060]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
                  </motion.div>
                </div>
              </motion.div>

              <div className="text-center space-y-3 max-w-lg relative z-10">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="text-3xl sm:text-4xl font-bold tracking-tight gradient-text-shopify"
                >
                  {shopperMemory ? 'Welcome back!' : 'Hey, I\'m Ivy'}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.5 }}
                  className="text-[15px] text-[#6b6b6b] leading-relaxed"
                >
                  {memoryLoading ? (
                    'Loading your preferences...'
                  ) : shopperMemory ? (
                    shopperMemory
                  ) : (
                    <>
                      I&apos;m your AI store assistant. Tell me what you need — update prices,
                      check inventory, create products, run analytics — I&apos;ll handle it.
                    </>
                  )}
                </motion.p>
                {shopperMemory && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-[#e8e6e1] shadow-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#008060] animate-pulse" />
                    <span className="text-[11px] text-[#6b6b6b] font-medium">Powered by Backboard.io Memory</span>
                  </motion.div>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-5 relative z-10"
              >
                <VoiceMic
                  onTranscript={handleTranscript}
                  onInterim={setInterimText}
                  state={micState}
                  onStateChange={setMicState}
                />

                {interimText && (
                  <p className="text-sm text-[#1a1a1a] text-center max-w-sm px-4 italic">&ldquo;{interimText}&rdquo;</p>
                )}

                <form onSubmit={handleTextSubmit} className="w-full max-w-md">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-[#e8e6e1] focus-within:border-[#008060] focus-within:bg-white focus-within:shadow-sm transition-all">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder='Or type here... "show me hoodies"'
                      disabled={isLoading || micState === 'processing'}
                      className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#999590] outline-none disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim() || isLoading || micState === 'processing'}
                      className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#008060] text-white hover:bg-[#006e52] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="flex flex-wrap justify-center gap-2 max-w-xl relative z-10"
              >
                {[
                  { label: 'Show me hoodies', icon: '🔍' },
                  { label: 'Compare hoodie and mug', icon: '⚖️' },
                  { label: 'Set all products to 10% off', icon: '💰' },
                  { label: 'What should I restock?', icon: '📦' },
                  { label: 'How are my sales?', icon: '📊' },
                  { label: 'Create a Summer Sale collection', icon: '🏷️' },
                ].map(({ label, icon }, i) => (
                  <motion.button
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.06 }}
                    onClick={() => { setTextInput(''); handleTranscript(label); }}
                    disabled={isLoading || micState === 'processing'}
                    className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-lg border border-[#e8e6e1] text-[#6b6b6b] bg-white/80 backdrop-blur-sm hover:border-[#008060]/40 hover:text-[#1a1a1a] hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-30"
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="conversation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <ConversationPanel messages={messages} isLoading={isLoading} onAddToCart={handleAddToCart} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      {hasMessages && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 px-4 pb-5 pt-3 bg-white border-t border-[#e8e6e1]"
        >
          <form onSubmit={handleTextSubmit} className="flex items-center gap-3 max-w-2xl mx-auto">
            <VoiceMic
              onTranscript={handleTranscript}
              onInterim={setInterimText}
              state={micState}
              onStateChange={setMicState}
            />
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#e8e6e1] focus-within:border-[#008060] focus-within:bg-white transition-all">
              <input
                type="text"
                value={interimText || textInput}
                onChange={(e) => { setTextInput(e.target.value); setInterimText(''); }}
                placeholder="Type or speak..."
                disabled={isLoading || micState === 'processing'}
                className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#999590] outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={(!textInput.trim() && !interimText.trim()) || isLoading || micState === 'processing'}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#008060] text-white hover:bg-[#006e52] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Send
              </button>
            </div>
          </form>
          {micState === 'listening' && (
            <p className="text-[10px] text-[#999590] text-center mt-2">Listening — tap mic to stop</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
