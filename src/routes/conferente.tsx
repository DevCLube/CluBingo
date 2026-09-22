import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useBingoState } from "@/lib/bingo-store";
import { FullscreenButton } from "@/components/FullscreenButton";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/conferente")({
  head: () => ({ meta: [{ title: "Conferente — Clube Pirassununga Bingo" }] }),
  component: ConferentePage,
});

const BINGO_LETTERS = ["B", "I", "N", "G", "O"] as const;
const ADMIN_PASSWORD = "4922";
const IDLE_RESET_MS = 5000;

type CellProps = { n: number; on: boolean; isLast: boolean };

const Cell = memo(function Cell({ n, on, isLast }: CellProps) {
  const style: React.CSSProperties = on
    ? {
        background: "#C62828",
        color: "#fff",
        border: "2px solid #C62828",
        boxShadow: isLast
          ? "0 0 0 4px rgba(198,40,40,0.30), 0 10px 24px rgba(198,40,40,0.40)"
          : "0 2px 6px rgba(198,40,40,0.25)",
        transform: isLast ? "scale(1.08)" : "none",
      }
    : {
        background: "#fff",
        color: "#222",
        border: "1.5px solid rgba(0,0,0,0.10)",
      };
  return (
    <div
      className="aspect-square flex items-center justify-center rounded-2xl font-extrabold select-none"
      style={{
        ...style,
        fontSize: "clamp(1.6rem, 3.6cqi, 3.2rem)",
        transition: "transform 120ms ease, background-color 80ms linear, box-shadow 120ms ease",
        contain: "layout paint",
      }}
    >
      {n}
    </div>
  );
});

const LetterBadge = memo(function LetterBadge({ letter }: { letter: string }) {
  return (
    <div
      className="aspect-square flex items-center justify-center rounded-2xl font-black tracking-wider select-none"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #fff5f5 100%)",
        color: "#C62828",
        border: "2px solid #C62828",
        boxShadow: "0 6px 16px rgba(198,40,40,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
        fontSize: "clamp(1.6rem, 3.6cqi, 3.4rem)",
        fontFamily: "'Oswald', 'Inter', sans-serif",
      }}
    >
      {letter}
    </div>
  );
});

