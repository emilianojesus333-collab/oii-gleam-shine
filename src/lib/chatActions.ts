/**
 * chatActions.ts — Chat write-authority system
 *
 * Lets the AI trigger real in-app actions by embedding action tags in its
 * response text.  The Chat page strips the tags before display and then
 * executes each action.
 *
 * ── Syntax ──────────────────────────────────────────────────────────────────
 * The AI embeds actions using a plain-text directive:
 *
 *   <!--ACTION:TYPE:payload-->
 *
 * Example AI response:
 *   "Registo: acabaste de beber 500 ml. <!--ACTION:LOG_WATER:500--> Bom trabalho! 💧"
 *
 * Supported actions and their payloads:
 *
 *   LOG_WATER:<ml>                 — add ml of water to today's hydration log
 *   LOG_MEAL:<kcal>:<name>         — quick-add a meal entry (name optional)
 *   SET_REMINDER:<name>:<HH:MM>    — upsert a supplement/reminder entry
 *   NAVIGATE:<path>                — push a react-router path (e.g. /nutrition)
 *   SAVE_NOTE:<text>               — persist a coaching note to localStorage
 *   UPDATE_GOAL:<field>:<value>    — update a named goal field in localStorage
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChatAction =
  | { type: "LOG_WATER";     ml: number }
  | { type: "LOG_MEAL";      kcal: number; name: string }
  | { type: "SET_REMINDER";  name: string; time: string }
  | { type: "NAVIGATE";      path: string }
  | { type: "SAVE_NOTE";     text: string }
  | { type: "UPDATE_GOAL";   field: string; value: string | number };

export interface ActionResult {
  action: ChatAction;
  success: boolean;
  message: string;
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

const ACTION_REGEX = /<!--ACTION:([A-Z_]+):([^>]*)-->/g;

/**
 * Parses all <!--ACTION:...--> directives from an AI response string.
 * Returns a list of strongly-typed ChatAction objects; malformed tags are
 * silently skipped.
 */
export function parseActionsFromResponse(response: string): ChatAction[] {
  const actions: ChatAction[] = [];
  let match: RegExpExecArray | null;

  // Reset lastIndex before iteration
  ACTION_REGEX.lastIndex = 0;

  while ((match = ACTION_REGEX.exec(response)) !== null) {
    const type = match[1];
    const payload = match[2].trim();

    try {
      const action = buildAction(type, payload);
      if (action) actions.push(action);
    } catch {
      // Invalid payload — skip
    }
  }

  return actions;
}

/**
 * Returns the response text with all <!--ACTION:...--> tags removed.
 * Use this before rendering the AI message to the user.
 */
export function stripActionsFromText(text: string): string {
  return text.replace(/<!--ACTION:[A-Z_]+:[^>]*-->/g, "").replace(/\s{2,}/g, " ").trim();
}

// ─── Action builder ───────────────────────────────────────────────────────────

function buildAction(type: string, payload: string): ChatAction | null {
  switch (type) {
    case "LOG_WATER": {
      const ml = parseInt(payload, 10);
      if (isNaN(ml) || ml <= 0) return null;
      return { type: "LOG_WATER", ml };
    }

    case "LOG_MEAL": {
      const [kcalStr, ...nameParts] = payload.split(":");
      const kcal = parseInt(kcalStr, 10);
      if (isNaN(kcal) || kcal <= 0) return null;
      return { type: "LOG_MEAL", kcal, name: nameParts.join(":").trim() || "Refeição rápida" };
    }

    case "SET_REMINDER": {
      const colonIdx = payload.indexOf(":");
      if (colonIdx === -1) return null;
      const name = payload.slice(0, colonIdx).trim();
      const time = payload.slice(colonIdx + 1).trim();
      if (!name || !time) return null;
      return { type: "SET_REMINDER", name, time };
    }

    case "NAVIGATE": {
      const path = payload.startsWith("/") ? payload : `/${payload}`;
      return { type: "NAVIGATE", path };
    }

    case "SAVE_NOTE": {
      if (!payload) return null;
      return { type: "SAVE_NOTE", text: payload };
    }

    case "UPDATE_GOAL": {
      const colonIdx = payload.indexOf(":");
      if (colonIdx === -1) return null;
      const field = payload.slice(0, colonIdx).trim();
      const raw = payload.slice(colonIdx + 1).trim();
      const value = isNaN(Number(raw)) ? raw : Number(raw);
      return { type: "UPDATE_GOAL", field, value };
    }

    default:
      return null;
  }
}

