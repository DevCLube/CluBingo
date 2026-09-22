import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSorteadorAuthed, signOutSorteador } from "@/lib/auth-sorteador";
import {
  useBingoState,
  drawNumber,
  toggleNumber,
  resetBingoState,
  useSyncStatus,
} from "@/lib/bingo-store";
import { NumbersModal as AllNumbersModal } from "@/components/NumbersModal";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/sorteador")({
  head: () => ({ meta: [{ title: "Sorteador — Clube Pirassununga Bingo" }] }),
  component: SorteadorPage,
});

function SorteadorPage() {
  const nav = useNavigate();
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    if (!isSorteadorAuthed()) nav({ to: "/login" });
    else setAuthed(true);
  }, [nav]);
  if (!authed) return null;
  return <Sorteador nav={nav} />;
}

function Sorteador({ nav }: { nav: ReturnType<typeof useNavigate> }) {
  const { drawn, last_num, loaded } = useBingoState();
  const { online, pendingCount } = useSyncStatus();
  const [zoom, setZoom] = useState(1);
  const [hidden, setHidden] = useState(false);
  const [err, setErr] = useState("");
  const [val, setVal] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [pop, setPop] = useState(0);
  const inpRef = useRef<HTMLInputElement>(null);
  const lastSeen = useRef<number | null>(null);

  useEffect(() => {
    inpRef.current?.focus();
  }, []);

  useEffect(() => {
    if (last_num !== null && last_num !== lastSeen.current) {
      lastSeen.current = last_num;
      setPop((p) => p + 1);
    }
  }, [last_num]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement !== inpRef.current) {
        e.preventDefault();
        setHidden((h) => {
          const nh = !h;
          if (!nh) setTimeout(() => inpRef.current?.focus(), 50);
          return nh;
        });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const draw = useCallback(async () => {
    const v = parseInt(val, 10);
    if (isNaN(v) || v < 1 || v > 75) {
      setErr("Digite um número de 1 a 75");
      return;
    }
    if (drawn.includes(v)) {
      setErr("Número " + v + " já foi sorteado!");
      return;
    }
    setErr("");
    setVal("");
    setHidden(true);
    try {
      await drawNumber(v, { drawn, last_num });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Falha ao sortear");
    }
  }, [val, drawn, last_num]);

  const resetAll = useCallback(async () => {
    if (drawn.length === 0) return;
    if (!confirm("Resetar tudo?")) return;
    setErr("");
    setVal("");
    await resetBingoState();
  }, [drawn]);

  const toggleNumberLocal = useCallback(
    async (n: number) => {
      await toggleNumber(n, { drawn, last_num });
    },
    [drawn, last_num],
  );

  const onInpKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      draw();
    }
  };

  const ballSize = useMemo(() => `${28 * zoom}rem`, [zoom]);
  const logoSize = useMemo(() => `${28 * zoom}rem`, [zoom]);

  if (!loaded) return <div className="min-h-screen bg-[#f9f9f9]" />;

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col items-center relative overflow-hidden font-[Segoe_UI,sans-serif] text-neutral-800">
      {/* Background logo scales with ball */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <img
          src={logo}
          alt=""
          style={{
            width: logoSize,
            height: logoSize,
            maxWidth: "92vw",
            maxHeight: "92vh",
            opacity: 0.18,
            transition: "width 0.25s ease, height 0.25s ease",
            objectFit: "contain",
            willChange: "width, height",
            transform: "translateZ(0)",
          }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center w-full relative z-10">
        <div style={{ transition: "transform .25s ease", willChange: "transform" }}>
          {last_num !== null ? (
            <div
              key={pop}
              className="ball-anim flex items-center justify-center rounded-full"
              style={{
                width: ballSize,
                height: ballSize,
                background: "#C62828",
                border: "4px solid rgba(0,0,0,.1)",
                boxShadow: "0 0 60px 12px rgba(198,40,40,.4)",
                transition: "width 0.25s ease, height 0.25s ease",
                willChange: "width, height",
              }}
            >
              <span
                style={{
                  fontSize: `${16 * zoom}rem`,
                  fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1,
                  textShadow: "0 4px 20px rgba(0,0,0,.3)",
                }}
              >
                {last_num}
              </span>
            </div>
          ) : (
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: ballSize,
                height: ballSize,
                border: "4px dashed rgba(0,0,0,.1)",
                transition: "width 0.25s ease, height 0.25s ease",
              }}
            >
              <span
                style={{ fontSize: `${3 * zoom}rem`, color: "rgba(0,0,0,.3)", fontWeight: 600 }}
              >
                ?
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className={`absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center gap-3 transition-opacity ${hidden ? "hidden" : ""}`}
      >
        <div className="flex items-center gap-3 flex-wrap justify-center px-3">
          <input
            ref={inpRef}
            type="number"
            min={1}
            max={75}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={onInpKey}
            placeholder="Nº"
            className="w-20 text-center text-xl font-bold bg-white border-2 border-neutral-200 rounded-lg py-1.5 px-2 focus:outline-none focus:border-[#C62828] focus:ring-4 focus:ring-[#C62828]/30 appearance-none"
            style={{ MozAppearance: "textfield" } as React.CSSProperties}
          />
          <button
            onClick={draw}
            className="px-4 py-1.5 font-bold rounded-lg bg-neutral-300 hover:bg-neutral-400 text-neutral-700 active:scale-95 transition"
          >
            Sortear
          </button>
          <button
            onClick={resetAll}
            className="px-4 py-1.5 font-bold rounded-lg bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-200 active:scale-95 transition"
          >
            Reset
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
            aria-label="Aumentar zoom"
            className="p-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:bg-neutral-200"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
            aria-label="Diminuir zoom"
            className="p-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:bg-neutral-200"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button
            onClick={() => setShowAll(true)}
            className="px-4 py-1.5 font-bold rounded-lg bg-[#C62828] text-white hover:bg-[#A81F1F] active:scale-95 transition"
          >
            Exibir Todos os Números Sorteados
          </button>
        </div>
        {(!online || pendingCount > 0) && (
          <div
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: online ? "rgba(198,40,40,.10)" : "rgba(0,0,0,.06)",
              color: online ? "#C62828" : "#555",
            }}
          >
            {online
              ? `Sincronizando… ${pendingCount} pendente${pendingCount > 1 ? "s" : ""}`
              : `Offline — sorteio continua funcionando${pendingCount > 0 ? ` (${pendingCount} p/ sincronizar)` : ""}`}
          </div>
        )}
        {err && <div className="text-[#C62828] font-semibold text-sm">{err}</div>}
        <span className="text-xs text-neutral-400 mt-1">
          Pressione{" "}
          <kbd className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded font-mono text-[10px]">
            Enter
          </kbd>{" "}
          para ocultar/mostrar controles
        </span>
        <div className="flex gap-3 text-xs text-neutral-400">
          <Link to="/" className="hover:text-neutral-600">
            ← Início
          </Link>
          <button
            onClick={() => {
              signOutSorteador();
              nav({ to: "/" });
            }}
            className="hover:text-neutral-600"
          >
            Sair
          </button>
        </div>
      </div>

      {showAll && (
        <AllNumbersModal
          drawn={drawn}
          onClose={() => setShowAll(false)}
          onToggle={toggleNumberLocal}
        />
      )}

      <style>{`
        .ball-anim { animation: popIn .35s ease; }
        @keyframes popIn { 0%{transform:scale(.4);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
