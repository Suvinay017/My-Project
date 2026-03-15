import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  Cpu,
  LogOut,
  Mic,
  MicOff,
  Music,
  Play,
  Send,
  SkipForward,
  Square,
  Terminal,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import LoginPage from "./LoginPage";

type AssistantState = "idle" | "listening" | "executing";

interface HistoryEntry {
  id: number;
  role: "user" | "aura";
  message: string;
  timestamp: Date;
}

const TRACKS = [
  {
    id: 1,
    name: "Neon Drift",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: 2,
    name: "Neural Pulse",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: 3,
    name: "Phantom Circuit",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
];

const AUTH_KEY = "aura_auth";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    () => localStorage.getItem(AUTH_KEY) === "true",
  );

  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [commandInput, setCommandInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      id: 0,
      role: "aura",
      message: "System online. AURA v1.0 initialized. Awaiting your command.",
      timestamp: new Date(),
    },
  ]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const entryIdRef = useRef(1);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsLoggedIn(false);
  };

  const addLog = useCallback((role: "user" | "aura", message: string) => {
    setHistory((prev) => [
      ...prev,
      { id: entryIdRef.current++, role, message, timestamp: new Date() },
    ]);
  }, []);

  // Scroll history to bottom whenever history changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: ref mutation, no deps needed
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Audio setup — run once on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-time setup
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.7;
    audio.src = TRACKS[0].url;
    audio.onended = () => {
      setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    };
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Track change effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = isPlayingRef.current;
    audio.pause();
    audio.src = TRACKS[currentTrackIndex].url;
    if (wasPlaying) {
      audio.play().catch(() => {});
    }
  }, [currentTrackIndex]);

  // Volume/mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const playMusic = useCallback(
    (trackIndex?: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const idx = trackIndex !== undefined ? trackIndex : currentTrackIndex;
      if (trackIndex !== undefined && audio.src !== TRACKS[idx].url) {
        audio.src = TRACKS[idx].url;
      }
      audio.play().catch(() => {
        addLog(
          "aura",
          "Audio playback blocked by browser. Click the Play button to start.",
        );
      });
      setIsPlaying(true);
      addLog("aura", `Playing track: ${TRACKS[idx].name}`);
    },
    [currentTrackIndex, addLog],
  );

  const stopMusic = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    addLog("aura", "Playback stopped.");
  }, [addLog]);

  const nextTrack = useCallback(() => {
    const nextIndex = (currentTrackIndex + 1) % TRACKS.length;
    setCurrentTrackIndex(nextIndex);
    if (isPlayingRef.current) {
      setTimeout(() => {
        audioRef.current?.play().catch(() => {});
      }, 100);
    }
    addLog("aura", `Loading next track: ${TRACKS[nextIndex].name}`);
  }, [currentTrackIndex, addLog]);

  const handleIntent = useCallback(
    (intent: string) => {
      switch (intent.trim()) {
        case "play":
          playMusic();
          break;
        case "stop":
          stopMusic();
          break;
        case "next":
        case "next track":
        case "change song":
          nextTrack();
          break;
        case "exit":
        case "shutdown":
          addLog(
            "aura",
            "Shutting down... Goodbye. System entering sleep mode.",
          );
          break;
        default:
          addLog(
            "aura",
            `Unknown command: "${intent}". Try: play, stop, next, exit`,
          );
      }
    },
    [playMusic, stopMusic, nextTrack, addLog],
  );

  const processCommand = useCallback(
    (input: string) => {
      const normalized = input.trim().toLowerCase();
      if (!normalized) return;

      addLog("user", input.trim());
      setAssistantState("executing");

      setTimeout(() => {
        if (!normalized.startsWith("aura")) {
          handleIntent(normalized);
        } else {
          const intent = normalized.replace(/^aura\s*/i, "").trim();
          handleIntent(intent);
        }
        setAssistantState("idle");
      }, 300);
    },
    [addLog, handleIntent],
  );

  const handleSend = () => {
    if (!commandInput.trim()) return;
    processCommand(commandInput);
    setCommandInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      // biome-ignore lint/suspicious/noExplicitAny: Web Speech API
      (window as any).SpeechRecognition ||
      // biome-ignore lint/suspicious/noExplicitAny: Web Speech API
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input not supported in this browser", {
        description: "Try Chrome or Edge for voice commands.",
      });
      return;
    }

    if (assistantState === "listening") return;

    // biome-ignore lint/suspicious/noExplicitAny: Web Speech API
    const recognition = new SpeechRecognition() as any;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setAssistantState("listening");

    // biome-ignore lint/suspicious/noExplicitAny: Web Speech API
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCommandInput(transcript);
      processCommand(transcript);
    };

    recognition.onerror = () => {
      setAssistantState("idle");
      toast.error("Voice recognition error. Please try again.");
    };

    recognition.onnomatch = () => {
      setAssistantState("idle");
      addLog("aura", "No speech detected. Command not recognized.");
    };

    recognition.onend = () => {
      setAssistantState((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognition.start();
  };

  const statusConfig = {
    idle: {
      label: "IDLE",
      color: "text-muted-foreground",
      dotClass: "bg-muted-foreground status-dot-idle",
      borderClass: "",
    },
    listening: {
      label: "LISTENING",
      color: "text-neon-green",
      dotClass: "bg-neon-green status-dot-listening",
      borderClass: "neon-border",
    },
    executing: {
      label: "EXECUTING",
      color: "text-neon-amber",
      dotClass: "bg-neon-amber status-dot-executing",
      borderClass: "neon-border-amber",
    },
  };

  const currentStatus = statusConfig[assistantState];

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    if (isPlayingRef.current) {
      setTimeout(() => audioRef.current?.play().catch(() => {}), 100);
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-background grid-bg relative overflow-hidden">
      {/* Atmospheric glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-neon-green/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-neon-amber/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col min-h-screen">
        {/* HEADER */}
        <header className="text-center mb-8 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-5xl sm:text-7xl font-black tracking-widest neon-glow text-neon-green mb-2">
              AURA
            </h1>
            <p className="text-muted-foreground font-mono text-xs sm:text-sm tracking-[0.3em] uppercase">
              Adaptive Unified Response Assistant
            </p>
          </motion.div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-green/40 to-transparent" />
            <Cpu size={14} className="text-neon-green/60" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-green/40 to-transparent" />
          </div>
          {/* Logout button */}
          <button
            type="button"
            data-ocid="aura.logout_button"
            onClick={handleLogout}
            className="absolute top-0 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border/50 text-muted-foreground/50 hover:border-destructive/40 hover:text-destructive font-mono text-[10px] tracking-widest transition-all"
          >
            <LogOut size={12} />
            LOGOUT
          </button>
        </header>

        {/* STATUS BADGE */}
        <motion.div
          data-ocid="aura.status_panel"
          className={cn(
            "flex items-center justify-center gap-3 mb-6 px-6 py-3 rounded-sm border card-dark mx-auto",
            currentStatus.borderClass,
          )}
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div
            className={cn("w-2.5 h-2.5 rounded-full", currentStatus.dotClass)}
          />
          <span
            className={cn(
              "font-display text-sm tracking-[0.3em]",
              currentStatus.color,
            )}
          >
            STATUS: {currentStatus.label}
          </span>
          {assistantState === "listening" && (
            <div className="flex gap-0.5 items-end h-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-0.5 bg-neon-green rounded-full"
                  style={{
                    height: "4px",
                    animation: `waveform ${0.4 + i * 0.1}s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* MAIN GRID */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* COMMAND INPUT */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card-dark rounded-sm p-4 border"
            >
              <div className="flex items-center gap-2 mb-3">
                <Terminal size={14} className="text-neon-green" />
                <span className="font-display text-xs tracking-widest text-neon-green">
                  COMMAND INPUT
                </span>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  ref={inputRef}
                  data-ocid="aura.command_input"
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command... (e.g. Aura play)"
                  className="flex-1 bg-surface-2 border border-border text-foreground font-mono text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-neon-green/60 placeholder:text-muted-foreground/50 transition-all"
                />
                <button
                  type="button"
                  data-ocid="aura.send_button"
                  onClick={handleSend}
                  disabled={!commandInput.trim()}
                  className="px-3 py-2 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded-sm hover:bg-neon-green/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>

              <button
                type="button"
                data-ocid="aura.voice_button"
                onClick={handleVoiceInput}
                disabled={assistantState === "executing"}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-sm border font-mono text-xs tracking-widest transition-all",
                  assistantState === "listening"
                    ? "border-neon-green/80 bg-neon-green/10 text-neon-green mic-listening"
                    : "border-border bg-surface-2 text-muted-foreground hover:border-neon-green/40 hover:text-neon-green",
                  assistantState === "executing" &&
                    "opacity-40 cursor-not-allowed",
                )}
              >
                {assistantState === "listening" ? (
                  <>
                    <Mic size={18} className="animate-mic-pulse" />
                    <span>LISTENING...</span>
                  </>
                ) : (
                  <>
                    <MicOff size={18} />
                    <span>VOICE ACTIVATE</span>
                  </>
                )}
              </button>

              <p className="mt-2 text-muted-foreground/50 font-mono text-xs">
                Try: <span className="text-neon-green/60">Aura play</span> ·{" "}
                <span className="text-neon-green/60">Aura stop</span> ·{" "}
                <span className="text-neon-green/60">Aura next</span> ·{" "}
                <span className="text-neon-green/60">Aura exit</span>
              </p>
            </motion.section>

            {/* MUSIC PANEL */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="card-dark rounded-sm p-4 border flex-1"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Music size={14} className="text-neon-green" />
                  <span className="font-display text-xs tracking-widest text-neon-green">
                    MUSIC CORE
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMuted((v) => !v)}
                  className="text-muted-foreground hover:text-neon-green transition-colors"
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>

              {/* Track list */}
              <div className="space-y-1 mb-4">
                {TRACKS.map((track, index) => (
                  <button
                    type="button"
                    key={track.id}
                    data-ocid={`aura.track.item.${index + 1}`}
                    onClick={() => selectTrack(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-sm border cursor-pointer transition-all text-xs font-mono",
                      currentTrackIndex === index
                        ? "border-neon-green/50 bg-neon-green/5 text-neon-green"
                        : "border-border/50 bg-surface-2/50 text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                        currentTrackIndex === index && isPlaying
                          ? "bg-neon-green status-dot-listening"
                          : currentTrackIndex === index
                            ? "bg-neon-green/50"
                            : "bg-muted-foreground/30",
                      )}
                    />
                    <span className="flex-1">{track.name}</span>
                    <span className="text-muted-foreground/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </button>
                ))}
              </div>

              {/* Now playing */}
              <div
                className={cn(
                  "px-3 py-2 rounded-sm border mb-3 text-xs font-mono",
                  isPlaying
                    ? "border-neon-green/30 bg-neon-green/5 text-neon-green"
                    : "border-border/40 text-muted-foreground",
                )}
              >
                <span className="text-muted-foreground/60">NOW PLAYING: </span>
                <span>{isPlaying ? TRACKS[currentTrackIndex].name : "—"}</span>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  type="button"
                  data-ocid="aura.music_play_button"
                  onClick={() => playMusic()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm border border-neon-green/30 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-all text-xs font-mono tracking-wider"
                >
                  <Play size={13} />
                  PLAY
                </button>
                <button
                  type="button"
                  data-ocid="aura.music_stop_button"
                  onClick={stopMusic}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm border border-border bg-surface-2 text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-all text-xs font-mono tracking-wider"
                >
                  <Square size={13} />
                  STOP
                </button>
                <button
                  type="button"
                  data-ocid="aura.music_next_button"
                  onClick={nextTrack}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm border border-border bg-surface-2 text-muted-foreground hover:border-neon-green/40 hover:text-neon-green transition-all text-xs font-mono tracking-wider"
                >
                  <SkipForward size={13} />
                  NEXT
                </button>
              </div>
            </motion.section>
          </div>

          {/* RIGHT COLUMN: History */}
          <motion.section
            data-ocid="aura.history_panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 card-dark rounded-sm border flex flex-col"
            style={{ minHeight: "400px" }}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <Terminal size={14} className="text-neon-green" />
              <span className="font-display text-xs tracking-widest text-neon-green">
                COMMAND HISTORY
              </span>
              <div className="ml-auto flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-destructive/60" />
                <div className="w-2 h-2 rounded-full bg-neon-amber/60" />
                <div className="w-2 h-2 rounded-full bg-neon-green/60" />
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 font-mono text-sm">
                <AnimatePresence initial={false}>
                  {history.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex gap-2",
                        entry.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      {entry.role === "aura" && (
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-5 h-5 rounded-full border border-neon-green/40 flex items-center justify-center bg-neon-green/5">
                            <Cpu size={10} className="text-neon-green" />
                          </div>
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] px-3 py-2 rounded-sm border text-xs leading-relaxed",
                          entry.role === "user"
                            ? "bg-neon-green/10 border-neon-green/30 text-neon-green text-right"
                            : "bg-surface-2 border-border/50 text-foreground/90",
                        )}
                      >
                        <div className="text-muted-foreground/40 text-[10px] mb-0.5">
                          {entry.role === "user" ? "YOU" : "AURA"} ·{" "}
                          {entry.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                        <div>{entry.message}</div>
                      </div>
                      {entry.role === "user" && (
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-5 h-5 rounded-full border border-neon-green/30 flex items-center justify-center bg-neon-green/5">
                            <span className="text-[8px] text-neon-green font-bold">
                              U
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={historyEndRef} />
              </div>
            </ScrollArea>

            {/* Quick commands */}
            <div className="px-4 py-3 border-t border-border/50">
              <div className="flex flex-wrap gap-2">
                {["Aura play", "Aura stop", "Aura next", "Aura exit"].map(
                  (cmd) => (
                    <button
                      type="button"
                      key={cmd}
                      onClick={() => processCommand(cmd)}
                      className="px-2 py-1 text-[10px] font-mono border border-border/50 text-muted-foreground/60 hover:border-neon-green/40 hover:text-neon-green rounded-sm transition-all tracking-wider"
                    >
                      {cmd}
                    </button>
                  ),
                )}
                <span className="ml-auto text-[10px] text-muted-foreground/30 font-mono self-center">
                  {history.length} entries
                </span>
              </div>
            </div>
          </motion.section>
        </div>

        {/* FOOTER */}
        <footer className="mt-6 pt-4 border-t border-border/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-[10px] font-mono text-muted-foreground/40 tracking-widest">
              AURA SYS v1.0.0 · MODULAR AI ARCHITECTURE
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/40">
              © {new Date().getFullYear()}. Built with ♥ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-green/50 hover:text-neon-green transition-colors"
              >
                caffeine.ai
              </a>
            </div>
          </div>
        </footer>
      </div>

      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "bg-surface-1 border border-border font-mono text-xs",
          },
        }}
      />
    </div>
  );
}
