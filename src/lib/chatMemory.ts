/**
 * chatMemory.ts — Long-term chat memory system
 *
 * Persists key facts the AI learns about the user across conversations.
 * Stored in localStorage per-user; injected into chat context as a compact
 * summary so the AI never "forgets" what was shared in previous sessions.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemoryCategory =
  | "preference"   // "prefiro treinos mais curtos"
  | "goal"         // "quero chegar a 80kg até Junho"
  | "fact"         // "lesionei o ombro na semana passada"
  | "achievement"  // "bateu recorde no agachamento"
  | "feedback";    // "gostei mais quando dás exemplos com séries e reps"

export interface MemoryEntry {
  id: string;
  category: MemoryCategory;
  content: string;
  timestamp: number;
  source: "user_stated" | "ai_inferred";
}

interface MemoryStore {
  entries: MemoryEntry[];
  lastUpdated: number;
  version: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORE_VERSION = 1;
const MAX_ENTRIES = 50;
// Entries older than 90 days are considered stale and are pruned
const STALE_MS = 90 * 24 * 60 * 60 * 1000;

const storageKey = (userId: string) => `liftmate_chat_memory_${userId}`;

// ─── Store I/O ────────────────────────────────────────────────────────────────

function readStore(userId: string): MemoryStore {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { entries: [], lastUpdated: 0, version: STORE_VERSION };
    const parsed = JSON.parse(raw) as MemoryStore;
    // Migrate from older schema if needed
    if (!parsed.version) parsed.version = STORE_VERSION;
    return parsed;
  } catch {
    return { entries: [], lastUpdated: 0, version: STORE_VERSION };
  }
}

function writeStore(userId: string, store: MemoryStore): void {
  try {
    store.lastUpdated = Date.now();
    localStorage.setItem(storageKey(userId), JSON.stringify(store));
  } catch {
    // localStorage quota exceeded — prune aggressively and retry
    store.entries = store.entries.slice(-20);
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(store));
    } catch {}
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns the full memory store for a user. */
export function getMemoryStore(userId: string): MemoryStore {
  return readStore(userId);
}

/** Returns all entries for a user, newest first. */
export function getMemoryEntries(userId: string): MemoryEntry[] {
  return readStore(userId).entries.slice().sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Adds a new memory entry.
 * Automatically deduplicates very similar entries (same category + first 40 chars)
 * and prunes stale / overflow entries.
 */
export function addMemoryEntry(
  userId: string,
  entry: Omit<MemoryEntry, "id" | "timestamp">
): MemoryEntry {
  const store = readStore(userId);
  const now = Date.now();

  const newEntry: MemoryEntry = {
    ...entry,
    id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now,
  };

  const fingerprint = `${entry.category}::${entry.content.slice(0, 40).toLowerCase()}`;
  store.entries = store.entries.filter((e) => {
    const ef = `${e.category}::${e.content.slice(0, 40).toLowerCase()}`;
    return ef !== fingerprint;
  });

  store.entries.push(newEntry);

  // Prune stale entries
  store.entries = store.entries.filter((e) => now - e.timestamp < STALE_MS);

  // Hard cap
  if (store.entries.length > MAX_ENTRIES) {
    // Keep the newest MAX_ENTRIES
    store.entries = store.entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_ENTRIES);
  }

  writeStore(userId, store);
  return newEntry;
}

/** Removes a specific entry by ID. */
export function removeMemoryEntry(userId: string, entryId: string): void {
  const store = readStore(userId);
  store.entries = store.entries.filter((e) => e.id !== entryId);
  writeStore(userId, store);
}

/** Wipes all memory for the user. */
export function clearMemory(userId: string): void {
  localStorage.removeItem(storageKey(userId));
}

// ─── Context Formatting ───────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  preference: "Preferência",
  goal:       "Objetivo declarado",
  fact:       "Facto pessoal",
  achievement:"Conquista",
  feedback:   "Feedback sobre respostas",
};

/**
 * Returns a compact text block suitable for injecting into the AI system prompt.
 * Returns empty string if there are no entries.
 */
export function formatMemoryForAI(userId: string): string {
  const entries = getMemoryEntries(userId);
  if (entries.length === 0) return "";

  const lines = entries.slice(0, 25).map((e) => {
    const label = CATEGORY_LABELS[e.category] ?? e.category;
    return `• [${label}] ${e.content}`;
  });

  return `\n🧠 MEMÓRIA DE SESSÕES ANTERIORES (factos que o utilizador já partilhou):\n${lines.join("\n")}`;
}

// ─── Auto-extraction helpers ──────────────────────────────────────────────────

/**
 * Keyword patterns that trigger automatic memory extraction
 * from a user message.
 */
const EXTRACTION_RULES: Array<{
  pattern: RegExp;
  category: MemoryCategory;
  source: MemoryEntry["source"];
}> = [
  // Injuries / limitations
  { pattern: /\b(lesione[io]|dor[eo]?|magu[oe]|lesão|tendinite|hérnia|cirurgia)\b/i,       category: "fact",       source: "user_stated" },
  // Goals with numbers
  { pattern: /\bquero\b.{0,60}\b(\d+\s*kg|perder|ganhar|atingir|chegar)\b/i,               category: "goal",       source: "user_stated" },
  // Preferences
  { pattern: /\bprefiro\b.{0,80}/i,                                                          category: "preference", source: "user_stated" },
  { pattern: /\bgosto\s+(mais|menos)\b.{0,80}/i,                                             category: "preference", source: "user_stated" },
  { pattern: /\bnão\s+gosto\b.{0,80}/i,                                                      category: "preference", source: "user_stated" },
  // Time constraints
  { pattern: /\btenho\s+(pouco|muito)?\s*tempo\b.{0,60}/i,                                  category: "preference", source: "user_stated" },
  { pattern: /\btreino\s+(só\s+)?\d+\s*(dias|vezes)/i,                                      category: "fact",       source: "user_stated" },
  // Equipment
  { pattern: /\b(sem\s+ginásio|treino\s+em\s+casa|só\s+tenho\s+halteres)\b/i,              category: "fact",       source: "user_stated" },
  // Diet type
  { pattern: /\b(vegetariano|vegano|carnívoro|keto|jejum\s+intermitente)\b/i,               category: "fact",       source: "user_stated" },
];

/**
 * Scans a user message for memorable facts and stores them automatically.
 * Call this after each user message to build memory passively.
 *
 * @param userId  Authenticated user ID
 * @param message The raw text the user just typed
 */
export function extractAndStoreFromMessage(userId: string, message: string): MemoryEntry[] {
  const stored: MemoryEntry[] = [];

  for (const rule of EXTRACTION_RULES) {
    const match = message.match(rule.pattern);
    if (match) {
      // Use the full sentence containing the match as the memory content,
      // capped at 140 chars to keep the context compact.
      const sentence = extractSentence(message, match.index ?? 0);
      if (sentence.length > 0) {
        const entry = addMemoryEntry(userId, {
          category: rule.category,
          content: sentence.slice(0, 140),
          source: rule.source,
        });
        stored.push(entry);
      }
    }
  }

  return stored;
}

/** Extracts the sentence containing the matched position. */
function extractSentence(text: string, pos: number): string {
  const sentenceEnd = /[.!?]/;
  let start = pos;
  let end = pos;

  while (start > 0 && !sentenceEnd.test(text[start - 1])) start--;
  while (end < text.length && !sentenceEnd.test(text[end])) end++;

  return text.slice(start, end + 1).trim();
}
