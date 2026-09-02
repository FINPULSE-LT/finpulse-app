/**
 * Motor de Cálculo de Rachas de Gastos Hormiga & Dinero Rescatado
 * Implementa la psicología de hábitos (Duolingo Style: aversión a la pérdida, recompensas y escudos protectores).
 */

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  hasRecordedAntExpenseToday: boolean;
  freezeAvailable: boolean;
  freezeUsedThisMonth: boolean;
  totalRescuedMoney: number;
  level: {
    name: string;
    levelNumber: number;
    badgeIcon: string;
  };
}

// Estimación promedio de gasto hormiga evitado por día limpio (en moneda local, configurable)
export const ESTIMATED_DAILY_ANT_EXPENSE_SAVED = 4500;

export function calculateLevel(streakDays: number) {
  if (streakDays >= 30) {
    return { name: "Maestro del Ahorro Zen", levelNumber: 5, badgeIcon: "Crown" };
  }
  if (streakDays >= 21) {
    return { name: "Hábito de Hierro", levelNumber: 4, badgeIcon: "ShieldCheck" };
  }
  if (streakDays >= 14) {
    return { name: "Imparable en Llamas", levelNumber: 3, badgeIcon: "Flame" };
  }
  if (streakDays >= 7) {
    return { name: "Escudo Protector", levelNumber: 2, badgeIcon: "Zap" };
  }
  if (streakDays >= 3) {
    return { name: "Semilla Consciente", levelNumber: 1, badgeIcon: "Sprout" };
  }
  return { name: "Iniciador Consciente", levelNumber: 0, badgeIcon: "Sparkles" };
}

export function evaluateStreakUpdate(
  currentStreak: number,
  lastStreakDate: string | undefined,
  hasAntExpenseToday: boolean,
  freezeAvailable: boolean
): {
  newStreak: number;
  freezeUsed: boolean;
  streakBroken: boolean;
  rescuedMoneyAdded: number;
} {
  const today = new Date().toISOString().split("T")[0];

  if (lastStreakDate === today) {
    // Ya evaluado hoy
    return {
      newStreak: currentStreak,
      freezeUsed: false,
      streakBroken: false,
      rescuedMoneyAdded: 0,
    };
  }

  if (hasAntExpenseToday) {
    // Registró gasto hormiga
    if (freezeAvailable && currentStreak > 0) {
      // Usar escudo mensual para salvar la racha
      return {
        newStreak: currentStreak,
        freezeUsed: true,
        streakBroken: false,
        rescuedMoneyAdded: 0,
      };
    } else {
      // Se rompe la racha
      return {
        newStreak: 0,
        freezeUsed: false,
        streakBroken: true,
        rescuedMoneyAdded: 0,
      };
    }
  } else {
    // Día limpio: suma 1 a la racha y rescata dinero
    const newStreak = currentStreak + 1;
    return {
      newStreak,
      freezeUsed: false,
      streakBroken: false,
      rescuedMoneyAdded: ESTIMATED_DAILY_ANT_EXPENSE_SAVED,
    };
  }
}
