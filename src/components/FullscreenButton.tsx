"use client";

import { useState, useEffect, useCallback } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBlockedMsg, setShowBlockedMsg] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setShowBlockedMsg(true);
      setTimeout(() => setShowBlockedMsg(false), 3000);
    }
  }, []);

  return (
    <>
      <button
        onClick={toggle}
        title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        aria-label={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #fff5f5 100%)",
          color: "#C62828",
          border: "2px solid #C62828",
          boxShadow: "0 6px 16px rgba(198,40,40,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 10px 24px rgba(198,40,40,0.35), inset 0 1px 0 rgba(255,255,255,0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            "0 6px 16px rgba(198,40,40,0.25), inset 0 1px 0 rgba(255,255,255,0.6)";
        }}
      >
        {isFullscreen ? (
          <>
            <Minimize2 size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Recolher</span>
          </>
        ) : (
          <>
            <Maximize2 size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Tela Cheia</span>
          </>
        )}
      </button>

      {showBlockedMsg && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-xl text-white font-semibold text-sm animate-in fade-in slide-in-from-top-4 duration-300"
          style={{
            background: "linear-gradient(180deg, #E53935, #C62828)",
            boxShadow: "0 10px 30px rgba(198,40,40,0.35)",
          }}
        >
          Navegador bloqueou a tela cheia. Tente pressionar F11.
        </div>
      )}
    </>
  );
}
