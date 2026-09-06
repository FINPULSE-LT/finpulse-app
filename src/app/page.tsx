"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { MobileTabBar } from "@/components/navigation/MobileTabBar";
import { CoachWidget } from "@/components/coach/CoachWidget";
import { AntStreakWidget } from "@/components/streaks/AntStreakWidget";
import { QuickTransactionBar } from "@/components/transactions/QuickTransactionBar";
import { TransactionList } from "@/components/transactions/TransactionList";
import { AccountsWidget } from "@/components/accounts/AccountsWidget";
import { GoalsWidget } from "@/components/goals/GoalsWidget";
import { ReportsView } from "@/components/reports/ReportsView";
import { ExpenseDonutWidget } from "@/components/reports/ExpenseDonutWidget";
import { BudgetsWidget } from "@/components/budgets/BudgetsWidget";
import { PulseScoreWidget } from "@/components/health/PulseScoreWidget";
import { LandingScreen } from "@/components/landing/LandingScreen";
import { VoiceExpenseModal } from "@/components/transactions/VoiceExpenseModal";
import { TransactionFormModal } from "@/components/transactions/TransactionFormModal";
import { ShortcutsModal } from "@/components/shortcuts/ShortcutsModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { formatCurrency } from "@/lib/formatters/currency";
import { evaluateStreakUpdate } from "@/lib/streaks/engine";
import { createClient } from "@/lib/supabase/client";
import {
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_GOALS,
} from "@/constants/initialData";
import { CoachPersonalityType } from "@/constants/coach";
import { Account, Transaction, SavingsGoal, ParsedTransactionResult } from "@/types";
import { LABELS } from "@/constants/labels";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Award,
} from "lucide-react";

