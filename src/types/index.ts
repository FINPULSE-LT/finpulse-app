/**
 * Modelos de Datos TypeScript de FinPulse
 * Tipado estricto para todas las entidades del dominio.
 */

export type AccountType = "cash" | "bank" | "wallet" | "credit_card";

export type TransactionType = "expense" | "income" | "saving_transfer";

export interface Profile {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  currency: string;
  coachMode: "zen" | "encouraging" | "strict";
  emailDigestEnabled: boolean;
  streakAntExpensesCount: number;
  lastStreakDate?: string; // YYYY-MM-DD
  monthlyStreakFreezeAvailable: boolean;
  totalRescuedMoney: number;
  createdAt?: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string; // ej: "Galicia Débito", "MercadoPago", "Efectivo Billetera"
  accountType: AccountType;
  balance: number;
  closingDay?: number; // Para tarjetas de crédito: ej. día 20
  dueDay?: number;     // Para tarjetas de crédito: ej. día 30
  colorHex: string;
  cardNetwork?: "visa" | "mastercard" | "amex" | "cabal" | "other";
  lastFourDigits?: string;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId?: string;
  accountName?: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  notes?: string;
  isAntExpense: boolean; // Gasto hormiga
  installmentsTotal: number; // Cantidad total de cuotas (1 si es en un pago)
  installmentCurrent: number; // Cuota actual
  statementDate?: string; // Fecha en la que impacta el resumen de tarjeta
  transactedAt: string; // Fecha y hora de la transacción (ISO)
}

export interface SavingsGoal {
  id: string;
  creatorId: string;
  creatorName?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  isCollaborative: boolean;
  inviteCode?: string;
  categoryIcon?: string;
  colorHex?: string;
  members?: GoalMember[];
  createdAt?: string;
}

export interface GoalMember {
  id: string;
  goalId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  contributedAmount: number;
  percentageContribution: number;
  joinedAt: string;
}

export interface ParsedTransactionResult {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  isAntExpense: boolean;
  accountSuggestion?: string;
  installmentsTotal: number;
  confidence: number;
  rawText: string;
}
