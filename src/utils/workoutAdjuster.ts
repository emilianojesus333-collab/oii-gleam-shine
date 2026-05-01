export type FatigueLevel = 'none' | 'low' | 'medium' | 'high';

const HIGH_FATIGUE_PATTERNS = [
  /\b(esgotad[oa]|exaust[oa]|morto|morib[uo]nd[oa]|sem energia|destruído|arrasad[oa])\b/i,
  /\b(dores? (musculares?|no corpo|em tudo)|corpo partido|super cansad[oa])\b/i,
  /\b(não consigo (mexer|levantar|treinar)|mal me (levanto|movo))\b/i,
];

const MEDIUM_FATIGUE_PATTERNS = [
  /\b(cansad[oa]|fatigad[oa]|pesad[oa]|sem disposição|pouca energia)\b/i,
  /\b(dorm[iu] mal|pouco sono|má noite|noite difícil)\b/i,
  /\b(pernas? pesadas?|braços? pesados?|corpo cansado)\b/i,
];

const LOW_FATIGUE_PATTERNS = [
  /\b(um (pouco|bocado) cansad[oa]|ligeiramente cansad[oa])\b/i,
  /\b(não dormi (muito|bem)|pouco (descansad[oa]|repost[oa]))\b/i,
];

export function detectFatigueLevel(message: string): FatigueLevel {
  if (HIGH_FATIGUE_PATTERNS.some(p => p.test(message))) return 'high';
  if (MEDIUM_FATIGUE_PATTERNS.some(p => p.test(message))) return 'medium';
  if (LOW_FATIGUE_PATTERNS.some(p => p.test(message))) return 'low';
  return 'none';
}

export function getFatigueAdjustmentPrompt(level: FatigueLevel): string {
  switch (level) {
    case 'high':
      return `⚠️ AJUSTE DE FADIGA (ALTO): O utilizador reportou fadiga elevada. Reduz o volume total em 40-50%. Prioriza movimentos compostos suaves, elimina exercícios de alta intensidade, sugere descanso ativo ou sessão de mobilidade. Mantém séries mas reduz cargas em 20-30%.`;
    case 'medium':
      return `⚠️ AJUSTE DE FADIGA (MÉDIO): O utilizador está moderadamente fatigado. Reduz o volume em 20-30%. Mantém os exercícios principais mas elimina os acessórios de menor prioridade. Sugere começar com aquecimento prolongado.`;
    case 'low':
      return `ℹ️ AJUSTE DE FADIGA (LEVE): O utilizador está ligeiramente cansado. Pequena redução de 10-15% no volume. Mantém o plano base mas sugere descansos ligeiramente mais longos entre séries.`;
    case 'none':
    default:
      return '';
  }
}
