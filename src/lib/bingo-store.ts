import { useEffect, useRef, useState } from "react";
import type { BingoState } from "@/lib/bingo-types";

export type { BingoState } from "@/lib/bingo-types";

type PendingOp = { kind: "draw"; n: number } | { kind: "toggle"; n: number } | { kind: "reset" };

const CACHE_KEY = "bingo_state_cache_v1";
const QUEUE_KEY = "bingo_pending_ops_v1";
const STREAM_URL = "/api/bingo/stream";
const STATE_URL = "/api/bingo/state";

// ---------------------------------------------------------------------------
// Local (offline-first) state + pending operations queue
// ---------------------------------------------------------------------------

let localState: BingoState = { drawn: [], last_num: null };
let pending: PendingOp[] = [];

function isBrowser() {
  return typeof window !== "undefined";
}

function loadPersisted() {
  if (!isBrowser()) return;
  try {
    const rawState = localStorage.getItem(CACHE_KEY);
    if (rawState) {
      const p = JSON.parse(rawState) as BingoState;
      if (Array.isArray(p?.drawn)) localState = { drawn: p.drawn, last_num: p.last_num ?? null };
    }
    const rawQueue = localStorage.getItem(QUEUE_KEY);
    if (rawQueue) {
      const q = JSON.parse(rawQueue);
      if (Array.isArray(q)) pending = q as PendingOp[];
    }
  } catch {
    /* ignore corrupt cache */
  }
}
loadPersisted();

function persistState() {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(localState));
  } catch {
    /* quota */
  }
}

function persistQueue() {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(pending));
  } catch {
    /* quota */
  }
}

function applyOp(s: BingoState, op: PendingOp): BingoState {
  if (op.kind === "reset") return { drawn: [], last_num: null };
  const has = s.drawn.includes(op.n);
  if (op.kind === "draw") {
    if (has) return s;
    return { drawn: [...s.drawn, op.n], last_num: op.n };
  }
  // toggle
  if (has) {
    const drawn = s.drawn.filter((x) => x !== op.n);
    const last_num = s.last_num === op.n ? (drawn[drawn.length - 1] ?? null) : s.last_num;
    return { drawn, last_num };
  }
  return { drawn: [...s.drawn, op.n], last_num: op.n };
}

// ---------------------------------------------------------------------------
// Realtime SSE stream
// ---------------------------------------------------------------------------

let eventSource: EventSource | null = null;
let refCount = 0;
const listeners = new Set<(s: BingoState) => void>();
const syncListeners = new Set<(pendingCount: number) => void>();

function emit(s: BingoState) {
  localState = s;
  persistState();
  listeners.forEach((l) => l(s));
}

function emitSync() {
  syncListeners.forEach((l) => l(pending.length));
}

// Remote updates are ignored while we still hold local operations that the
// server hasn't accepted yet — otherwise a stale DB row would wipe offline work.
function applyRemote(s: BingoState) {
  if (pending.length > 0) return;
  const cur = localState;
  if (cur.drawn.length === s.drawn.length && cur.last_num === s.last_num) return;
  emit(s);
}

function acquireStream(): EventSource {
  if (!eventSource) {
    const es = new EventSource(STREAM_URL);
    es.onmessage = (ev) => {
      try {
        const p = JSON.parse(ev.data) as BingoState;
        if (p && Array.isArray(p.drawn)) {
          applyRemote({ drawn: p.drawn, last_num: p.last_num ?? null });
        }
      } catch {
        /* ignore malformed events */
      }
    };
    es.onerror = () => {
      // EventSource auto-reconnects; state merges back via reconcile on open.
    };
    eventSource = es;
  }
  refCount++;
  return eventSource;
}

function releaseStream() {
  refCount--;
  if (refCount <= 0 && eventSource) {
    eventSource.close();
    eventSource = null;
    refCount = 0;
  }
}

// ---------------------------------------------------------------------------
// Server communication
// ---------------------------------------------------------------------------

async function runOp(op: PendingOp) {
  if (op.kind === "reset") {
    const res = await fetch("/api/bingo/reset", { method: "POST" });
    if (!res.ok) throw new Error(`reset falhou: ${res.status}`);
    return;
  }
  const endpoint = op.kind === "draw" ? "/api/bingo/draw" : "/api/bingo/toggle";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ n: op.n }),
  });
  if (!res.ok) throw new Error(`${op.kind} falhou: ${res.status}`);
}

async function reconcile() {
  if (isBrowser() && navigator.onLine === false) return;
  try {
    const res = await fetch(STATE_URL);
    if (!res.ok) return;
    const data = (await res.json()) as BingoState;
    applyRemote(data);
  } catch {
    /* offline: keep cache */
  }
}

// ---------------------------------------------------------------------------
// Queue flushing
// ---------------------------------------------------------------------------

let flushing = false;

export async function flushPending(): Promise<boolean> {
  if (flushing || pending.length === 0) return pending.length === 0;
  if (isBrowser() && navigator.onLine === false) return false;
  flushing = true;
  try {
    while (pending.length > 0) {
      const op = pending[0]!;
      try {
        await runOp(op);
      } catch {
        return false; // stay queued, retry later
      }
      pending = pending.slice(1);
      persistQueue();
      emitSync();
    }
    // Everything synced: fetch the authoritative state so all screens converge.
    await reconcile();
    return true;
  } finally {
    flushing = false;
  }
}

if (isBrowser()) {
  window.addEventListener("online", () => {
    void flushPending();
  });
  setInterval(() => {
    if (pending.length > 0) void flushPending();
  }, 4000);
}

async function perform(op: PendingOp) {
  const next = applyOp(localState, op);
  emit(next);

  if (isBrowser() && navigator.onLine === false) {
    pending.push(op);
    persistQueue();
    emitSync();
    return;
  }

  if (pending.length > 0) {
    // Preserve ordering: everything goes through the queue until it drains.
    pending.push(op);
    persistQueue();
    emitSync();
    void flushPending();
    return;
  }

  try {
    await runOp(op);
  } catch {
    pending.push(op);
    persistQueue();
    emitSync();
    void flushPending();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function useBingoState() {
  const [state, setState] = useState<BingoState>(localState);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let mounted = true;

    const onUpdate = (s: BingoState) => {
      if (!mounted) return;
      stateRef.current = s;
      setState({ drawn: s.drawn, last_num: s.last_num });
    };
    listeners.add(onUpdate);
    acquireStream();

    // Show cached state instantly (works with no network at all).
    onUpdate(localState);
    setLoaded(true);

    void reconcile();
    void flushPending();

    return () => {
      mounted = false;
      listeners.delete(onUpdate);
      releaseStream();
    };
  }, []);

  return { ...state, loaded };
}

/** Online/offline + number of operations still waiting to sync. */
export function useSyncStatus() {
  const [online, setOnline] = useState(() => (isBrowser() ? navigator.onLine : true));
  const [pendingCount, setPendingCount] = useState(pending.length);

  useEffect(() => {
    const on = () => {
      setOnline(true);
      void flushPending();
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const l = (c: number) => setPendingCount(c);
    syncListeners.add(l);
    setPendingCount(pending.length);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      syncListeners.delete(l);
    };
  }, []);

  return { online, pendingCount };
}

export async function drawNumber(n: number, _current?: BingoState) {
  await perform({ kind: "draw", n });
}

export async function toggleNumber(n: number, _current?: BingoState) {
  await perform({ kind: "toggle", n });
}

export async function resetBingoState() {
  await perform({ kind: "reset" });
}
