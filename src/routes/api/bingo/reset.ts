import { createFileRoute } from "@tanstack/react-router";
import { resetState } from "@/server/bingo.service";

export const Route = createFileRoute("/api/bingo/reset")({
  server: {
    handlers: {
      POST: async () => {
        const result = resetState();
        if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
        return Response.json(result.state);
      },
    },
  },
});
