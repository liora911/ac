"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Shield, AlertTriangle, Radio, Fingerprint, Eye } from "lucide-react";

// Fake incident ID generator
function generateIncidentId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "SEC-";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// Get real-ish browser/system info to display (all client-side, public info)
function getSystemInfo() {
  if (typeof window === "undefined") return {};
  const nav = navigator;
  return {
    userAgent: nav.userAgent.slice(0, 80) + "...",
    platform: nav.platform || "Unknown",
    language: nav.language || "Unknown",
    screen: `${screen.width}x${screen.height}`,
    colorDepth: `${screen.colorDepth}-bit`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cores: nav.hardwareConcurrency ? `${nav.hardwareConcurrency} cores` : "Unknown",
    online: nav.onLine ? "Connected" : "Offline",
    cookiesEnabled: nav.cookieEnabled ? "Yes" : "No",
  };
}

const SCAN_LINES = [
  "Initializing security protocol...",
  "Scanning connection parameters...",
  "Detecting client fingerprint...",
  "Cross-referencing access credentials...",
  "Analyzing request headers...",
  "Checking authorization matrix...",
  "Validating security clearance...",
  ">>> ACCESS DENIED <<<",
  "Flagging unauthorized access attempt...",
  "Generating incident report...",
  "Logging session data to security database...",
  "Notifying system administrators...",
  "Session recorded. Do not attempt again.",
];

// Matrix rain character set
const MATRIX_CHARS = "אבגדהוזחטיכלמנסעפצקרשת0123456789ABCDEF@#$%&";

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f0";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        // Randomly make some characters red for menacing effect
        ctx.fillStyle = Math.random() > 0.97 ? "#ff0000" : `rgba(0, ${150 + Math.random() * 105}, 0, ${0.5 + Math.random() * 0.5})`;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 45);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 opacity-30"
    />
  );
}

function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`relative inline-block ${className}`}>
      <span className={glitch ? "opacity-0" : ""}>{text}</span>
      {glitch && (
        <>
          <span className="absolute top-0 left-0 text-red-500" style={{ clipPath: "inset(0 0 50% 0)", transform: "translateX(-2px)" }}>
            {text}
          </span>
          <span className="absolute top-0 left-0 text-cyan-400" style={{ clipPath: "inset(50% 0 0 0)", transform: "translateX(2px)" }}>
            {text}
          </span>
        </>
      )}
    </span>
  );
}