// ─── Executors ────────────────────────────────────────────────────────────────

/** Executes a single parsed action. Returns an ActionResult. */
export async function executeAction(
  action: ChatAction,
  navigate?: (path: string) => void
): Promise<ActionResult> {
  try {
    switch (action.type) {
      case "LOG_WATER":
        return execLogWater(action);

      case "LOG_MEAL":
        return execLogMeal(action);

      case "SET_REMINDER":
        return execSetReminder(action);

      case "NAVIGATE":
        return execNavigate(action, navigate);

      case "SAVE_NOTE":
        return execSaveNote(action);

      case "UPDATE_GOAL":
        return execUpdateGoal(action);

      default:
        return { action, success: false, message: "Ação desconhecida." };
    }
  } catch (err) {
    return {
      action,
      success: false,
      message: err instanceof Error ? err.message : "Erro ao executar ação.",
    };
  }
}

/**
 * Parses all actions from a response string and executes them in sequence.
 * Returns an array of results (one per action found).
 */
export async function executeActionsFromResponse(
  response: string,
  navigate?: (path: string) => void
): Promise<ActionResult[]> {
  const actions = parseActionsFromResponse(response);
  const results: ActionResult[] = [];

  for (const action of actions) {
    const result = await executeAction(action, navigate);
    results.push(result);
  }

  return results;
}

// ─── Individual action implementations ───────────────────────────────────────

async function execLogWater(action: Extract<ChatAction, { type: "LOG_WATER" }>): Promise<ActionResult> {
  try {
    const key = "liftmate_hydration_today";
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem(key);
    let data: { date: string; totalMl: number } = stored
      ? JSON.parse(stored)
      : { date: today, totalMl: 0 };

    // Reset if stale
    if (data.date !== today) data = { date: today, totalMl: 0 };

    data.totalMl += action.ml;
    localStorage.setItem(key, JSON.stringify(data));

    // Also update the gymAlerts hydration counter if present
    const alertsRaw = localStorage.getItem("gymAlerts");
    if (alertsRaw) {
      const alerts = JSON.parse(alertsRaw);
      if (alerts.hydration) {
        alerts.hydration.currentIntake = parseFloat(
          ((data.totalMl) / 1000).toFixed(2)
        );
        localStorage.setItem("gymAlerts", JSON.stringify(alerts));
      }
    }

    return {
      action,
      success: true,
      message: `+${action.ml} ml de água registados (total hoje: ${(data.totalMl / 1000).toFixed(2)} L)`,
    };
  } catch {
    return { action, success: false, message: "Erro ao registar água." };
  }
}

async function execLogMeal(action: Extract<ChatAction, { type: "LOG_MEAL" }>): Promise<ActionResult> {
  try {
    const key = "nutrition_data";
    const today = new Date().toISOString().split("T")[0];
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : { dailyLogs: [] };

    if (!data.dailyLogs) data.dailyLogs = [];
    let todayLog = data.dailyLogs.find((l: { date: string }) => l.date === today);

    if (!todayLog) {
      todayLog = { date: today, meals: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 } };
      data.dailyLogs.push(todayLog);
    }

    const meal = {
      id: Date.now().toString(),
      name: action.name,
      time: new Date().toTimeString().slice(0, 5),
      calories: action.kcal,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    todayLog.meals.push(meal);
    todayLog.totals.calories = (todayLog.totals.calories || 0) + action.kcal;

    localStorage.setItem(key, JSON.stringify(data));

    return {
      action,
      success: true,
      message: `"${action.name}" registado (${action.kcal} kcal).`,
    };
  } catch {
    return { action, success: false, message: "Erro ao registar refeição." };
  }
}

