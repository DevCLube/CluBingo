import { createFileRoute } from "@tanstack/react-router";
import { getState } from "@/server/bingo.service";
import { registerSse, unregisterSse } from "@/server/sse.server";

export const Route = createFileRoute("/api/bingo/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            registerSse(controller);
            const initial = `data: ${JSON.stringify(getState())}\n\n`;
            controller.enqueue(encoder.encode(initial));
            request.signal?.addEventListener("abort", () => {
              unregisterSse(controller);
            });
          },
          cancel() {
            /* cleanup handled via abort listener */
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
