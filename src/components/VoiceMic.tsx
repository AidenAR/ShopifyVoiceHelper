'use client';

import { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicState } from '@/types';

interface VoiceMicProps {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  state: MicState;
  onStateChange: (state: MicState) => void;
}

export default function VoiceMic({ onTranscript, onInterim, state, onStateChange }: VoiceMicProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        if (audioBlob.size < 1000) { onInterim?.(''); onStateChange('idle'); return; }
        onStateChange('processing');
        onInterim?.('Transcribing...');
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
          const data = await res.json();
          onInterim?.('');
          if (data.transcript?.trim()) { onTranscript(data.transcript.trim()); } else { onStateChange('idle'); }
        } catch (err) {
          console.error('Transcription failed:', err);
          onInterim?.('');
          onStateChange('idle');
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      onStateChange('listening');
      onInterim?.('');
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required.');
      onStateChange('idle');
    }
  }, [onTranscript, onInterim, onStateChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }, []);

  const handleClick = () => {
    if (state === 'idle') startRecording();
    else if (state === 'listening') stopRecording();
  };

  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';
  const isDisabled = isProcessing || isSpeaking;

  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {isListening && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute rounded-full border-2 border-[#008060]/30"
                initial={{ width: 72, height: 72, opacity: 0.6 }}
                animate={{ width: [72, 130], height: [72, 130], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Glow */}
      <div className={`absolute w-24 h-24 rounded-full blur-2xl transition-all duration-700 ${
        isListening ? 'bg-[#008060]/20 scale-150'
        : isProcessing ? 'bg-[#5C6AC4]/15 scale-125'
        : isSpeaking ? 'bg-[#008060]/15 scale-125'
        : 'bg-transparent scale-100'
      }`} />

      {/* Spinning ring */}
      <div
        className={`absolute w-[76px] h-[76px] rounded-full transition-all duration-500 ${
          isListening ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
        style={{
          background: 'conic-gradient(from 0deg, #008060, #00a47c, #008060)',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2.5px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2.5px))',
          animation: isListening ? 'spin 2.5s linear infinite' : 'none',
        }}
      />

      <motion.button
        onClick={handleClick}
        disabled={isDisabled}
        whileTap={!isDisabled ? { scale: 0.92 } : {}}
        whileHover={!isDisabled ? { scale: 1.05 } : {}}
        className={`relative z-10 w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
          isListening
            ? 'bg-[#008060] shadow-xl shadow-[#008060]/25'
            : isProcessing
            ? 'bg-white border border-[#e8e6e1] cursor-wait shadow-sm'
            : isSpeaking
            ? 'bg-white border border-[#e8e6e1] cursor-default shadow-sm'
            : 'bg-white border border-[#e8e6e1] hover:border-[#008060] hover:shadow-md shadow-sm'
        }`}
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-[#008060] border-t-transparent rounded-full animate-spin" />
        ) : isSpeaking ? (
          <SpeakingBars />
        ) : isListening ? (
          <StopIcon />
        ) : (
          <MicIcon />
        )}
      </motion.button>
    </div>
  );
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#008060]">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function StopIcon() {
  return <div className="w-5 h-5 rounded-sm bg-white" />;
}

function SpeakingBars() {
  return (
    <div className="flex items-center gap-[3px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-[#008060]"
          animate={{ height: [8, 20, 8] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