function execSetReminder(action: Extract<ChatAction, { type: "SET_REMINDER" }>): ActionResult {
  try {
    const key = "gymAlerts";
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : {};

    if (!data.supplements) data.supplements = [];

    const existing = data.supplements.findIndex(
      (s: { name?: string }) => s.name?.toLowerCase() === action.name.toLowerCase()
    );

    const entry = { name: action.name, time: action.time, enabled: true };
    if (existing !== -1) {
      data.supplements[existing] = entry;
    } else {
      data.supplements.push(entry);
    }

    localStorage.setItem(key, JSON.stringify(data));

    return {
      action,
      success: true,
      message: `Lembrete "${action.name}" configurado para ${action.time}.`,
    };
  } catch {
    return { action, success: false, message: "Erro ao configurar lembrete." };
  }
}

function execNavigate(
  action: Extract<ChatAction, { type: "NAVIGATE" }>,
  navigate?: (path: string) => void
): ActionResult {
  if (!navigate) {
    return { action, success: false, message: "Navegação não disponível neste contexto." };
  }

  // Safety allowlist — only known app routes
  const ALLOWED_PATHS = [
    "/home", "/workout", "/nutrition", "/hydration",
    "/coaching-ia", "/avaliacao-fisica", "/history",
    "/settings", "/chat",
  ];

  const allowed = ALLOWED_PATHS.some((p) => action.path.startsWith(p));
  if (!allowed) {
    return { action, success: false, message: `Rota não permitida: ${action.path}` };
  }

  navigate(action.path);
  return { action, success: true, message: `A navegar para ${action.path}…` };
}

function execSaveNote(action: Extract<ChatAction, { type: "SAVE_NOTE" }>): ActionResult {
  try {
    const key = "liftmate_chat_notes";
    const raw = localStorage.getItem(key);
    const notes: Array<{ id: string; text: string; timestamp: number }> = raw ? JSON.parse(raw) : [];

    notes.unshift({ id: Date.now().toString(), text: action.text, timestamp: Date.now() });

    // Keep at most 100 notes
    if (notes.length > 100) notes.splice(100);
    localStorage.setItem(key, JSON.stringify(notes));

    return { action, success: true, message: "Nota guardada." };
  } catch {
    return { action, success: false, message: "Erro ao guardar nota." };
  }
}

function execUpdateGoal(action: Extract<ChatAction, { type: "UPDATE_GOAL" }>): ActionResult {
  try {
    const key = "liftmate_goals";
    const raw = localStorage.getItem(key);
    const goals: Record<string, string | number> = raw ? JSON.parse(raw) : {};

    goals[action.field] = action.value;
    localStorage.setItem(key, JSON.stringify(goals));

    return {
      action,
      success: true,
      message: `Objetivo "${action.field}" atualizado para ${action.value}.`,
    };
  } catch {
    return { action, success: false, message: "Erro ao atualizar objetivo." };
  }
}

// ─── Convenience: get saved notes ────────────────────────────────────────────

export interface ChatNote {
  id: string;
  text: string;
  timestamp: number;
}

/** Returns all coaching notes saved via SAVE_NOTE actions, newest first. */
export function getChatNotes(): ChatNote[] {
  try {
    const raw = localStorage.getItem("liftmate_chat_notes");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Removes a specific note by ID. */
export function deleteChatNote(noteId: string): void {
  try {
    const notes = getChatNotes().filter((n) => n.id !== noteId);
    localStorage.setItem("liftmate_chat_notes", JSON.stringify(notes));
  } catch {}
}
