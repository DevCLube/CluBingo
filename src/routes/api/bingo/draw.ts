import { createFileRoute } from "@tanstack/react-router";
import { drawNumber } from "@/server/bingo.service";

export const Route = createFileRoute("/api/bingo/draw")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { n?: unknown } | null;
        const n = typeof body?.n === "number" ? body.n : Number(body?.n);
        if (!Number.isInteger(n)) {
          return Response.json({ error: "Número inválido" }, { status: 400 });
        }
        const result = drawNumber(n);
        if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
        return Response.json(result.state);
      },
    },
  },
});
