import { cn } from "@/lib/utils";
import { Cpu, Eye, EyeOff, Lock, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface LoginPageProps {
  onLogin: () => void;
}

const DEFAULT_USERNAME = "aura";
const DEFAULT_PASSWORD = "1234";
const AUTH_KEY = "aura_auth";
const USER_KEY = "aura_user";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      const stored = localStorage.getItem(USER_KEY);
      let validUser = DEFAULT_USERNAME;
      let validPass = DEFAULT_PASSWORD;

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          validUser = parsed.username ?? DEFAULT_USERNAME;
          validPass = parsed.password ?? DEFAULT_PASSWORD;
        } catch {
          // ignore parse errors, use defaults
        }
      }

      if (
        username.trim().toLowerCase() === validUser &&
        password === validPass
      ) {
        if (!stored) {
          localStorage.setItem(
            USER_KEY,
            JSON.stringify({
              username: DEFAULT_USERNAME,
              password: DEFAULT_PASSWORD,
            }),
          );
        }
        localStorage.setItem(AUTH_KEY, "true");
        setIsLoading(false);
        onLogin();
      } else {
        setIsLoading(false);
        setError("ACCESS DENIED — Invalid credentials");
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background grid-bg relative overflow-hidden flex items-center justify-center">
      {/* Atmospheric glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-neon-green/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-neon-amber/5 blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[250px] h-[250px] rounded-full bg-neon-green/4 blur-[80px] pointer-events-none" />
      <div className="absolute inset-0 scanline-bg pointer-events-none opacity-30" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-px h-10 bg-gradient-to-b from-transparent to-neon-green/60" />
            <Cpu size={22} className="text-neon-green/70" />
            <div className="w-px h-10 bg-gradient-to-b from-transparent to-neon-green/60" />
          </div>
          <h1 className="font-display text-7xl font-black tracking-widest neon-glow text-neon-green mb-3">
            AURA
          </h1>
          <p className="text-muted-foreground font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase">
            Adaptive Unified Response Assistant
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-green/40 to-transparent" />
            <span className="font-mono text-[9px] text-neon-green/40 tracking-widest">
              v1.0
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-green/40 to-transparent" />
          </div>
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card-dark rounded-sm border neon-border p-8"
        >
          <div className="mb-6 text-center">
            <p className="font-display text-xs tracking-[0.25em] text-neon-green/70 uppercase">
              System Access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-username"
                className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase"
              >
                Username
              </label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-green/40"
                />
                <input
                  id="login-username"
                  data-ocid="login.input"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                  className={cn(
                    "w-full bg-surface-2 border text-foreground font-mono text-sm pl-9 pr-3 py-2.5 rounded-sm",
                    "focus:outline-none focus:border-neon-green/60 placeholder:text-muted-foreground/40 transition-all",
                    error ? "border-destructive/50" : "border-border",
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-green/40"
                />
                <input
                  id="login-password"
                  data-ocid="login.password_input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                  className={cn(
                    "w-full bg-surface-2 border text-foreground font-mono text-sm pl-9 pr-10 py-2.5 rounded-sm",
                    "focus:outline-none focus:border-neon-green/60 placeholder:text-muted-foreground/40 transition-all",
                    error ? "border-destructive/50" : "border-border",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-neon-green/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                data-ocid="login.error_state"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/40 rounded-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                <span className="font-mono text-xs text-destructive-foreground">
                  {error}
                </span>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              data-ocid="login.submit_button"
              disabled={isLoading || !username.trim() || !password}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-sm border font-display text-xs tracking-[0.2em] transition-all",
                "border-neon-green/50 bg-neon-green/10 text-neon-green",
                "hover:bg-neon-green/20 hover:border-neon-green/80",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isLoading && "animate-pulse",
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border border-neon-green/60 border-t-neon-green rounded-full animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <span>INITIALIZE SESSION</span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center font-mono text-[10px] text-muted-foreground/30 tracking-wider">
            DEFAULT: aura / 1234
          </p>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6 text-[10px] font-mono text-muted-foreground/30"
        >
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-green/40 hover:text-neon-green/70 transition-colors"
          >
            caffeine.ai
          </a>
        </motion.p>
      </div>
    </div>
  );
}
