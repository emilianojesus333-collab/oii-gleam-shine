/**
 * LiftMate Design Tokens
 * ─────────────────────────────────────────────
 * Single source of truth for all visual values.
 * Import this file instead of hardcoding values.
 *
 * Usage:
 *   import { tokens as t } from "@/tokens";
 *   style={{ background: t.colors.cardBg, borderRadius: t.radius.lg }}
 */

export const tokens = {

  // ── COLORS ──────────────────────────────────
  colors: {
    // Page backgrounds
    pageBg:          "#000000",
    navBg:           "#0D1118",

    // Card backgrounds (use cardBg for default, cardElevated for hover/active)
    cardBg:          "#141414",
    cardElevated:    "#1A1A1A",

    // Accent — primary action (blue)
    primary:         "#2563EB",
    primaryDark:     "#1D4ED8",
    primaryLight:    "#60A5FA",
    primaryGlow:     "rgba(37,99,235,0.25)",
    primarySubtle:   "rgba(37,99,235,0.12)",

    // Accent — success / progress (green)
    success:         "#4ADE80",
    successDark:     "#22C55E",
    successSubtle:   "rgba(74,222,128,0.15)",

    // Accent — warning (amber)
    warning:         "#FBBF24",
    warningSubtle:   "rgba(251,191,36,0.15)",

    // Accent — error / danger (red)
    danger:          "#F87171",
    dangerSubtle:    "rgba(248,113,113,0.15)",

    // Accent — AI / special (purple)
    ai:              "#A78BFA",
    aiSubtle:        "rgba(99,102,241,0.08)",
    aiBorder:        "rgba(99,102,241,0.18)",

    // Borders
    border:          "rgba(255,255,255,0.07)",
    borderStrong:    "rgba(255,255,255,0.12)",

    // Surfaces (for subtle backgrounds inside cards)
    surface1:        "rgba(255,255,255,0.04)",
    surface2:        "rgba(255,255,255,0.06)",
    surface3:        "rgba(255,255,255,0.08)",

    // Text hierarchy
    text100:         "rgba(255,255,255,0.95)", // titles
    text80:          "rgba(255,255,255,0.80)", // body
    text50:          "rgba(255,255,255,0.50)", // secondary
    text30:          "rgba(255,255,255,0.30)", // tertiary / hints
    text15:          "rgba(255,255,255,0.15)", // disabled / ghost
  },

  // ── TYPOGRAPHY ──────────────────────────────
  fontSize: {
    xxs:   11,  // minimum — labels, badges, nav
    xs:    12,  // secondary text, hints
    sm:    13,  // card body, list items
    md:    14,  // default body
    lg:    16,  // card titles, prominent text
    xl:    20,  // section headers, big labels
    xxl:   26,  // page titles
    hero:  32,  // hero numbers
  },

  fontWeight: {
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
    heavy:     800,
  },

  // ── SPACING ─────────────────────────────────
  spacing: {
    xs:  4,
    sm:  8,
    md:  12,
    lg:  16,
    xl:  20,
    xxl: 24,
    xxxl: 32,
  },

  // ── BORDER RADIUS ───────────────────────────
  radius: {
    sm:   8,   // chips, tags, small badges
    md:   12,  // small cards, inputs
    lg:   16,  // standard cards
    xl:   20,  // hero cards, large containers
    pill: 9999, // fully rounded buttons / badges
  },

  // ── BUTTON HEIGHTS ──────────────────────────
  button: {
    sm:  36,  // compact secondary actions
    md:  44,  // standard buttons
    lg:  48,  // primary CTAs
  },

  // ── ICON SIZES ──────────────────────────────
  icon: {
    xs:  14,  // inline with text
    sm:  16,  // compact icon-buttons
    md:  18,  // default card icons
    lg:  22,  // navigation bar
    xl:  28,  // hero / feature icons
  },

  // ── BOTTOM NAV ──────────────────────────────
  nav: {
    height:       68,
    // Total clearance pages should add as paddingBottom
    // (nav height + comfortable breathing room)
    pageClearance: 90,
  },

} as const;

// ── TYPE HELPERS ────────────────────────────────
export type Tokens = typeof tokens;
export type ColorToken = keyof typeof tokens.colors;
