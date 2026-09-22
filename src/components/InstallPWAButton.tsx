import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPWAButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS
      window.navigator.standalone === true;
    if (standalone) setInstalled(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setDeferred(null);
    } else {
      // Likely iOS Safari — show instructions
      setIosHint(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all duration-300 active:scale-95"
        style={{
          background: "linear-gradient(180deg, #E53935, #C62828)",
          boxShadow: "0 10px 28px rgba(198,40,40,0.35)",
          border: "1px solid rgba(255,255,255,0.2)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <span aria-hidden style={{ fontSize: "1.1rem" }}>
          ⬇
        </span>
        Instalar neste dispositivo
      </button>
      {iosHint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setIosHint(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm text-center shadow-2xl"
            style={{ border: "1px solid rgba(198,40,40,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#C62828] mb-2">Instalar no iPhone/iPad</h3>
            <p className="text-sm text-neutral-700">
              Toque no botão <strong>Compartilhar</strong> do Safari e selecione
              <strong> "Adicionar à Tela de Início"</strong> para instalar o aplicativo.
            </p>
            <button
              onClick={() => setIosHint(false)}
              className="mt-5 px-5 py-2 rounded-lg font-bold text-white"
              style={{ background: "#C62828" }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
