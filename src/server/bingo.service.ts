import type { BingoState } from "@/lib/bingo-types";
import { getDb, nowIso } from "./db.server";
import type { OpResult } from "./bingo-types.server";
import { broadcastState } from "./sse.server";

const db = getDb();

const MIN_NUMBER = 1;
const MAX_NUMBER = 75;

type Row = { drawn: string; last_num: number | null };

function parseRow(row: Row): BingoState {
  let drawn: number[] = [];
  try {
    const parsed = JSON.parse(row.drawn) as unknown;
    if (Array.isArray(parsed)) {
      drawn = parsed.filter((n): n is number => Number.isInteger(n));
    }
  } catch {
    drawn = [];
  }
  return { drawn, last_num: row.last_num ?? null };
}

function loadState(): BingoState {
  const row = db.prepare("SELECT drawn, last_num FROM bingo_state WHERE id = 1").get() as Row;
  return parseRow(row);
}

function saveState(state: BingoState): void {
  db.prepare("UPDATE bingo_state SET drawn = ?, last_num = ?, updated_at = ? WHERE id = 1").run(
    JSON.stringify(state.drawn),
    state.last_num,
    nowIso(),
  );
}

function commit(state: BingoState): OpResult {
  db.transaction(() => saveState(state))();
  broadcastState(state);
  return { ok: true, state };
}

function isValidNumber(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_NUMBER && n <= MAX_NUMBER;
}

export function getState(): BingoState {
  return loadState();
}

export function drawNumber(n: number): OpResult {
  if (!isValidNumber(n)) return { ok: false, error: `Número inválido: ${n}` };
  const cur = loadState();
  if (cur.drawn.includes(n)) return { ok: true, state: cur };
  return commit({ drawn: [...cur.drawn, n], last_num: n });
}

export function toggleNumber(n: number): OpResult {
  if (!isValidNumber(n)) return { ok: false, error: `Número inválido: ${n}` };
  const cur = loadState();
  const has = cur.drawn.includes(n);
  if (has) {
    const drawn = cur.drawn.filter((x) => x !== n);
    const last_num = cur.last_num === n ? (drawn[drawn.length - 1] ?? null) : cur.last_num;
    return commit({ drawn, last_num });
  }
  return commit({ drawn: [...cur.drawn, n], last_num: n });
}

export function resetState(): OpResult {
  return commit({ drawn: [], last_num: null });
}
