import type { BingoState } from "@/lib/bingo-types";

const controllers = new Set<ReadableStreamDefaultController<Uint8Array>>();

const HEARTBEAT_INTERVAL_MS = 20_000;

export function registerSse(controller: ReadableStreamDefaultController<Uint8Array>): void {
  controllers.add(controller);
}

export function unregisterSse(controller: ReadableStreamDefaultController<Uint8Array>): void {
  controllers.delete(controller);
}

export function broadcastState(state: BingoState): void {
  const payload = `data: ${JSON.stringify(state)}\n\n`;
  const bytes = new TextEncoder().encode(payload);
  for (const controller of controllers) {
    try {
      controller.enqueue(bytes);
    } catch {
      controllers.delete(controller);
    }
  }
}

setInterval(() => {
  if (controllers.size === 0) return;
  const ping = new TextEncoder().encode(": ping\n\n");
  for (const controller of controllers) {
    try {
      controller.enqueue(ping);
    } catch {
      controllers.delete(controller);
    }
  }
}, HEARTBEAT_INTERVAL_MS);
