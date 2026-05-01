import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  language?: string;
  onTranscript: (text: string) => void;
  className?: string;
}

// Minimal types for the Web Speech API
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: SpeechRecognitionEventLike) => void;
  onerror: (e: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceInputButton({
  language = "en-IN",
  onTranscript,
  className,
}: VoiceInputButtonProps) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
  }, []);

  useEffect(() => {
    return () => {
      try {
        recogRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  const start = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      toast("Voice not supported on this browser");
      return;
    }
    try {
      const r = new Ctor();
      r.lang = language;
      r.continuous = false;
      r.interimResults = false;
      r.onresult = (e) => {
        let text = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        if (text.trim()) onTranscript(text.trim());
      };
      r.onerror = (e) => {
        if (e.error !== "aborted" && e.error !== "no-speech") {
          toast.error(`Voice input error: ${e.error}`);
        }
        setRecording(false);
      };
      r.onend = () => setRecording(false);
      recogRef.current = r;
      r.start();
      setRecording(true);
    } catch {
      toast("Voice not supported on this browser");
    }
  };

  const stop = () => {
    try {
      recogRef.current?.stop();
    } catch {
      /* noop */
    }
    setRecording(false);
  };

  if (supported === false) {
    return (
      <button
        type="button"
        disabled
        title="Voice not supported on this browser"
        className={cn(
          "h-11 w-11 grid place-items-center rounded-full text-muted-foreground border opacity-60",
          className,
        )}
        aria-label="Voice input not supported"
      >
        <MicOff className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      aria-label={recording ? "Stop recording" : "Start voice input"}
      className={cn(
        "h-11 w-11 grid place-items-center rounded-full border-2 transition-colors relative",
        recording ? "bg-red-50 border-red-500" : "bg-background border-primary hover:bg-accent",
        className,
      )}
    >
      <Mic className={cn("h-5 w-5", recording ? "text-red-600" : "text-primary")} />
      {recording && (
        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
      )}
    </button>
  );
}
