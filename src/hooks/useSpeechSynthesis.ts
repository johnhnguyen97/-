import { useState, useCallback, useEffect, useRef } from 'react';

interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  cancel: () => void;
  speaking: boolean;
  speakingText: string | null;
  supported: boolean;
  isSpeaking: (text: string) => boolean;
}

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const { lang = 'ja-JP', rate = 0.9, pitch = 1, volume = 1 } = options;
  const [speaking, setSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        setSpeaking(true);
        setSpeakingText(text);
      };
      utterance.onend = () => {
        setSpeaking(false);
        setSpeakingText(null);
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setSpeakingText(null);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supported, lang, rate, pitch, volume]
  );

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setSpeakingText(null);
  }, [supported]);

  // Helper to check if a specific text is being spoken
  const isSpeaking = useCallback(
    (text: string) => speaking && speakingText === text,
    [speaking, speakingText]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  return { speak, cancel, speaking, speakingText, supported, isSpeaking };
}
