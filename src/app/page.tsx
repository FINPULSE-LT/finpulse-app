"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  fetchUserFinances,
  createSupabaseTransaction,
  deleteSupabaseTransaction,
  createSupabaseAccount,
  createSupabaseGoal,
  contributeToSupabaseGoal,
  joinSupabaseGoal,
  updateSupabaseBudgets,
  updateSupabaseProfileStreak,
} from "@/lib/supabase/data";
import {
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_GOALS,
} from "@/constants/initialData";
import { CoachPersonalityType } from "@/constants/coach";
import {
  Account,
  Transaction,
  SavingsGoal,
  CategoryBudget,
  ParsedTransactionResult,
} from "@/types";

export default function Home() {
  // Estado de Autenticación & Gate de Pantalla de Inicio
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Estados Principales del Negocio (Inician vacíos en 0 para usuarios reales)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "transactions" | "accounts" | "goals" | "reports"
  >("dashboard");

  // Estados de Gamificación (Inician en 0 para usuarios nuevos)
  const [streakCount, setStreakCount] = useState<number>(0);
  const [rescuedMoney, setRescuedMoney] = useState<number>(0);
  const [freezeAvailable, setFreezeAvailable] = useState<boolean>(true);
  const [coachMode, setCoachMode] = useState<CoachPersonalityType>("encouraging");

  // Modales
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  /**
   * Carga los datos financieros directamente desde Supabase Cloud
   */
  const loadCloudFinances = useCallback(async (uid: string) => {
    try {
      setIsLoadingData(true);
      const supabase = createClient();
      const cloudData = await fetchUserFinances(supabase, uid);

      setAccounts(cloudData.accounts);
      setTransactions(cloudData.transactions);
      setGoals(cloudData.goals);
      setBudgets(cloudData.budgets);

      if (cloudData.profile) {
        setStreakCount(cloudData.profile.streakAntExpensesCount || 0);
        setRescuedMoney(cloudData.profile.totalRescuedMoney || 0);
        setFreezeAvailable(cloudData.profile.monthlyStreakFreezeAvailable ?? true);
        if (cloudData.profile.coachMode) {
          setCoachMode(cloudData.profile.coachMode);
        }
      }
    } catch (err) {
      console.error("Error al cargar datos desde Supabase:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Carga inicial y Detección de Usuario en Supabase
  useEffect(() => {
    const supabase = createClient();

    // 1. Verificar sesión persistida localmente (sólo tokens/id, nunca datos financieros)
    if (typeof window !== "undefined") {
      const demoSaved = localStorage.getItem("finpulse_demo_mode");
      if (demoSaved === "true") {
        setIsDemoMode(true);
        setAccounts(INITIAL_ACCOUNTS);
        setTransactions(INITIAL_TRANSACTIONS);
        setGoals(INITIAL_GOALS);
        setStreakCount(3);
        setRescuedMoney(18500);
      }

      const sessionSaved = localStorage.getItem("finpulse_user_session");
      if (sessionSaved) {
        try {
          const parsed = JSON.parse(sessionSaved);
          if (parsed.email) {
            setUserEmail(parsed.email);
          }
          if (parsed.id) {
            setUserId(parsed.id);
            loadCloudFinances(parsed.id);
          }
        } catch {}
      }
    }

    // 2. Verificar sesión activa oficial en Supabase Auth
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email);
        setIsDemoMode(false);
        loadCloudFinances(data.user.id);
      }
      setIsAuthChecking(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email);
          setIsDemoMode(false);
          loadCloudFinances(session.user.id);
        } else if (_event === "SIGNED_OUT") {
          setUserId(undefined);
          setUserEmail(undefined);
          setAccounts([]);
          setTransactions([]);
          setGoals([]);
        }
        setIsAuthChecking(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadCloudFinances]);

  // Unirse a una Meta de Ahorro Compartida (mediante código o URL)
  const handleJoinGoal = useCallback(
    async (inviteCodeOrGoalId: string) => {
      if (!userId) {
        return {
          success: false,
          error: "Debes iniciar sesión para unirte a una meta colaborativa.",
        };
      }
      const supabase = createClient();
      const res = await joinSupabaseGoal(supabase, userId, inviteCodeOrGoalId);
      if (res.success && res.goal) {
        setGoals((prev) => {
          const exists = prev.some((g) => g.id === res.goal!.id);
          if (exists) {
            return prev.map((g) => (g.id === res.goal!.id ? res.goal! : g));
          }
          return [res.goal!, ...prev];
        });
        return { success: true, goalTitle: res.goal.title };
      }
      return { success: false, error: res.error || "No se pudo unir a la meta" };
    },
    [userId]
  );

  // Detección y auto-unión si se ingresó mediante link de invitación (?unirseMeta=...)
  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      const params = new URLSearchParams(window.location.search);
      const goalToJoin = params.get("unirseMeta");
      if (goalToJoin) {
        handleJoinGoal(goalToJoin).then((res) => {
          if (res.success) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
          }
        });
      }
    }
  }, [userId, handleJoinGoal]);

  // Atajos de teclado
  useKeyboardShortcuts({
    onQuickInputFocus: () => {
      const input = document.querySelector(
        'input[placeholder*="Almuerzo"]'
      ) as HTMLInputElement;
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
    setUserId(undefined);
    setUserEmail(undefined);
    setIsDemoMode(false);
    setAccounts([]);
    setTransactions([]);
    setGoals([]);
    setStreakCount(0);
    setRescuedMoney(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("finpulse_demo_mode");
      localStorage.removeItem("finpulse_user_session");
    }
  };

  // Acceso a Modo Demo (Sólo para pruebas sin registro)
  const handleEnterDemo = () => {
    setIsDemoMode(true);
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setGoals(INITIAL_GOALS);
    setStreakCount(3);
    setRescuedMoney(18500);
    if (typeof window !== "undefined") {
      localStorage.setItem("finpulse_demo_mode", "true");
    }
  };

  // Aportar a Meta
  const handleContributeToGoal = async (goalId: string, amount: number) => {
    if (userId) {
      const supabase = createClient();
      await contributeToSupabaseGoal(supabase, userId, goalId, amount);
    }

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const newCurrent = g.currentAmount + amount;
          const updatedMembers = g.members?.map((m) => {
            if (m.userId === (userId || userEmail || "demo-user")) {
              const updatedContrib = m.contributedAmount + amount;
              return {
                ...m,
                contributedAmount: updatedContrib,
                percentageContribution:
                  newCurrent > 0 ? (updatedContrib / newCurrent) * 100 : 0,
              };
            }
            return {
              ...m,
              percentageContribution:
                newCurrent > 0 ? (m.contributedAmount / newCurrent) * 100 : 0,
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

  // Guardar Transacción Parseda por IA (En Supabase Cloud)
  const handleSaveParsedTransaction = async (
    parsed: ParsedTransactionResult,
    selectedAccountId?: string,
    targetGoalId?: string,
    customDate?: string
  ) => {
    const acc = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
    const targetGoal = goals.find(
      (g) => g.id === (targetGoalId || parsed.goalId)
    );

    const finalDate = customDate
      ? new Date(customDate).toISOString()
      : parsed.dateSuggestion
      ? new Date(parsed.dateSuggestion).toISOString()
      : new Date().toISOString();

    const txPayload: Omit<Transaction, "id" | "userId"> = {
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

    // 1. Persistir en Supabase Cloud si hay usuario autenticado
    if (userId) {
      const supabase = createClient();
      const res = await createSupabaseTransaction(
        supabase,
        userId,
        txPayload,
        acc,
        targetGoal
      );
      if (res.success && res.transaction) {
        setTransactions((prev) => [res.transaction!, ...prev]);
      } else {
        // Fallback optimista si hubo error
        const optimisticTx: Transaction = {
          ...txPayload,
          id: `tx-${Date.now()}`,
          userId,
        };
        setTransactions((prev) => [optimisticTx, ...prev]);
      }
    } else {
      // Modo demo en memoria
      const demoTx: Transaction = {
        ...txPayload,
        id: `tx-${Date.now()}`,
        userId: "demo-user",
      };
      setTransactions((prev) => [demoTx, ...prev]);
    }

    // 2. Actualizar saldo local optimista
    if (acc) {
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === acc.id) {
            const diff =
              parsed.type === "income" ? parsed.amount : -parsed.amount;
            return { ...a, balance: a.balance + diff };
          }
          return a;
        })
      );
    }

    if (targetGoal) {
      handleContributeToGoal(targetGoal.id, parsed.amount);
    }

    // 3. Evaluar Racha de Hábitos y guardar en Supabase
    const streakResult = evaluateStreakUpdate(
      streakCount,
      undefined,
      parsed.isAntExpense,
      freezeAvailable
    );
    setStreakCount(streakResult.newStreak);
    if (streakResult.freezeUsed) setFreezeAvailable(false);
    const newRescued =
      streakResult.rescuedMoneyAdded > 0
        ? rescuedMoney + streakResult.rescuedMoneyAdded
        : rescuedMoney;
    if (streakResult.rescuedMoneyAdded > 0) {
      setRescuedMoney(newRescued);
    }

    if (userId) {
      const supabase = createClient();
      updateSupabaseProfileStreak(supabase, userId, streakResult.newStreak, newRescued);
    }
  };

  // Guardar Transacción Manual (En Supabase Cloud)
  const handleSaveManualTransaction = async (
    txData: Omit<Transaction, "id" | "userId">
  ) => {
    const acc = accounts.find((a) => a.id === txData.accountId);
    const targetGoal = goals.find((g) => g.id === txData.goalId);

    if (userId) {
      const supabase = createClient();
      const res = await createSupabaseTransaction(
        supabase,
        userId,
        txData,
        acc,
        targetGoal
      );
      if (res.success && res.transaction) {
        setTransactions((prev) => [res.transaction!, ...prev]);
      } else {
        const optimisticTx: Transaction = {
          ...txData,
          id: `tx-${Date.now()}`,
          userId,
        };
        setTransactions((prev) => [optimisticTx, ...prev]);
      }
    } else {
      const demoTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
        userId: "demo-user",
      };
      setTransactions((prev) => [demoTx, ...prev]);
    }

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
    const newRescued =
      streakResult.rescuedMoneyAdded > 0
        ? rescuedMoney + streakResult.rescuedMoneyAdded
        : rescuedMoney;
    if (streakResult.rescuedMoneyAdded > 0) {
      setRescuedMoney(newRescued);
    }

    if (userId) {
      const supabase = createClient();
      updateSupabaseProfileStreak(supabase, userId, streakResult.newStreak, newRescued);
    }
  };

  // Eliminar Transacción (En Supabase Cloud)
  const handleDeleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (tx && tx.accountId) {
      const revertDiff = tx.type === "income" ? -tx.amount : tx.amount;
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === tx.accountId ? { ...a, balance: a.balance + revertDiff } : a
        )
      );
    }

    if (userId) {
      const supabase = createClient();
      await deleteSupabaseTransaction(
        supabase,
        userId,
        id,
        tx?.accountId,
        tx?.amount,
        tx?.type
      );
    }
  };

  // Crear Cuenta (En Supabase Cloud)
  const handleAddAccount = async (
    accountData: Omit<Account, "id" | "userId">
  ) => {
    if (userId) {
      const supabase = createClient();
      const created = await createSupabaseAccount(supabase, userId, accountData);
      if (created) {
        setAccounts((prev) => [...prev, created]);
        return;
      }
    }

    const newAcc: Account = {
      ...accountData,
      id: `acc-${Date.now()}`,
      userId: userId || "demo-user",
    };
    setAccounts((prev) => [...prev, newAcc]);
  };

  // Crear Meta de Ahorro (En Supabase Cloud)
  const handleAddGoal = async (
    goalData: Omit<SavingsGoal, "id" | "creatorId">
  ) => {
    if (userId) {
      const supabase = createClient();
      const created = await createSupabaseGoal(supabase, userId, goalData);
      if (created) {
        setGoals((prev) => [...prev, created]);
        return;
      }
    }

    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      creatorId: userId || "demo-user",
      members: goalData.isCollaborative
        ? [
            {
              id: `gm-${Date.now()}`,
              goalId: `goal-${Date.now()}`,
              userId: userId || "demo-user",
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

  // Guardar Presupuestos (En Supabase Cloud)
  const handleSaveBudgets = async (updatedBudgets: CategoryBudget[]) => {
    setBudgets(updatedBudgets);
    if (userId) {
      const supabase = createClient();
      await updateSupabaseBudgets(supabase, updatedBudgets);
    }
  };

  // Cálculos de Balance y KPIs (Parten de $0 para usuarios recién creados)
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
  if (!isAuthChecking && !userEmail && !isDemoMode) {
    return (
      <LandingScreen
        onEnterDemo={handleEnterDemo}
        onLoginSuccess={(email) => {
          setUserEmail(email);
          const supabase = createClient();
          supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
              setUserId(data.user.id);
              loadCloudFinances(data.user.id);
            }
          });
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
        {/* Indicador de Sincronización en la Nube */}
        {isLoadingData && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-ping" />
            <span>Sincronizando tus finanzas desde Supabase Cloud...</span>
          </div>
        )}

        {/* Banner de Balance & KPIs Hero Verde Esmeralda */}
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
                {accounts.length > 0
                  ? `Consolidado de ${accounts.length} ${
                      accounts.length === 1 ? "cuenta" : "cuentas"
                    } en Supabase Cloud`
                  : "Comienza registrando tus cuentas y movimientos"}
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
                <BudgetsWidget
                  transactions={transactions}
                  budgets={budgets}
                  onSaveBudgets={handleSaveBudgets}
                />

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
                    if (userId) {
                      const supabase = createClient();
                      supabase
                        .from("profiles")
                        .update({ coach_mode: newMode })
                        .eq("id", userId);
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
                  onJoinGoal={handleJoinGoal}
                  creatorName={userEmail?.split("@")[0] || "Lisandro"}
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
            onJoinGoal={handleJoinGoal}
            creatorName={userEmail?.split("@")[0] || "Lisandro"}
          />
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            <BudgetsWidget
              transactions={transactions}
              budgets={budgets}
              onSaveBudgets={handleSaveBudgets}
            />
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

      {/* Modales Flotantes */}
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
          const supabase = createClient();
          supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
              setUserId(data.user.id);
              setUserEmail(data.user.email);
              loadCloudFinances(data.user.id);
            }
          });
        }}
      />
    </div>
  );
}
