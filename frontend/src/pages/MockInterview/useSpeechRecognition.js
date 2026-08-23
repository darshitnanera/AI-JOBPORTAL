import { useCallback, useEffect, useRef, useState } from "react";

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

/**
 * Thin wrapper over the Web Speech API.
 *
 * Support is genuinely optional — Firefox and most mobile browsers do not ship
 * it. `supported` is false there and the caller simply does not render the mic
 * button; nothing else about the simulator changes. The hook never throws and
 * never blocks answering.
 */
export default function useSpeechRecognition() {
  // Support is a fact about the browser, not state that changes — read it once
  // in the initialiser rather than syncing it from an effect.
  const [supported] = useState(() => Boolean(getSpeechRecognition()));
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(null);

  // Stop any live session when the component using the hook goes away.
  useEffect(
    () => () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null;
    },
    []
  );

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setListening(false);
  }, []);

  /**
   * @param {(text: string) => void} onTranscript
   *        Called with each finalised chunk of speech.
   */
  const start = useCallback((onTranscript) => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    onTranscriptRef.current = onTranscript;
    setError("");

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) finalText += result[0].transcript;
        }
        const trimmed = finalText.trim();
        if (trimmed) onTranscriptRef.current?.(trimmed);
      };

      recognition.onerror = (event) => {
        if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
          setError("Microphone access was blocked. You can still type your answer.");
        } else if (event?.error !== "aborted" && event?.error !== "no-speech") {
          setError("Dictation stopped unexpectedly. You can still type your answer.");
        }
        setListening(false);
      };

      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch {
      // Never let an optional convenience break the page.
      setError("Dictation is unavailable in this browser. Type your answer instead.");
      setListening(false);
    }
  }, []);

  return { supported, listening, error, start, stop };
}
