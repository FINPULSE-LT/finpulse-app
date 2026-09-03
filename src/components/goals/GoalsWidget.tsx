"use client";

import React, { useState } from "react";
import { SavingsGoal } from "@/types";
import { formatCurrency, formatPercentage } from "@/lib/formatters/currency";
import { LABELS } from "@/constants/labels";
import { useHaptics } from "@/hooks/useHaptics";
import { Trophy, Users, User, Plus, Share2, Target, Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface GoalsWidgetProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, "id" | "creatorId">) => void;
  onContributeToGoal: (goalId: string, amount: number) => void;
}

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({
  goals,
  onAddGoal,
  onContributeToGoal,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { hapticTap, hapticCelebration, hapticSuccess } = useHaptics();

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (!title.trim() || isNaN(target) || target <= 0) return;

    hapticSuccess();
    onAddGoal({
      title: title.trim(),
      targetAmount: target,
      currentAmount: 0,
      targetDate: targetDate || undefined,
      isCollaborative,
      inviteCode: isCollaborative
        ? `FIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        : undefined,
    });

    setIsAdding(false);
    setTitle("");
    setTargetAmount("");
    setTargetDate("");
    setIsCollaborative(false);
  };

  const handleContribute = (goalId: string) => {
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) return;

    hapticCelebration();
    onContributeToGoal(goalId, amount);
    confetti({
      particleCount: 60,
      spread: 75,
      origin: { y: 0.7 },
    });

    setContributeGoalId(null);
    setContributeAmount("");
  };

  const handleCopyCode = (code: string) => {
    hapticTap();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="obsidian-card rounded-3xl p-5 sm:p-6 border border-purple-500/25 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            {LABELS.goals.title}
          </h3>
          <span className="text-xs text-slate-400">
            Metas personales y botes compartidos en pareja o equipo
          </span>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva meta</span>
        </button>
      </div>

      {/* Formulario de Nueva Meta */}
      {isAdding && (
        <form
          onSubmit={handleCreateGoal}
          className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Nombre de la Meta *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Viaje a Brasil, MacBook Pro..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Monto Objetivo ($) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Fecha Estimada (Opcional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="isCollabCheck"
                checked={isCollaborative}
                onChange={(e) => setIsCollaborative(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="isCollabCheck" className="text-xs text-slate-300 select-none cursor-pointer">
                Meta colaborativa (compartida con pareja/amigos)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-md"
            >
              Crear Meta
            </button>
          </div>
        </form>
      )}

      {/* Grid de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isCompleted = percent >= 100;

          return (
            <div
              key={goal.id}
              className={`p-4 rounded-xl border transition-all relative overflow-hidden ${
                goal.isCollaborative
                  ? "bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border-cyan-500/30"
                  : "bg-slate-950/70 border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{goal.title}</h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      {goal.isCollaborative ? (
                        <>
                          <Users className="w-3 h-3 text-cyan-400" />
                          <span className="text-cyan-300 font-medium">Meta Compartida</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Meta Individual</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold font-mono text-white">
                  {formatPercentage(percent)}
                </span>
              </div>

              {/* Barra de Progreso Viva */}
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 my-3">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isCompleted
                      ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                      : "bg-gradient-to-r from-brand-500 to-accent-cyan"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">
                  {formatCurrency(goal.currentAmount)}
                </span>
                <span className="text-white font-bold">
                  Objetivo: {formatCurrency(goal.targetAmount)}
                </span>
              </div>

              {/* Leaderboard en Metas Colaborativas */}
              {goal.isCollaborative && goal.members && goal.members.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                    Aportes del Equipo:
                  </span>
                  <div className="space-y-1">
                    {goal.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">{m.userName}</span>
                        <span className="font-mono text-cyan-300 font-semibold">
                          {formatCurrency(m.contributedAmount)} ({formatPercentage(m.percentageContribution)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Código de Invitación en Metas Colaborativas */}
              {goal.isCollaborative && goal.inviteCode && (
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    Código: <strong className="text-white">{goal.inviteCode}</strong>
                  </span>
                  <button
                    onClick={() => handleCopyCode(goal.inviteCode!)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>{copiedCode === goal.inviteCode ? "¡Copiado!" : "Invitar"}</span>
                  </button>
                </div>
              )}

              {/* Botón de Aportar */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-end">
                {contributeGoalId === goal.id ? (
                  <div className="flex items-center gap-1.5 w-full animate-in fade-in">
                    <input
                      type="number"
                      placeholder="Monto a aportar..."
                      value={contributeAmount}
                      onChange={(e) => setContributeAmount(e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                    <button
                      onClick={() => handleContribute(goal.id)}
                      className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs"
                    >
                      Aportar
                    </button>
                    <button
                      onClick={() => setContributeGoalId(null)}
                      className="px-2 py-1 text-slate-400 text-xs hover:text-white"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setContributeGoalId(goal.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    <span>Aportar ahorro</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
