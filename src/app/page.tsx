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
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

export default function HomePage() {
  // Estado Principal
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "transactions" | "accounts" | "goals" | "reports"
  >("dashboard");

  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [goals, setGoals] = useState<SavingsGoal[]>(INITIAL_GOALS);
  const [coachMode, setCoachMode] = useState<CoachPersonalityType>("encouraging");
  const [streakCount, setStreakCount] = useState<number>(7);
  const [rescuedMoney, setRescuedMoney] = useState<number>(31500);
  const [freezeAvailable, setFreezeAvailable] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  // Modales
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Persistencia Local & Detección de Usuario en Supabase
  useEffect(() => {
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

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        } else {
          setUserEmail(undefined);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Guardar en localStorage ante cambios
  useEffect(() => {
    localStorage.setItem("finpulse_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("finpulse_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("finpulse_goals", JSON.stringify(goals));
  }, [goals]);

  // Manejador de Atajos Globales de Teclado
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

  // Aportar a Meta de Ahorro específica
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

  // Guardar Transacción Parseda por IA (Texto o Voz) con soporte de Meta y Fecha
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

    // Si es un ahorro y se seleccionó meta, transferir saldo a la meta
    if (parsed.type === "saving_transfer" && targetGoal) {
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

    // Evaluar Racha de Gastos Hormiga
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

  // Guardar Transacción Manual Detallada
  const handleSaveManualTransaction = (
    txData: Omit<Transaction, "id" | "userId">
  ) => {
    const acc = accounts.find((a) => a.id === txData.accountId);
    const targetGoal = goals.find((g) => g.id === txData.goalId);

    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      userId: userEmail || "demo-user",
      accountName: acc ? acc.name : undefined,
      goalTitle: targetGoal ? targetGoal.title : txData.goalTitle,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Si es aporte de ahorro y tiene meta asignada, incrementar la meta
    if (txData.type === "saving_transfer" && txData.goalId) {
      handleContributeToGoal(txData.goalId, txData.amount);
    }

    // Actualizar Saldo
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

    // Evaluar Racha
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

  // Métricas Totales
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const monthlyIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const netSavings = monthlyIncome - monthlyExpense;

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-10">
      {/* Barra de Navegación Superior */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        userEmail={userEmail}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner de Métricas Rápidas (KPIs) con Estilo Obsidian FinTech */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="obsidian-card rounded-3xl p-4 sm:p-5 border-l-2 border-l-[#00F5A0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                Balance Total
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#00F5A0]/15 text-[#00F5A0] flex items-center justify-center shadow-sm">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              {formatCurrency(totalBalance)}
            </span>
          </div>

          <div className="obsidian-card rounded-3xl p-4 sm:p-5 border-l-2 border-l-[#00F5A0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                Ingresos Mes
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#00F5A0]/15 text-[#00F5A0] flex items-center justify-center shadow-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xl sm:text-2xl font-black font-mono text-[#00F5A0] tracking-tight">
              +{formatCurrency(monthlyIncome)}
            </span>
          </div>

          <div className="obsidian-card rounded-3xl p-4 sm:p-5 border-l-2 border-l-rose-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                Gastos Mes
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shadow-sm">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xl sm:text-2xl font-black font-mono text-rose-400 tracking-tight">
              -{formatCurrency(monthlyExpense)}
            </span>
          </div>

          <div className="obsidian-card rounded-3xl p-4 sm:p-5 border-l-2 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                Ahorro Neto
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shadow-sm">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <span
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                netSavings >= 0 ? "text-purple-400" : "text-rose-400"
              }`}
            >
              {formatCurrency(netSavings)}
            </span>
          </div>
        </div>

        {/* Coach y Racha de Gastos Hormiga */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CoachWidget
            currentMode={coachMode}
            onModeChange={(newMode) => {
              setCoachMode(newMode);
              localStorage.setItem("finpulse_coach_mode", newMode);
            }}
            streakCount={streakCount}
          />
          <AntStreakWidget
            streakCount={streakCount}
            rescuedMoney={rescuedMoney}
            freezeAvailable={freezeAvailable}
          />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TransactionList
                transactions={transactions}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </div>
            <div className="space-y-6">
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
        )}

        {activeTab === "transactions" && (
          <TransactionList
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
          />
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
          <ReportsView transactions={transactions} />
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
      />
    </div>
  );
}
