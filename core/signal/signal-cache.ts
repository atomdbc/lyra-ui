"use client";

import type { SignalAlert } from "@/core/signal/signal-types";

/**
 * Tiny IndexedDB cache so the /signal page hydrates instantly on refresh and
 * doesn't look empty when the WebSocket is still handshaking. Upserts by
 * alert id; entries older than TTL are pruned on read.
 *
 * Design: one store, one shape — no migrations, no schemas. If we evolve
 * AlertEnvelope, bump DB_VERSION and the browser will blow away the store.
 */

const DB_NAME = "lyra-signal";
const DB_VERSION = 1;
const STORE = "alerts";
export const SIGNAL_CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours
export const SIGNAL_CACHE_MAX_ENTRIES = 600;

type CachedAlert = SignalAlert & { _cachedAt: number };

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase | null> {
  if (!isBrowser()) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T | null> {
  return openDb().then((db) => {
    if (!db) return null;
    return new Promise<T | null>((resolve) => {
      try {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        let settled = false;
        const result = handler(store);
        Promise.resolve(result)
          .then((value) => {
            settled = true;
            tx.oncomplete = () => resolve(value);
            tx.onerror = () => resolve(value);
          })
          .catch(() => {
            settled = true;
            resolve(null);
          });
        tx.onerror = () => {
          if (!settled) resolve(null);
        };
      } catch {
        resolve(null);
      } finally {
        // Close DB after this transaction so we don't hold connections.
        Promise.resolve().then(() => db.close());
      }
    });
  });
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadCachedAlerts(): Promise<SignalAlert[]> {
  const result = await runTransaction("readonly", async (store) => {
    const items = (await promisify<CachedAlert[]>(store.getAll())) ?? [];
    const now = Date.now();
    const fresh = items.filter((item) => now - item._cachedAt < SIGNAL_CACHE_TTL_MS);
    fresh.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return fresh.map(stripCachedAt);
  });
  return result ?? [];
}

export async function upsertAlerts(alerts: SignalAlert[]): Promise<void> {
  if (!alerts.length) return;
  await runTransaction("readwrite", async (store) => {
    const now = Date.now();
    const tasks = alerts.map((alert) => {
      const cached: CachedAlert = { ...alert, _cachedAt: now };
      return promisify(store.put(cached)).catch(() => null);
    });
    await Promise.all(tasks);

    // Enforce TTL + max entries by pruning the oldest.
    const all = (await promisify<CachedAlert[]>(store.getAll())) ?? [];
    const overflow = all
      .filter((item) => now - item._cachedAt >= SIGNAL_CACHE_TTL_MS)
      .map((item) => item.id);
    const keeperCount = Math.max(0, all.length - overflow.length - SIGNAL_CACHE_MAX_ENTRIES);
    if (keeperCount > 0) {
      const sorted = all
        .filter((item) => !overflow.includes(item.id))
        .sort((a, b) => a._cachedAt - b._cachedAt);
      for (let index = 0; index < keeperCount; index += 1) {
        overflow.push(sorted[index].id);
      }
    }
    await Promise.all(
      overflow.map((id) => promisify(store.delete(id)).catch(() => null)),
    );
  });
}

export async function clearSignalCache(): Promise<void> {
  await runTransaction("readwrite", async (store) => {
    await promisify(store.clear()).catch(() => null);
  });
}

function stripCachedAt(item: CachedAlert): SignalAlert {
  const { _cachedAt, ...rest } = item;
  void _cachedAt;
  return rest;
}
