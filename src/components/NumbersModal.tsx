import { memo, useCallback } from "react";

type Props = {
  drawn: number[];
  onClose: () => void;
  onToggle?: (n: number) => void;
};

function NumbersModalImpl({ drawn, onClose, onToggle }: Props) {
  const set = new Set(drawn);
  const editable = !!onToggle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in"
      style={{
        background: "rgba(20,20,20,0.45)",
        backdropFilter: "blur(2px)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[90vh] flex flex-col rounded-3xl bg-[#F8F9FA]"
        style={{
          border: "1px solid rgba(198,40,40,0.18)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.18), 0 10px 30px rgba(198,40,40,0.10)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between px-8 py-6 border-b"
          style={{ borderColor: "rgba(0,0,0,0.06)" }}
        >
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: "#1F1F1F" }}>
              Números Sorteados
            </h2>
            <p className="text-sm mt-1" style={{ color: "#666" }}>
              Total:{" "}
              <span className="font-extrabold text-lg" style={{ color: "#C62828" }}>
                {drawn.length}
              </span>
              <span className="mx-1" style={{ color: "#999" }}>
                / 75
              </span>
              {editable && (
                <span className="ml-3 italic" style={{ color: "#888" }}>
                  Clique nos números para marcar/desmarcar
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white font-semibold text-sm transition-all flex items-center gap-2"
            style={{ border: "1px solid rgba(0,0,0,0.08)", color: "#444" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#C62828";
              e.currentTarget.style.color = "#C62828";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
              e.currentTarget.style.color = "#444";
            }}
          >
            Fechar <span aria-hidden>×</span>
          </button>
        </div>

        <div className="overflow-auto p-6 md:p-8">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
            {Array.from({ length: 75 }, (_, i) => i + 1).map((n) => {
              const on = set.has(n);
              const base: React.CSSProperties = on
                ? {
                    background: "linear-gradient(180deg, #E53935, #C62828)",
                    color: "#fff",
                    boxShadow: "0 6px 16px rgba(198,40,40,0.30)",
                    border: "1px solid #C62828",
                  }
                : {
                    background: "#fff",
                    color: "#444",
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  };
              return (
                <button
                  key={n}
                  type="button"
                  onClick={editable ? () => onToggle!(n) : undefined}
                  className="aspect-square flex items-center justify-center rounded-xl text-lg md:text-xl font-bold transition-transform duration-150"
                  style={{
                    ...base,
                    cursor: editable ? "pointer" : "default",
                    willChange: "transform",
                  }}
                  onMouseEnter={
                    editable
                      ? (e) => {
                          e.currentTarget.style.transform = "scale(1.08)";
                        }
                      : undefined
                  }
                  onMouseLeave={
                    editable
                      ? (e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      : undefined
                  }
                >
                  {n}
                </button>
              );
            })}
          </div>
          {drawn.length === 0 && (
            <p className="mt-6 text-sm" style={{ color: "#888" }}>
              Nenhum número sorteado ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export const NumbersModal = memo(NumbersModalImpl);
