import { createFileRoute } from "@tanstack/react-router";
import { getState } from "@/server/bingo.service";

export const Route = createFileRoute("/api/bingo/state")({
  server: {
    handlers: {
      GET: async () => Response.json(getState()),
    },
  },
});
