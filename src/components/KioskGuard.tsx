import { useEffect } from "react";

/**
 * Activates kiosk-style input guards ONLY when the app is launched
 * as an installed PWA (display-mode: standalone | fullscreen).
 * In a normal browser tab this component is a no-op.
 */
export function KioskGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!mql) return;

    const prevent = (e: Event) => e.preventDefault();

    // Block right-click / long-press context menu
    document.addEventListener("contextmenu", prevent);

    // Block multi-touch pinch and gesture zoom (iOS)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("touchstart", onTouchStart, { passive: false });
    document.addEventListener("gesturestart", prevent as EventListener);

    // Block double-tap to zoom
    let lastTap = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTap < 300) e.preventDefault();
      lastTap = now;
    };
    document.addEventListener("touchend", onTouchEnd, { passive: false });

    // Block Ctrl/Cmd + +/-/0 zoom shortcuts
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("gesturestart", prevent as EventListener);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