export default function UnauthorizedScreen() {
  const [scanLines, setScanLines] = useState<string[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [systemInfo, setSystemInfo] = useState<Record<string, string>>({});
  const [incidentId] = useState(generateIncidentId);
  const [showInfo, setShowInfo] = useState(false);
  const [pulseRed, setPulseRed] = useState(false);
  const [accessCount, setAccessCount] = useState(1);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Track repeat visits
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("_sec_attempts");
      const count = stored ? parseInt(stored, 10) + 1 : 1;
      sessionStorage.setItem("_sec_attempts", String(count));
      setAccessCount(count);
    } catch {
      // ignore
    }
  }, []);

  // Collect display info
  useEffect(() => {
    setSystemInfo(getSystemInfo() as Record<string, string>);
  }, []);

  // Typing effect for terminal
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < SCAN_LINES.length) {
        setScanLines((prev) => [...prev, SCAN_LINES[i]]);
        i++;
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      } else {
        clearInterval(timer);
        setScanComplete(true);
        setPulseRed(true);
        setTimeout(() => setShowInfo(true), 500);
      }
    }, 400);

    return () => clearInterval(timer);
  }, []);

  // Disable right-click and keyboard shortcuts on this page
  const blockEvent = useCallback((e: Event) => {
    e.preventDefault();
    return false;
  }, []);

  useEffect(() => {
    document.addEventListener("contextmenu", blockEvent);
    const handleKeydown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [blockEvent]);

  return (
    <div className="fixed inset-0 bg-black text-green-400 font-mono overflow-hidden select-none cursor-not-allowed z-50">
      <MatrixRain />

      {/* Pulsing red border when scan complete */}
      {pulseRed && (
        <div className="fixed inset-0 z-10 pointer-events-none border-2 border-red-600 animate-pulse" />
      )}

      {/* Scan lines overlay */}
      <div
        className="fixed inset-0 z-10 pointer-events-none opacity-10"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)",
        }}
      />

      {/* Main content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        {/* Top warning bar */}
        <div className="absolute top-0 left-0 right-0 bg-red-900/80 backdrop-blur-sm border-b border-red-600 px-4 py-2 flex items-center justify-between text-red-200 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 animate-pulse text-red-400" />
            <span>SECURITY MONITORING ACTIVE</span>
          </div>
          <div className="flex items-center gap-4">
            <span>INCIDENT: {incidentId}</span>
            <span className="text-red-400 font-bold">
              {accessCount > 1 ? `ATTEMPT #${accessCount} DETECTED` : "THREAT LEVEL: HIGH"}
            </span>
          </div>
        </div>

        {/* Shield icon with pulse */}
        <div className="relative mb-6 mt-8">
          <div className="absolute inset-0 bg-red-600/20 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
          <div className="relative w-20 h-20 rounded-full bg-red-900/60 border-2 border-red-500 flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-bold text-red-500 mb-2 tracking-wider text-center">
          <GlitchText text="UNAUTHORIZED ACCESS DETECTED" />
        </h1>
        <p className="text-red-400/70 text-sm mb-6 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          This restricted area is monitored and protected
          <AlertTriangle className="w-4 h-4" />
        </p>

        {/* Terminal */}
        <div className="w-full max-w-2xl bg-black/80 border border-green-900/50 rounded-lg overflow-hidden backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-950/50 border-b border-green-900/50">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-green-600 text-xs ml-2">security@ace-server ~ /var/log/intrusion</span>
          </div>
          <div ref={terminalRef} className="p-4 h-64 overflow-y-auto text-sm space-y-1">
            {scanLines.map((line, i) => (
              <div
                key={i}
                className={`${
                  line.includes("DENIED")
                    ? "text-red-500 font-bold text-base"
                    : line.includes("Notifying") || line.includes("recorded")
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                <span className="text-green-700 mr-2">
                  [{new Date(Date.now() - (SCAN_LINES.length - i) * 400).toLocaleTimeString()}]
                </span>
                {line}
              </div>
            ))}
            {!scanComplete && (
              <span className="inline-block w-2 h-4 bg-green-400 animate-pulse" />
            )}
          </div>
        </div>

        {/* Detected info panel */}
        {showInfo && (
          <div className="w-full max-w-2xl mt-4 bg-red-950/40 border border-red-900/50 rounded-lg p-4 backdrop-blur-sm animate-fade-in">
            <div className="flex items-center gap-2 text-red-400 text-sm font-bold mb-3">
              <Fingerprint className="w-4 h-4" />
              CAPTURED SESSION DATA
              <Eye className="w-4 h-4 ml-auto animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {Object.entries(systemInfo).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-red-500/70 uppercase min-w-[100px]">{key}:</span>
                  <span className="text-red-300/90 break-all">{value}</span>
                </div>
              ))}
              <div className="flex gap-2">
                <span className="text-red-500/70 uppercase min-w-[100px]">TIMESTAMP:</span>
                <span className="text-red-300/90">{new Date().toISOString()}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-red-500/70 uppercase min-w-[100px]">INCIDENT:</span>
                <span className="text-red-300/90">{incidentId}</span>
              </div>
            </div>

            {accessCount > 1 && (
              <div className="mt-3 pt-3 border-t border-red-800/50 text-yellow-400 text-xs font-bold animate-pulse">
                WARNING: {accessCount} unauthorized access attempts from this session have been recorded.
                Continued attempts will result in permanent IP blacklisting.
              </div>
            )}
          </div>
        )}

        {/* Bottom warning */}
        {scanComplete && (
          <p className="mt-6 text-red-600/60 text-xs text-center max-w-md animate-pulse">
            All access attempts are permanently logged. This incident has been reported to system administrators.
            Your session fingerprint has been recorded.
          </p>
        )}
      </div>
    </div>
  );
}
