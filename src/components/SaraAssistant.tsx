import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Sparkles,
  Languages,
  Sun,
  Moon,
  Info,
  ChevronDown,
  RotateCcw,
  Smile,
  Zap,
  Phone,
  Calendar,
  Compass
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export default function SaraAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isHindi, setIsHindi] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [isListening, setIsListening] = useState(false);
  
  // Custom interactive features & voice support states
  const [isVoiceInputSupported, setIsVoiceInputSupported] = useState(false);
  const [isVoiceOutputSupported, setIsVoiceOutputSupported] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "info" | "error" | "success" } | null>(null);
  
  // Panel reference for handling clicks outside to close
  const panelRef = useRef<HTMLDivElement | null>(null);
  
  // Abort controller reference for cancelling fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Avatar animation states: "idle" | "listening" | "thinking" | "talking"
  const [avatarState, setAvatarState] = useState<"idle" | "listening" | "thinking" | "talking">("idle");
  const [eyeDirection, setEyeDirection] = useState<"center" | "left" | "right">("center");

  // Web Speech references
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-greeting trigger track
  const hasGreetedRef = useRef(false);

  useEffect(() => {
    // Initialize Speech Synthesis
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      setIsVoiceOutputSupported(!!window.speechSynthesis);
    }

    // Initialize Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsVoiceInputSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
        setAvatarState("listening");
        // Interrupt speaking on user start speaking
        if (synthRef.current) {
          synthRef.current.cancel();
        }
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText && resultText.trim()) {
          // Add support for spoken goodbye command to close drawer
          const spokenLower = resultText.toLowerCase().trim();
          if (
            spokenLower === "close" ||
            spokenLower === "goodbye" ||
            spokenLower === "bye" ||
            spokenLower === "close assistant" ||
            spokenLower === "बंद करो" ||
            spokenLower === "अलविदा"
          ) {
            const closingSpeech = isHindi ? "अलविदा! सारा बंद हो रही है।" : "Goodbye! Closing the assistant now.";
            speakText(closingSpeech);
            setTimeout(() => {
              handleClose();
            }, 2000);
            return;
          }
          // Send voice message
          sendMessage(resultText);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
        setAvatarState("idle");
      };

      rec.onend = () => {
        setIsListening(false);
        if (avatarState === "listening") {
          setAvatarState("idle");
        }
      };

      recognitionRef.current = rec;
    }

    // Load theme setting from localStorage if available
    const savedTheme = localStorage.getItem("sara_theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isHindi]);

  // Listener to close with Escape key and Outside Click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const triggerBtn = document.getElementById("sara-floating-trigger");
        if (triggerBtn && triggerBtn.contains(e.target as Node)) return;
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Set Speech Language dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = isHindi ? "hi-IN" : "en-US";
    }
  }, [isHindi]);

  // Handle eyes tracking mouse or moving randomly when thinking/talking
  useEffect(() => {
    if (avatarState === "thinking") {
      const interval = setInterval(() => {
        setEyeDirection((prev) => (prev === "center" ? "left" : prev === "left" ? "right" : "center"));
      }, 800);
      return () => clearInterval(interval);
    } else if (avatarState === "talking") {
      const interval = setInterval(() => {
        setEyeDirection((prev) => (prev === "center" ? "left" : prev === "left" ? "right" : "center"));
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setEyeDirection("center");
    }
  }, [avatarState]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Automatically trigger voice welcome when Sara is opened for the first time
  useEffect(() => {
    if (isOpen && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      triggerWelcome();
    }
  }, [isOpen]);

  const triggerWelcome = () => {
    const welcomeEn = "Hello! Welcome to our website. My name is Sara, your AI Customer Support Assistant. I'm here to help you with any questions about our products and services. Feel free to speak with me in English or Hindi.";
    const welcomeHi = "नमस्ते! हमारी वेबसाइट पर आपका स्वागत है। मेरा नाम सारा है। मैं आपकी AI Customer Support Assistant हूँ। आप मुझसे हिंदी या English में बात कर सकते हैं। मैं आपकी पूरी सहायता करूँगी।";
    
    // Choose greeting based on current language state
    const welcomeText = isHindi ? welcomeHi : welcomeEn;

    setMessages([
      {
        id: "welcome-msg",
        role: "assistant",
        text: welcomeText,
        timestamp: new Date()
      }
    ]);

    speakText(welcomeText);
  };

  const toggleLanguage = () => {
    const nextLang = !isHindi;
    setIsHindi(nextLang);
    
    // Switch welcome message role to the new language
    const welcomeEn = "Hello! Welcome to our website. My name is Sara, your AI Customer Support Assistant. I'm here to help you with any questions about our products and services. Feel free to speak with me in English or Hindi.";
    const welcomeHi = "नमस्ते! हमारी वेबसाइट पर आपका स्वागत है। मेरा नाम सारा है। मैं आपकी AI Customer Support Assistant हूँ। आप मुझसे हिंदी या English में बात कर सकते हैं। मैं आपकी पूरी सहायता करूँगी।";
    const welcomeText = nextLang ? welcomeHi : welcomeEn;

    if (synthRef.current) {
      synthRef.current.cancel();
    }

    setMessages((prev) => {
      // Find and update welcome message or append a language switch greeting
      const filtered = prev.filter(m => m.id !== "welcome-msg");
      return [
        {
          id: "welcome-msg",
          role: "assistant",
          text: welcomeText,
          timestamp: new Date()
        },
        ...filtered
      ];
    });

    speakText(welcomeText, nextLang);
  };

  const showToast = (text: string, type: "info" | "error" | "success" = "info") => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleMicToggle = async () => {
    if (!recognitionRef.current) {
      showToast(
        isHindi 
          ? "माफ़ कीजिये, आपके ब्राउज़र में वॉयस इनपुट सपोर्ट नहीं है। कृपया टाइप करें!" 
          : "Speech recognition is not supported in this browser. Please type your message!", 
        "error"
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Failed to stop recognition on toggle", e);
      }
    } else {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Request audio access to explicitly verify and prompt permission
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log("Microphone is working");
          
          // Stop all tracks on the stream immediately to close the active indicator
          stream.getTracks().forEach((track) => track.stop());

          // Proceed to start Speech Recognition
          recognitionRef.current.start();
          showToast(
            isHindi ? "सुन रही हूँ... कृपया बोलें" : "Listening... Please speak now",
            "success"
          );
        } catch (err: any) {
          console.log("Mic error:", err);
          showToast(
            isHindi 
              ? "माइक चालू करने में विफल। कृपया सेटिंग्स में अनुमति जांचें।" 
              : "Microphone error: " + (err.message || "Permission denied. Please allow microphone access."),
            "error"
          );
        }
      } else {
        // Fallback for older browsers or systems with no mediaDevices support
        try {
          recognitionRef.current.start();
          showToast(
            isHindi ? "सुन रही हूँ... कृपया बोलें" : "Listening... Please speak now",
            "success"
          );
        } catch (e) {
          console.error("Failed to start speech recognition fallback", e);
          showToast(
            isHindi ? "माइक चालू करने में विफल। कृपया अनुमति जांचें।" : "Failed to start microphone. Please check permissions.",
            "error"
          );
        }
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Failed to stop speech recognition on close", e);
      }
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsListening(false);
    setIsLoading(false);
    setAvatarState("idle");
  };

  const speakText = (text: string, forceLanguageState?: boolean) => {
    if (isMuted || !synthRef.current) return;

    // Cancel current speaking
    synthRef.current.cancel();

    // Remove asterisks, hashtags, or bracket notes for cleaner pronunciation
    const cleanText = text
      .replace(/[*#]/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechSpeed;

    // Detect if Hindi or English is forced, or rely on state
    const targetIsHindi = forceLanguageState !== undefined ? forceLanguageState : isHindi;

    // Setup voices
    const voices = synthRef.current.getVoices();
    let selectedVoice = null;

    if (targetIsHindi) {
      // Find a standard female Hindi voice
      selectedVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes("hi") &&
          (v.name.toLowerCase().includes("female") ||
            v.name.toLowerCase().includes("google") ||
            v.name.toLowerCase().includes("kalpana") ||
            v.name.toLowerCase().includes("lekha"))
      ) || voices.find((v) => v.lang.toLowerCase().includes("hi"));
      
      utterance.lang = "hi-IN";
    } else {
      // Find a standard female English voice
      selectedVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes("en") &&
          (v.name.toLowerCase().includes("samantha") ||
            v.name.toLowerCase().includes("zira") ||
            v.name.toLowerCase().includes("google") ||
            v.name.toLowerCase().includes("female") ||
            v.name.toLowerCase().includes("hazel"))
      ) || voices.find((v) => v.lang.toLowerCase().includes("en"));
      
      utterance.lang = "en-US";
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setAvatarState("talking");
    };

    utterance.onend = () => {
      setAvatarState("idle");
    };

    utterance.onerror = () => {
      setAvatarState("idle");
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);
    setAvatarState("thinking");

    // Automatically check language of input to switch language state
    const hasHindiChars = /[\u0900-\u097F]/.test(textToSend);
    if (hasHindiChars !== isHindi) {
      setIsHindi(hasHindiChars);
    }

    // Cancel previous ongoing fetch if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Setup payload including last 6 messages of history for context
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory.slice(-6)
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("Failed to get response from Sara");
      }

      const data = await response.json();
      
      // Clear abort controller reference if completed successfully
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      const assistantMsg: Message = {
        id: Math.random().toString(),
        role: "assistant",
        text: data.text,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
      setAvatarState("talking");

      // Speak assistant's response in detected language
      speakText(data.text, hasHindiChars);

    } catch (e: any) {
      if (e.name === "AbortError" || e.message === "The user aborted a request.") {
        return; // Silent return for cancelled requests
      }
      console.error(e);
      setIsLoading(false);
      setAvatarState("idle");

      const errMsgText = isHindi 
        ? "माफ़ कीजिये, सर्वर से संपर्क करने में कुछ समस्या हो रही है। कृपया पुनः प्रयास करें।" 
        : "Sorry, I am facing an issue connecting with my server. Please try again in a moment.";

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          text: errMsgText,
          timestamp: new Date()
        }
      ]);
      speakText(errMsgText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("sara_theme", nextTheme);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted && synthRef.current) {
      synthRef.current.cancel();
      setAvatarState("idle");
    }
  };

  const handleReset = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setMessages([]);
    hasGreetedRef.current = false;
    triggerWelcome();
  };

  // Avatar component with blinks, breath, and lip-sync speech loops
  const renderAvatar = (size: "small" | "large") => {
    const isSmall = size === "small";

    return (
      <div className={`relative flex items-center justify-center select-none ${isSmall ? "w-16 h-16" : "w-36 h-36"}`}>
        {/* Animated Background Aura for listening / speaking / thinking */}
        <AnimatePresence>
          {avatarState !== "idle" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: avatarState === "listening" ? [1, 1.25, 1] : avatarState === "talking" ? [1, 1.15, 1] : [1, 1.1, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{
                duration: avatarState === "listening" ? 1.5 : 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 rounded-full blur-xl ${
                avatarState === "listening"
                  ? "bg-emerald-500/20"
                  : avatarState === "talking"
                  ? "bg-amber-500/20"
                  : "bg-blue-500/20"
              }`}
            />
          )}
        </AnimatePresence>

        {/* Breathing Base Body container */}
        <motion.div
          animate={{
            y: [0, -3, 0]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`relative ${isSmall ? "w-14 h-14" : "w-32 h-32"} rounded-full bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border border-white/10 flex items-center justify-center overflow-hidden shadow-inner`}
        >
          {/* Custom SVG Vector Female AI Avatar (Sara) */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background circular shade */}
            <circle cx="50" cy="50" r="46" fill="rgba(245, 158, 11, 0.03)" />

            {/* Shoulders & Torso */}
            <motion.g
              animate={{
                y: [0, -1, 0]
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Premium suit collar / blazer top */}
              <path
                d="M 22 90 C 22 75, 78 75, 78 90 Z"
                fill={theme === "dark" ? "#1e1e24" : "#e4e4e7"}
                stroke={theme === "dark" ? "#ffffff12" : "#00000010"}
                strokeWidth="1"
              />
              {/* In-shirt */}
              <path d="M 40 76 L 50 88 L 60 76 Z" fill="#ffffff" />
              {/* Golden Necktie / Badge */}
              <path d="M 48 88 L 52 88 L 50 98 Z" fill="#f59e0b" />
            </motion.g>

            {/* Neck */}
            <rect x="46" y="62" width="8" height="15" rx="3" fill="#fddfbc" />
            
            {/* Head and Face */}
            <motion.g
              animate={{
                rotate: avatarState === "thinking" ? [-1.5, 1.5, -1.5] : [-0.5, 0.5, -0.5],
                y: [0, -0.5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Ears */}
              <circle cx="34" cy="50" r="4.5" fill="#fccf9e" />
              <circle cx="66" cy="50" r="4.5" fill="#fccf9e" />

              {/* Head Base */}
              <path
                d="M 35 48 C 35 34, 65 34, 65 48 C 65 62, 35 62, 35 48"
                fill="#ffe5c9"
              />

              {/* Blushing cheeks */}
              <circle cx="40" cy="54" r="2.5" fill="#fca5a5" opacity="0.4" />
              <circle cx="60" cy="54" r="2.5" fill="#fca5a5" opacity="0.4" />

              {/* Nose */}
              <path d="M 49 52 C 50 50, 50 50, 51 52" stroke="#e0a96d" strokeWidth="1.2" fill="none" />

              {/* Eyes with repeating Blinking loop */}
              <g>
                {/* Left Eye */}
                <motion.ellipse
                  cx="43"
                  cy="48"
                  rx="2"
                  ry="2"
                  fill="#111827"
                  animate={{
                    scaleY: [1, 0.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 3.5,
                    ease: "easeInOut"
                  }}
                />
                {/* Left Eye Highlight */}
                <circle cx="43.8" cy="47.2" r="0.6" fill="#ffffff" />

                {/* Right Eye */}
                <motion.ellipse
                  cx="57"
                  cy="48"
                  rx="2"
                  ry="2"
                  fill="#111827"
                  animate={{
                    scaleY: [1, 0.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 3.5,
                    ease: "easeInOut"
                  }}
                />
                {/* Right Eye Highlight */}
                <circle cx="57.8" cy="47.2" r="0.6" fill="#ffffff" />

                {/* Left Pupil pupil directions when thinking / looking */}
                <motion.circle
                  cx={eyeDirection === "left" ? "42" : eyeDirection === "right" ? "44" : "43"}
                  cy="48"
                  r="0.8"
                  fill="#1e3a8a"
                  animate={{
                    x: eyeDirection === "left" ? -0.5 : eyeDirection === "right" ? 0.5 : 0
                  }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Right Pupil */}
                <motion.circle
                  cx={eyeDirection === "left" ? "56" : eyeDirection === "right" ? "58" : "57"}
                  cy="48"
                  r="0.8"
                  fill="#1e3a8a"
                  animate={{
                    x: eyeDirection === "left" ? -0.5 : eyeDirection === "right" ? 0.5 : 0
                  }}
                  transition={{ duration: 0.3 }}
                />
              </g>

              {/* Eyebrows */}
              <motion.path
                d="M 39 44 C 41 42, 44 43, 46 44"
                stroke="#4b5563"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                animate={{
                  y: avatarState === "listening" ? -1 : avatarState === "thinking" ? -1.5 : 0
                }}
                transition={{ duration: 0.3 }}
              />
              <motion.path
                d="M 54 44 C 56 43, 59 42, 61 44"
                stroke="#4b5563"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                animate={{
                  y: avatarState === "listening" ? -1 : avatarState === "thinking" ? -1.5 : 0
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Mouth with real lip-sync speaking animation */}
              <g>
                {avatarState === "talking" ? (
                  /* Lip sync speaking */
                  <motion.path
                    d="M 45 56 Q 50 61 55 56 Q 50 58 45 56"
                    fill="#ef4444"
                    animate={{
                      scaleY: [1, 2.5, 0.8, 2, 1.2, 2.8, 1],
                      y: [0, 0.5, -0.2, 0.6, -0.1, 0.4, 0]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ) : avatarState === "listening" ? (
                  /* Listening slightly open mouth */
                  <path d="M 46 56 Q 50 58 54 56 Q 50 56.5 46 56" fill="#f87171" />
                ) : (
                  /* Beautiful gentle friendly smile */
                  <path d="M 45 55 Q 50 59 55 55" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                )}
              </g>

              {/* Hair (Sleek professional hair lock and sides) */}
              <path
                d="M 34 46 C 30 38, 38 25, 50 25 C 62 25, 70 38, 66 46 C 66 52, 68 55, 68 58 C 65 52, 65 42, 50 30 C 35 42, 35 52, 32 58 C 32 55, 34 52, 34 46 Z"
                fill="#27272a"
              />
              {/* Back Hair support */}
              <path d="M 33 46 C 26 48, 28 65, 30 75" stroke="#27272a" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M 67 46 C 74 48, 72 65, 70 75" stroke="#27272a" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            </motion.g>

            {/* Glowing headphones for Tech-assistant styling */}
            <motion.g
              animate={{
                opacity: avatarState === "listening" ? [0.6, 1, 0.6] : 0.8
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Left earphone */}
              <rect x="30" y="47" width="3" height="7" rx="1.5" fill="#f59e0b" />
              {/* Right earphone */}
              <rect x="67" y="47" width="3" height="7" rx="1.5" fill="#f59e0b" />
              {/* Band connecting */}
              <path d="M 32 47 A 18 18 0 0 1 68 47" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2,2" />
            </motion.g>
          </svg>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-left">
      {/* Floating Interactive Sara Bubble Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="floating-sara-btn"
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 20, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] border border-white/20 clickable flex items-center justify-center relative overflow-visible group"
            id="sara-floating-trigger"
          >
            {/* Sara circular face */}
            {renderAvatar("small")}

            {/* Pulsing indicator when idle */}
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse shadow-md" />

            {/* Hover Tooltip tooltip */}
            <div className="absolute right-20 bg-zinc-950/90 text-white text-[11px] font-mono tracking-wide py-1.5 px-3 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap uppercase">
              Talk to Sara (AI Help)
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Elegant Glassmorphic Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            key="sara-chat-panel"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`w-[365px] md:w-[410px] h-[610px] rounded-[32px] overflow-hidden flex flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border ${
              theme === "dark"
                ? "bg-zinc-950/85 backdrop-blur-2xl border-white/10 text-white"
                : "bg-white/95 backdrop-blur-2xl border-zinc-200 text-zinc-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)]"
            }`}
          >
            {/* Top Header */}
            <div className={`px-5 py-4 flex items-center justify-between border-b ${
              theme === "dark" ? "border-white/5 bg-white/5" : "border-zinc-200 bg-zinc-100/50"
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 relative">
                  {/* Blinking face thumbnail inside */}
                  <div className="scale-75 flex items-center justify-center overflow-hidden">
                    {renderAvatar("small")}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-900 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-display font-bold text-sm leading-none">Sara</h4>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-amber-500/15 text-amber-500 uppercase tracking-wider font-bold">Host AI</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-widest">
                    {avatarState === "listening" ? "Listening..." : avatarState === "thinking" ? "Thinking..." : avatarState === "talking" ? "Speaking..." : "Online • English / Hindi"}
                  </p>
                </div>
              </div>

              {/* Close Drawer - Tap to Close */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClose}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 clickable font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/50 shrink-0 ${
                  theme === "dark"
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                    : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                }`}
                title="Close Sara Assistant"
                aria-label="Close Sara Assistant"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="text-[10px] md:text-xs tracking-wide">Tap to Close</span>
              </motion.button>
            </div>

            {/* Quick Controls Sub-Toolbar */}
            <div className={`px-5 py-2.5 flex items-center justify-between border-b ${
              theme === "dark" ? "border-white/5 bg-zinc-900/40" : "border-zinc-200 bg-zinc-50"
            }`}>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-bold">Assistant Options</span>
              <div className="flex items-center space-x-1.5">
                {/* Reset Chat */}
                <button
                  onClick={handleReset}
                  className={`p-1.5 rounded-lg border transition-all hover:text-amber-500 clickable ${
                    theme === "dark" ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200"
                  }`}
                  title="Reset conversation"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>

                {/* Voice/Mute Toggle */}
                <button
                  onClick={toggleMute}
                  className={`p-1.5 rounded-lg border transition-all clickable ${
                    isMuted ? "text-rose-500 border-rose-500/20" : "hover:text-amber-500"
                  } ${
                    theme === "dark" ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200"
                  }`}
                  title={isMuted ? "Unmute Voice" : "Mute Voice"}
                >
                  {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>

                {/* Language Manual Toggle */}
                <button
                  onClick={toggleLanguage}
                  className={`px-1.5 py-1 rounded-lg border transition-all text-[9px] font-mono font-bold flex items-center space-x-1 clickable ${
                    isHindi ? "text-amber-500 border-amber-500/20" : "hover:text-amber-500"
                  } ${
                    theme === "dark" ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200"
                  }`}
                  title="Toggle Language (Eng / Hin)"
                >
                  <Languages className="w-3 h-3" />
                  <span>{isHindi ? "HI" : "EN"}</span>
                </button>

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className={`p-1.5 rounded-lg border transition-all hover:text-amber-500 clickable ${
                    theme === "dark" ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200"
                  }`}
                  title="Toggle Light/Dark Theme"
                >
                  {theme === "dark" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Custom Interactive Toast Notification */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`px-5 py-2 text-xs flex items-center justify-between font-mono tracking-wide border-b font-medium ${
                    toast.type === "error"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/10"
                      : toast.type === "success"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/10"
                  }`}
                >
                  <span>{toast.text}</span>
                  <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-80 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Interactive Interactive Stage */}
            <div className={`p-4 flex flex-col items-center justify-center border-b ${
              theme === "dark" ? "border-white/5 bg-black/40" : "border-zinc-200 bg-zinc-50"
            }`}>
              {/* Big avatar showing active motions */}
              {renderAvatar("large")}

              {/* Realtime Waveform animation when talking or listening */}
              <div className="h-6 flex items-center justify-center space-x-1 mt-2.5">
                {avatarState === "talking" || avatarState === "listening" ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: avatarState === "listening" ? [3, 16, 3] : [3, 12, 3]
                      }}
                      transition={{
                        duration: 0.5 + Math.random() * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.03
                      }}
                      className={`w-0.5 rounded-full ${
                        avatarState === "listening" ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                  ))
                ) : avatarState === "thinking" ? (
                  <div className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 font-mono tracking-wide uppercase">Sara is ready to assist you</p>
                )}
              </div>
            </div>

            {/* Chat Messages Section */}
            <div className={`flex-grow overflow-y-auto p-4 space-y-3.5 ${
              theme === "dark" ? "bg-zinc-950/20" : "bg-zinc-50/10"
            }`}>
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-amber-500 text-black font-semibold rounded-tr-none"
                          : theme === "dark"
                          ? "bg-white/5 border border-white/8 text-zinc-200 rounded-tl-none"
                          : "bg-white border border-zinc-200 text-zinc-700 rounded-tl-none"
                      }`}
                    >
                      <p>{m.text}</p>
                      <span className="block text-[8px] text-right text-gray-400/80 font-mono mt-1.5">
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className={`max-w-[80%] rounded-2xl rounded-tl-none px-4 py-3 border border-white/5 ${
                    theme === "dark" ? "bg-white/5 text-zinc-400" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* FAQs / Helpful Shortcuts shortcuts */}
            <div className={`px-4 py-2 border-t border-b overflow-x-auto whitespace-nowrap flex space-x-2 scrollbar-none ${
              theme === "dark" ? "border-white/5 bg-zinc-950" : "border-zinc-200 bg-zinc-100"
            }`}>
              <button
                onClick={() => sendMessage(isHindi ? "आपकी कौन-कौन सी डिश सबसे प्रसिद्ध हैं?" : "What are your best dishes?")}
                className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wide border flex items-center space-x-1.5 transition-all clickable ${
                  theme === "dark"
                    ? "bg-white/5 border-white/5 hover:border-amber-500/30 text-gray-400 hover:text-white"
                    : "bg-white border-zinc-200 hover:border-amber-500/30 text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Compass className="w-3 h-3 text-amber-500" />
                <span>{isHindi ? "सबसे प्रसिद्ध डिश?" : "Best Seller Dishes?"}</span>
              </button>
              <button
                onClick={() => sendMessage(isHindi ? "यहाँ टेबल बुकिंग या रिजर्वेशन कैसे करें?" : "How do I book a table?")}
                className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wide border flex items-center space-x-1.5 transition-all clickable ${
                  theme === "dark"
                    ? "bg-white/5 border-white/5 hover:border-amber-500/30 text-gray-400 hover:text-white"
                    : "bg-white border-zinc-200 hover:border-amber-500/30 text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Calendar className="w-3 h-3 text-amber-500" />
                <span>{isHindi ? "टेबल बुकिंग कैसे करें?" : "How to Book Table?"}</span>
              </button>
              <button
                onClick={() => sendMessage(isHindi ? "ह्यूमन सपोर्ट या ओनर हेमंत गौतम से बात करनी है" : "I want to talk to owner Hemant Gautam")}
                className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wide border flex items-center space-x-1.5 transition-all clickable ${
                  theme === "dark"
                    ? "bg-white/5 border-white/5 hover:border-amber-500/30 text-gray-400 hover:text-white"
                    : "bg-white border-zinc-200 hover:border-amber-500/30 text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Phone className="w-3 h-3 text-amber-500" />
                <span>{isHindi ? "ओनर हेमंत गौतम से बात" : "Talk to Owner"}</span>
              </button>
            </div>

            {/* Bottom Input Area */}
            <div className={`p-4 ${theme === "dark" ? "bg-zinc-950" : "bg-white"}`}>
              {/* Speaking speed adjustment slider */}
              <div className="flex items-center justify-between pb-3.5 mb-1.5 border-b border-white/5">
                <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider flex items-center space-x-1">
                  <Info className="w-3 h-3 text-amber-500" />
                  <span>Sara's speaking speed</span>
                </span>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.1"
                    value={speechSpeed}
                    onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                    className="w-18 accent-amber-500 h-1 rounded bg-zinc-700 focus:outline-none"
                  />
                  <span className="text-[10px] text-amber-500 font-mono font-bold">{speechSpeed}x</span>
                </div>
              </div>

              {/* Main controls (Text field + Mic + Send) */}
              <div className="flex items-center space-x-2">
                {/* Speech Microphone Toggle */}
                <button
                  onClick={handleMicToggle}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-center clickable relative ${
                    isListening
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse"
                      : theme === "dark"
                      ? "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                      : "bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-800"
                  }`}
                  title="Speak using Microphone"
                >
                  {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                {/* Input Text Field */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={isHindi ? "मुझसे कुछ भी पूछें..." : "Ask me anything..."}
                  disabled={isLoading}
                  className={`flex-grow px-4 py-3 text-xs rounded-2xl border focus:outline-none focus:border-amber-500/50 transition-all ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10 text-white placeholder-gray-500"
                      : "bg-zinc-100 border-zinc-200 text-zinc-800 placeholder-zinc-400"
                  }`}
                />

                {/* Send Button */}
                <button
                  onClick={() => sendMessage(inputText)}
                  disabled={isLoading || !inputText.trim()}
                  className="p-3 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 border border-amber-500/20 text-black hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none clickable flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
