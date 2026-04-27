"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { useHydrated } from "@/lib/hooks/use-hydrated";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Minimal SpeechRecognition type declaration
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const hydrated = useHydrated();
  const isSupported =
    hydrated && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition!;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (transcript) onTranscript(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  if (!isSupported) return null;

  return (
    <Tooltip label={isListening ? "Stop listening" : "Voice input"}>
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        aria-label={isListening ? "Stop listening" : "Start voice input"}
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-40",
          isListening
            ? "bg-destructive/10 text-destructive animate-pulse"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isListening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
      </button>
    </Tooltip>
  );
}