export default function Home() {
  // Estado de Autenticación & Gate de Pantalla de Inicio
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Estados Principales del Negocio
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [goals, setGoals] = useState<SavingsGoal[]>(INITIAL_GOALS);
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "accounts" | "goals" | "reports">("dashboard");

  // Estados de Gamificación
  const [streakCount, setStreakCount] = useState<number>(3);
  const [rescuedMoney, setRescuedMoney] = useState<number>(18500);
  const [freezeAvailable, setFreezeAvailable] = useState<boolean>(true);
  const [coachMode, setCoachMode] = useState<CoachPersonalityType>("strict");

  // Modales
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Carga inicial y Detección de Usuario en Supabase
  useEffect(() => {
    if (typeof window !== "undefined") {
      const demoSaved = localStorage.getItem("finpulse_demo_mode");
      if (demoSaved === "true") {
        setIsDemoMode(true);
      }

      const savedTx = localStorage.getItem("finpulse_transactions");
      if (savedTx) {
        try {
          setTransactions(JSON.parse(savedTx));
        } catch {}
      }

      const savedAcc = localStorage.getItem("finpulse_accounts");
      if (savedAcc) {
        try {
          setAccounts(JSON.parse(savedAcc));
        } catch {}
      }

      const savedGoals = localStorage.getItem("finpulse_goals");
      if (savedGoals) {
        try {
          setGoals(JSON.parse(savedGoals));
        } catch {}
      }

      const savedCoach = localStorage.getItem("finpulse_coach_mode") as CoachPersonalityType;
      if (savedCoach) {
        setCoachMode(savedCoach);
      }
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
      setIsAuthChecking(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        setUserEmail(undefined);
      }
      setIsAuthChecking(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Persistencia local
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("finpulse_transactions", JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("finpulse_accounts", JSON.stringify(accounts));
    }
  }, [accounts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("finpulse_goals", JSON.stringify(goals));
    }
  }, [goals]);

  // Atajos de teclado
  useKeyboardShortcuts({
    onQuickInputFocus: () => {
      const input = document.querySelector('input[placeholder*="Almuerzo"]') as HTMLInputElement;
      input?.focus();
    },
    onNewTransaction: () => setIsManualModalOpen(true),
    onVoiceRecord: () => setIsVoiceModalOpen(true),
    onToggleShortcuts: () => setIsShortcutsModalOpen((prev) => !prev),
    onNavDashboard: () => setActiveTab("dashboard"),
    onNavTransactions: () => setActiveTab("transactions"),
    onNavAccounts: () => setActiveTab("accounts"),
    onNavGoals: () => setActiveTab("goals"),
    onNavReports: () => setActiveTab("reports"),
  });

  // Salir de Sesión / Salir de Demo
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserEmail(undefined);
    setIsDemoMode(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("finpulse_demo_mode");
    }
  };

  // Acceso a Modo Demo
  const handleEnterDemo = () => {
    setIsDemoMode(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("finpulse_demo_mode", "true");
    }
  };

  // Aportar a Meta
  const handleContributeToGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const newCurrent = g.currentAmount + amount;
          const updatedMembers = g.members?.map((m) => {
            if (m.userId === (userEmail || "demo-user")) {
              const updatedContrib = m.contributedAmount + amount;
              return {
                ...m,
                contributedAmount: updatedContrib,
                percentageContribution: newCurrent > 0 ? (updatedContrib / newCurrent) * 100 : 0,
              };
            }
            return {
              ...m,
              percentageContribution: newCurrent > 0 ? (m.contributedAmount / newCurrent) * 100 : 0,
            };
          });

          return {
            ...g,
            currentAmount: newCurrent,
            members: updatedMembers,
          };
        }
        return g;
      })
    );
  };

  // Guardar Transacción Parseda por IA
  const handleSaveParsedTransaction = (
    parsed: ParsedTransactionResult,
    selectedAccountId?: string,
    targetGoalId?: string,
    customDate?: string
  ) => {
    const acc = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
    const targetGoal = goals.find((g) => g.id === (targetGoalId || parsed.goalId));

    const finalDate = customDate
      ? new Date(customDate).toISOString()
      : parsed.dateSuggestion
      ? new Date(parsed.dateSuggestion).toISOString()
      : new Date().toISOString();

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: userEmail || "demo-user",
      accountId: acc ? acc.id : undefined,
      accountName: acc ? acc.name : "General",
      goalId: targetGoal ? targetGoal.id : undefined,
      goalTitle: targetGoal ? targetGoal.title : undefined,
      type: parsed.type,
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
      isAntExpense: parsed.isAntExpense,
      installmentsTotal: parsed.installmentsTotal || 1,
      installmentCurrent: 1,
      transactedAt: finalDate,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Si fue ahorro, sumar a la meta
    if (targetGoal) {
      handleContributeToGoal(targetGoal.id, parsed.amount);
    }

    // Actualizar Saldo de Cuenta
    if (acc) {
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === acc.id) {
            const diff = parsed.type === "income" ? parsed.amount : -parsed.amount;
            return { ...a, balance: a.balance + diff };
          }
          return a;
        })
      );
    }

    // Evaluar Racha de Hábitos
    const streakResult = evaluateStreakUpdate(
      streakCount,
      undefined,
      parsed.isAntExpense,
      freezeAvailable
    );
    setStreakCount(streakResult.newStreak);
    if (streakResult.freezeUsed) setFreezeAvailable(false);
    if (streakResult.rescuedMoneyAdded > 0) {
      setRescuedMoney((prev) => prev + streakResult.rescuedMoneyAdded);
    }
  };

  // Guardar Transacción Manual
  const handleSaveManualTransaction = (txData: Omit<Transaction, "id" | "userId">) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      userId: userEmail || "demo-user",
    };

    setTransactions((prev) => [newTx, ...prev]);
    const acc = accounts.find((a) => a.id === txData.accountId);

    if (txData.type === "saving_transfer" && txData.goalId) {
      handleContributeToGoal(txData.goalId, txData.amount);
    }

    if (acc) {
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === acc.id) {
            const diff = txData.type === "income" ? txData.amount : -txData.amount;
            return { ...a, balance: a.balance + diff };
          }
          return a;
        })
      );
    }

    const streakResult = evaluateStreakUpdate(
      streakCount,
      undefined,
      txData.isAntExpense,
      freezeAvailable
    );
    setStreakCount(streakResult.newStreak);
    if (streakResult.freezeUsed) setFreezeAvailable(false);
    if (streakResult.rescuedMoneyAdded > 0) {
      setRescuedMoney((prev) => prev + streakResult.rescuedMoneyAdded);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddAccount = (accountData: Omit<Account, "id" | "userId">) => {
    const newAcc: Account = {
      ...accountData,
      id: `acc-${Date.now()}`,
      userId: userEmail || "demo-user",
    };
    setAccounts((prev) => [...prev, newAcc]);
  };

  const handleAddGoal = (goalData: Omit<SavingsGoal, "id" | "creatorId">) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      creatorId: userEmail || "demo-user",
      members: goalData.isCollaborative
        ? [
            {
              id: `gm-${Date.now()}`,
              goalId: `goal-${Date.now()}`,
              userId: userEmail || "demo-user",
              userName: "Tú (Creador)",
              contributedAmount: 0,
              percentageContribution: 0,
              joinedAt: new Date().toISOString(),
            },
          ]
        : undefined,
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  // Cálculos de Balance
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const monthlyIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const netSavings = monthlyIncome - monthlyExpense;
  const savingsPercentage =
    monthlyIncome > 0 ? Math.max(0, (netSavings / monthlyIncome) * 100) : 0;

  // GATE DE AUTENTICACIÓN / PANTALLA DE INICIO OFICIAL
  // Si no está chequeando auth y el usuario no está logueado ni en demo, mostrar LandingScreen
  if (!isAuthChecking && !userEmail && !isDemoMode) {
    return (
      <LandingScreen
        onEnterDemo={handleEnterDemo}
        onLoginSuccess={(email) => {
          setUserEmail(email);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-10 bg-[#06110D]">
      {/* Barra de Navegación Superior Verde Dinero */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        userEmail={userEmail}
        isDemoMode={isDemoMode}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner de Balance & KPIs Hero Verde Esmeralda (Inspirado en Monefy & Wallet) */}
        <div className="emerald-hero-banner rounded-3xl p-5 sm:p-7 border border-[#00F5A0]/30 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Balance Total Destacado */}
            <div className="md:col-span-6 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00F5A0] shadow-[0_0_12px_#00F5A0] animate-pulse" />
                <span className="text-xs font-mono uppercase text-emerald-300 font-bold tracking-wider">
                  Balance Patrimonial Total
                </span>
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-white tracking-tight">
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-xs text-emerald-200/70 font-sans">
                Consolidado en tiempo real de {accounts.length} cuentas y tarjetas
              </p>
            </div>

            {/* Micro-KPIs: Ingresos, Gastos y Tasa de Ahorro */}
            <div className="md:col-span-6 grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-[#061C14]/80 border border-emerald-500/20 text-center">
                <span className="text-[10px] uppercase font-mono text-emerald-300 block">
                  Ingresos
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-[#00F5A0] block mt-0.5">
                  +{formatCurrency(monthlyIncome)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#061C14]/80 border border-rose-500/20 text-center">
                <span className="text-[10px] uppercase font-mono text-rose-300 block">
                  Gastos
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-rose-400 block mt-0.5">
                  -{formatCurrency(monthlyExpense)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#061C14]/80 border border-cyan-500/20 text-center">
                <span className="text-[10px] uppercase font-mono text-cyan-300 block">
                  Ahorro
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-cyan-400 block mt-0.5">
                  {savingsPercentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Registro Inteligente "Cero Fricción" */}
        <QuickTransactionBar
          accounts={accounts}
          goals={goals}
          onSaveParsedTransaction={handleSaveParsedTransaction}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenManualModal={() => setIsManualModalOpen(true)}
        />

        {/* VISTAS MODULARES SEGÚN PESTAÑA ACTIVA */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Fila 1: PulseScore de Salud Financiera (Fintonic Style) */}
            <PulseScoreWidget
              accounts={accounts}
              transactions={transactions}
              streakCount={streakCount}
            />

            {/* Fila 2: Dashboard en 2 Columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda (8 cols): Donut Monefy + Presupuestos Mobills + Movimientos */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                {/* Estructura Donut Inspirada en Monefy & Wallet */}
                <ExpenseDonutWidget transactions={transactions} />

                {/* Presupuestos por Categoría Inspirados en Mobills */}
                <BudgetsWidget transactions={transactions} />

                {/* Últimos Movimientos con Filtros */}
                <TransactionList
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              </div>

              {/* Columna Derecha (4-5 cols): Coach Ramsay, Rachas, Cuentas y Metas */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                <CoachWidget
                  currentMode={coachMode}
                  onModeChange={(newMode) => {
                    setCoachMode(newMode);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("finpulse_coach_mode", newMode);
                    }
                  }}
                  streakCount={streakCount}
                />

                <AntStreakWidget
                  streakCount={streakCount}
                  rescuedMoney={rescuedMoney}
                  freezeAvailable={freezeAvailable}
                />

                <AccountsWidget
                  accounts={accounts}
                  onAddAccount={handleAddAccount}
                />

                <GoalsWidget
                  goals={goals}
                  onAddGoal={handleAddGoal}
                  onContributeToGoal={handleContributeToGoal}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-6">
            <ExpenseDonutWidget transactions={transactions} />
            <TransactionList
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>
        )}

        {activeTab === "accounts" && (
          <AccountsWidget
            accounts={accounts}
            onAddAccount={handleAddAccount}
          />
        )}

        {activeTab === "goals" && (
          <GoalsWidget
            goals={goals}
            onAddGoal={handleAddGoal}
            onContributeToGoal={handleContributeToGoal}
          />
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            <BudgetsWidget transactions={transactions} />
            <ReportsView transactions={transactions} />
          </div>
        )}
      </main>

      {/* Navegación Móvil Inferior (PWA Mobile Tab Bar) */}
      <MobileTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenQuickAction={() => setIsManualModalOpen(true)}
      />

      {/* Modales Desacoplados */}
      <VoiceExpenseModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        accounts={accounts}
        goals={goals}
        onConfirm={handleSaveParsedTransaction}
      />

      <TransactionFormModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        accounts={accounts}
        goals={goals}
        onSave={handleSaveManualTransaction}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onDemoAccess={handleEnterDemo}
        onSuccess={() => {
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
