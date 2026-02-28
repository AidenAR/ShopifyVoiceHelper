'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, MicState, ChatResponse } from '@/types';
import VoiceMic from '@/components/VoiceMic';
import ConversationPanel from '@/components/ConversationPanel';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [micState, setMicState] = useState<MicState>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [textInput, setTextInput] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idCounter = useRef(0);

  const genId = () => `msg-${++idCounter.current}-${Date.now()}`;

  const playTTS = useCallback(async (text: string) => {
    try {
      setMicState('speaking');
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        console.error('TTS request failed');
        setMicState('idle');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setMicState('idle');
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setMicState('idle');
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error('TTS playback error:', err);
      setMicState('idle');
    }
  }, []);

  const handleTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    setMicState('processing');
    setInterimText('');
    setIsLoading(true);

    const userMessage: Message = {
      id: genId(),
      role: 'user',
      content: transcript,
    };

    setMessages(prev => [...prev, userMessage]);

    const history = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, history }),
      });

      const data: ChatResponse = await res.json();

      const assistantMessage: Message = {
        id: genId(),
        role: 'assistant',
        content: data.message,
        products: data.products,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      await playTTS(data.message);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: genId(),
        role: 'assistant',
        content: "Sorry, I couldn't process that. Try again?",
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      setMicState('idle');
    }
  }, [messages, playTTS]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading || micState === 'processing') return;
    const text = textInput.trim();
    setTextInput('');
    handleTranscript(text);
  };

  const hasMessages = messages.length > 0;

  const statusText = micState === 'idle'
    ? (hasMessages ? 'Tap mic or type below' : 'Tap mic or type below')
    : micState === 'listening'
    ? 'Listening — tap again to send'
    : micState === 'processing'
    ? 'Finding products...'
    : 'Speaking...';

  return (
    <div className="gradient-mesh h-screen flex flex-col relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="ambient-orb absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-600/[0.04] blur-3xl" />
        <div className="ambient-orb absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-600/[0.03] blur-3xl [animation-delay:3s]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-100">ShopifyVoice</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">AI Shopping Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            micState === 'idle' ? 'bg-slate-600' :
            micState === 'listening' ? 'bg-violet-400 animate-pulse' :
            micState === 'processing' ? 'bg-cyan-400 animate-pulse' :
            'bg-emerald-400 animate-pulse'
          }`} />
          <span className="text-[11px] text-slate-500 font-medium">
            {micState === 'idle' ? 'Ready' :
             micState === 'listening' ? 'Listening' :
             micState === 'processing' ? 'Thinking' :
             'Speaking'}
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            /* Welcome state */
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center px-6 gap-6"
            >
              <div className="text-center space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl sm:text-5xl font-bold tracking-tight gradient-text"
                >
                  Shop by Voice
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-base text-slate-500 max-w-sm mx-auto leading-relaxed"
                >
                  Speak or type what you&apos;re looking for.
                  I&apos;ll find the perfect products for you.
                </motion.p>
              </div>

              {/* Mic + text input row */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-5"
              >
                <VoiceMic
                  onTranscript={handleTranscript}
                  onInterim={setInterimText}
                  state={micState}
                  onStateChange={setMicState}
                />

                {/* Live transcript */}
                {interimText && (
                  <p className="text-sm text-slate-300 text-center max-w-sm px-4 italic">
                    &ldquo;{interimText}&rdquo;
                  </p>
                )}

                {/* Text input */}
                <form onSubmit={handleTextSubmit} className="w-full max-w-md">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus-within:border-violet-500/30 transition-colors">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Or type here... &quot;show me a hoodie&quot;"
                      disabled={isLoading || micState === 'processing'}
                      className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim() || isLoading || micState === 'processing'}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-slate-600"
              >
                {statusText}
              </motion.p>

              {/* Example prompts */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap justify-center gap-2 max-w-md"
              >
                {[
                  'Show me a hoodie',
                  'What do you have under $20?',
                  'I need a mug',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setTextInput(''); handleTranscript(prompt); }}
                    disabled={isLoading || micState === 'processing'}
                    className="text-[11px] px-3 py-1.5 rounded-full border border-white/[0.06] text-slate-500 bg-white/[0.02] hover:bg-white/[0.06] hover:text-slate-300 transition-colors cursor-pointer disabled:opacity-30"
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            /* Conversation state */
            <motion.div
              key="conversation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <ConversationPanel messages={messages} isLoading={isLoading} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom input bar (when in conversation) */}
      {hasMessages && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 px-4 pb-5 pt-3 border-t border-white/[0.04]"
          style={{
            background: 'linear-gradient(to top, var(--background) 60%, transparent)',
          }}
        >
          <form onSubmit={handleTextSubmit} className="flex items-center gap-3 max-w-2xl mx-auto">
            <VoiceMic
              onTranscript={handleTranscript}
              onInterim={setInterimText}
              state={micState}
              onStateChange={setMicState}
            />
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus-within:border-violet-500/30 transition-colors">
              <input
                type="text"
                value={interimText || textInput}
                onChange={(e) => { setTextInput(e.target.value); setInterimText(''); }}
                placeholder="Type or speak..."
                disabled={isLoading || micState === 'processing'}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={(!textInput.trim() && !interimText.trim()) || isLoading || micState === 'processing'}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </form>
          {micState === 'listening' && (
            <p className="text-[10px] text-slate-600 text-center mt-2">Listening — tap mic to stop</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
