import type { BingoState } from "@/lib/bingo-types";

export type OpResult = { ok: true; state: BingoState } | { ok: false; error: string };