function ConferentePage() {
  const navigate = useNavigate();
  const { drawn, last_num } = useBingoState();
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [showExit, setShowExit] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);
  const drawnSet = useMemo(() => new Set(drawn), [drawn]);

  const isVertical = orientation === "vertical";

  // --- Pan + auto-fit ---
  const viewportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [userZoom, setUserZoom] = useState(1); // 1 = fit
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    pointerId: number;
  } | null>(null);
  const idleTimer = useRef<number | null>(null);
  const interactedRef = useRef(false);

  const scheduleReset = useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    if (!interactedRef.current) return;
    idleTimer.current = window.setTimeout(() => {
      interactedRef.current = false;
      setPan({ x: 0, y: 0 });
      setUserZoom(1);
    }, IDLE_RESET_MS);
  }, []);

  const markInteracted = useCallback(() => {
    interactedRef.current = true;
    scheduleReset();
  }, [scheduleReset]);

  // Recompute fit scale
  const recomputeFit = useCallback(() => {
    const vp = viewportRef.current;
    const bd = boardRef.current;
    if (!vp || !bd) return;
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    const bw = bd.offsetWidth;
    const bh = bd.offsetHeight;
    if (bw === 0 || bh === 0) return;
    const s = Math.min(vw / bw, vh / bh) * 0.98;
    setFitScale(s > 0 ? s : 1);
  }, []);

  useLayoutEffect(() => {
    recomputeFit();
    const ro = new ResizeObserver(recomputeFit);
    if (viewportRef.current) ro.observe(viewportRef.current);
    if (boardRef.current) ro.observe(boardRef.current);
    window.addEventListener("orientationchange", recomputeFit);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", recomputeFit);
    };
  }, [recomputeFit, isVertical]);

  // Pointer drag handlers
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: pan.x,
      baseY: pan.y,
      pointerId: e.pointerId,
    };
    setDragging(true);
    markInteracted();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const st = dragState.current;
    if (!st || st.pointerId !== e.pointerId) return;
    setPan({ x: st.baseX + (e.clientX - st.startX), y: st.baseY + (e.clientY - st.startY) });
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    if (dragState.current?.pointerId === e.pointerId) {
      dragState.current = null;
      setDragging(false);
      scheduleReset();
    }
  };

  useEffect(
    () => () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    },
    [],
  );

  // Bloqueio de saída
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.history.pushState(null, "", window.location.href);
    const onPop = () => {
      window.history.pushState(null, "", window.location.href);
      setShowExit(true);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  const tryExit = () => {
    if (pwd === ADMIN_PASSWORD) {
      setShowExit(false);
      setPwd("");
      setPwdError(false);
      navigate({ to: "/" });
    } else {
      setPwdError(true);
    }
  };

  const horizontalCells = useMemo(() => {
    const nodes: React.ReactNode[] = [];
    for (let row = 0; row < 5; row++) {
      nodes.push(<LetterBadge key={`L-${row}`} letter={BINGO_LETTERS[row]} />);
      for (let col = 0; col < 15; col++) {
        const n = row * 15 + col + 1;
        nodes.push(<Cell key={n} n={n} on={drawnSet.has(n)} isLast={n === last_num} />);
      }
    }
    return nodes;
  }, [drawnSet, last_num]);

  const verticalCells = useMemo(() => {
    const nodes: React.ReactNode[] = [];
    for (let col = 0; col < 5; col++)
      nodes.push(<LetterBadge key={`L-${col}`} letter={BINGO_LETTERS[col]} />);
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 5; col++) {
        const n = col * 15 + row + 1;
        nodes.push(<Cell key={n} n={n} on={drawnSet.has(n)} isLast={n === last_num} />);
      }
    }
    return nodes;
  }, [drawnSet, last_num]);

  const totalScale = fitScale * userZoom;

  const resetView = () => {
    interactedRef.current = false;
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    setPan({ x: 0, y: 0 });
    setUserZoom(1);
  };

  const bumpZoom = (delta: number) => {
    setUserZoom((z) => Math.min(2.5, Math.max(0.7, z + delta)));
    markInteracted();
  };

  return (
    <div className="h-[100dvh] w-full bg-[#f7f7f8] relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
        <img src={logo} alt="" className="w-[50vw] max-w-[600px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-3 md:px-5 py-2 md:py-3 border-b border-neutral-200 bg-white/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <img
            src={logo}
            alt=""
            className="w-9 h-9 md:w-10 md:h-10 rounded-full shrink-0"
            style={{ objectFit: "cover" }}
          />
          <div className="min-w-0">
            <h1 className="font-bold text-neutral-800 leading-tight text-sm md:text-base truncate">
              Tela do Conferente
            </h1>
            <p className="text-[10px] md:text-xs text-neutral-500">Atualização em tempo real</p>
          </div>
        </div>
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
          <FullscreenButton />
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={() => {
              setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"));
              resetView();
            }}
            className="px-2.5 md:px-3 py-1.5 bg-white border border-[#C62828]/30 rounded-lg font-bold text-[#C62828] hover:bg-[#fff5f5] active:scale-95 transition text-xs md:text-sm"
          >
            {isVertical ? "↔ Horizontal" : "↕ Vertical"}
          </button>
          <button
            onClick={() => bumpZoom(-0.1)}
            className="px-2.5 md:px-3 py-1.5 bg-white border border-neutral-200 rounded-lg font-bold text-neutral-600 hover:bg-neutral-100 active:scale-95 transition"
          >
            −
          </button>
          <button
            onClick={resetView}
            className="px-2 py-1.5 text-xs md:text-sm font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition"
            title="Ajustar à tela"
          >
            ⤢
          </button>
          <button
            onClick={() => bumpZoom(0.1)}
            className="px-2.5 md:px-3 py-1.5 bg-white border border-neutral-200 rounded-lg font-bold text-neutral-600 hover:bg-neutral-100 active:scale-95 transition"
          >
            +
          </button>
          <button
            onClick={() => setShowExit(true)}
            className="ml-1 md:ml-2 px-2.5 md:px-3 py-1.5 text-xs md:text-sm font-semibold text-[#C62828] hover:bg-[#fff5f5] rounded-lg transition"
          >
            ← Início
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-[1fr_minmax(240px,32%)] gap-2 md:gap-3 p-2 md:p-3 min-h-0">
        {/* Cartela */}
        <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 border-b border-neutral-100 bg-gradient-to-b from-white to-neutral-50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-8 rounded-full bg-[#C62828]" />
              <div>
                <h2 className="text-sm md:text-base font-bold text-neutral-800 leading-tight">
                  Cartela 1 — 75
                </h2>
                <p className="text-[10px] md:text-[11px] text-neutral-500">
                  Arraste para inspecionar · retorna em 5s
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                  Chamados
                </div>
                <div className="text-lg md:text-xl font-black text-[#C62828] leading-none">
                  {drawn.length}
                  <span className="text-xs text-neutral-400 font-bold">/75</span>
                </div>
              </div>
              {last_num !== null && (
                <div>
                  <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                    Último
                  </div>
                  <div className="text-lg md:text-xl font-black text-[#C62828] leading-none">
                    {last_num}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Viewport with pan */}
          <div
            ref={viewportRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            className="relative flex-1 overflow-hidden"
            style={{
              cursor: dragging ? "grabbing" : "grab",
              touchAction: "none",
              background: "radial-gradient(ellipse at center, #fafafa 0%, #f0f0f2 100%)",
            }}
          >
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${totalScale})`,
                transformOrigin: "center center",
                transition: dragging ? "none" : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
                willChange: "transform",
              }}
            >
              <div
                ref={boardRef}
                className="grid gap-2"
                style={{
                  containerType: "inline-size",
                  gridTemplateColumns: isVertical ? "repeat(5, 92px)" : "repeat(16, 72px)",
                  padding: "8px",
                }}
              >
                {isVertical ? verticalCells : horizontalCells}
              </div>
            </div>

            {/* Zoom indicator */}
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-white/80 backdrop-blur text-[10px] font-bold text-neutral-600 border border-neutral-200 shadow-sm pointer-events-none">
              {Math.round(userZoom * 100)}%
            </div>
          </div>
        </section>

        {/* Histórico */}
        <aside className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 border-b border-neutral-100 bg-gradient-to-b from-white to-neutral-50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-8 rounded-full bg-neutral-400" />
              <div>
                <h2 className="text-sm md:text-base font-bold text-neutral-800 leading-tight">
                  Histórico
                </h2>
                <p className="text-[10px] md:text-[11px] text-neutral-500">Ordem cronológica</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Total
              </div>
              <div className="text-lg md:text-xl font-black text-neutral-700 leading-none">
                {drawn.length}
              </div>
            </div>
          </div>
          <div
            className="flex-1 overflow-auto p-2.5 md:p-3"
            style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
          >
            {drawn.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-neutral-400 italic">Aguardando primeiro sorteio…</p>
              </div>
            ) : (
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))" }}
              >
                {drawn.map((n, i) => {
                  const isLast = i === drawn.length - 1;
                  return (
                    <div
                      key={`${n}-${i}`}
                      className="aspect-square flex flex-col items-center justify-center rounded-xl font-extrabold text-white"
                      style={{
                        background: isLast ? "#C62828" : "#9CA3AF",
                        boxShadow: isLast
                          ? "0 0 0 3px rgba(198,40,40,0.25), 0 8px 18px rgba(198,40,40,0.35)"
                          : "0 1px 3px rgba(0,0,0,0.08)",
                        transform: isLast ? "scale(1.05)" : "none",
                        transition: "transform 120ms ease, background-color 80ms linear",
                      }}
                    >
                      <span style={{ fontSize: "clamp(1rem, 1.8vw, 1.45rem)", lineHeight: 1 }}>
                        {n}
                      </span>
                      <span className="text-[9px] opacity-70 mt-0.5">#{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </main>

      {showExit && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-in fade-in duration-200"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
            style={{
              border: "1px solid rgba(198,40,40,0.3)",
              boxShadow: "0 30px 80px rgba(198,40,40,0.25)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: "#C62828" }}
              >
                🔒
              </div>
              <h3 className="text-lg font-bold text-neutral-800">Saída protegida</h3>
            </div>
            <p className="text-sm text-neutral-600 mb-4">
              Digite a senha do administrador para sair da tela do conferente.
            </p>
            <input
              type="password"
              autoFocus
              value={pwd}
              onChange={(e) => {
                setPwd(e.target.value);
                setPwdError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && tryExit()}
              placeholder="Senha"
              className="w-full px-4 py-3 rounded-lg border-2 outline-none text-lg font-semibold tracking-widest text-center transition"
              style={{
                borderColor: pwdError ? "#C62828" : "rgba(198,40,40,0.25)",
                background: "#fafafa",
              }}
            />
            {pwdError && (
              <p className="mt-2 text-sm font-semibold text-[#C62828]">Senha inválida</p>
            )}
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowExit(false);
                  setPwd("");
                  setPwdError(false);
                }}
                className="px-5 py-2.5 rounded-lg font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={tryExit}
                className="px-5 py-2.5 rounded-lg font-bold text-white transition active:scale-95"
                style={{
                  background: "linear-gradient(180deg, #E53935, #C62828)",
                  boxShadow: "0 6px 16px rgba(198,40,40,0.35)",
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
