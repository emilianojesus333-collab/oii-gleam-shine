import type { UserContext } from './userContextCollector';

export interface ProactiveNotification {
  type: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

function wasDismissed(type: string): boolean {
  const raw = localStorage.getItem(`liftmate_proactive_dismiss_${type}`);
  if (!raw) return false;
  return Date.now() - parseInt(raw, 10) < COOLDOWN_MS;
}

function markDismissed(type: string): void {
  localStorage.setItem(`liftmate_proactive_dismiss_${type}`, Date.now().toString());
}

export function checkAndNotify(userId: string, context: UserContext): ProactiveNotification[] {
  if (!userId) return [];
  const notifications: ProactiveNotification[] = [];

  // 1. Days without training
  if (!wasDismissed('no_training')) {
    const lastSession = context.workout.recentSessions[0];
    if (lastSession) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastSession.date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince >= 3) {
        notifications.push({
          type: 'no_training',
          message: `Já passaram ${daysSince} dias desde o teu último treino. Queres que te prepare um treino para hoje?`,
          priority: daysSince >= 5 ? 'high' : 'medium',
        });
        markDismissed('no_training');
      }
    } else if (context.workout.totalSessions === 0) {
      notifications.push({
        type: 'no_training',
        message: 'Ainda não registaste nenhum treino. Quer que te crie um plano de iniciação?',
        priority: 'medium',
      });
      markDismissed('no_training');
    }
  }

  // 2. Low hydration after 15h
  if (!wasDismissed('low_hydration')) {
    const currentHour = new Date().getHours();
    if (currentHour >= 15) {
      const hydrationPct =
        context.alerts.hydrationGoal > 0
          ? context.alerts.hydrationCurrent / context.alerts.hydrationGoal
          : 1;
      if (hydrationPct < 0.5) {
        notifications.push({
          type: 'low_hydration',
          message: `Só tens ${context.alerts.hydrationCurrent.toFixed(1)}L de ${context.alerts.hydrationGoal}L de água. São ${currentHour}h — tenta beber mais antes de dormir.`,
          priority: 'medium',
        });
        markDismissed('low_hydration');
      }
    }
  }

  // 3. Streak at risk
  if (!wasDismissed('streak_risk')) {
    if (context.workout.currentStreak >= 3) {
      const lastSession = context.workout.recentSessions[0];
      if (lastSession) {
        const daysSince = Math.floor(
          (Date.now() - new Date(lastSession.date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince === 1) {
          notifications.push({
            type: 'streak_risk',
            message: `O teu streak de ${context.workout.currentStreak} dias está em risco! Treina hoje para mantê-lo.`,
            priority: 'high',
          });
          markDismissed('streak_risk');
        }
      }
    }
  }

  // 4. Recent PRs worth celebrating
  if (!wasDismissed('recent_pr')) {
    if (context.oneRM.recentPRs.length > 0) {
      const pr = context.oneRM.recentPRs[0];
      notifications.push({
        type: 'recent_pr',
        message: `Fizeste um PR recente em ${pr.exercise}: ${pr.weight}kg (+${pr.improvement}%). Parabéns! Quer ajustar o programa para continuar a progredir?`,
        priority: 'low',
      });
      markDismissed('recent_pr');
    }
  }

  return notifications;
}
