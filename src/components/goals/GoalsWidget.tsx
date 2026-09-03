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
          <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#A855F7]" />
            {LABELS.goals.title}
          </h3>
          <span className="text-xs text-slate-400">
            Metas personales y botes compartidos en pareja o equipo
          </span>
        </div>

        <button
          onClick={() => {
            hapticTap();
            setIsAdding(!isAdding);
          }}
          className="p-1.5 px-3 rounded-xl bg-[#0E1526] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-purple-400" />
          <span>Nueva meta</span>
        </button>
      </div>

      {/* Formulario de Nueva Meta */}
      {isAdding && (
        <form
          onSubmit={handleCreateGoal}
          className="p-4 rounded-2xl bg-[#070A12] border border-slate-800 space-y-3 animate-in fade-in"
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
                className="w-full px-3 py-1.5 bg-[#090D18] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
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
                className="w-full px-3 py-1.5 bg-[#090D18] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500"
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
                className="w-full px-3 py-1.5 bg-[#090D18] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="isCollabCheck"
                checked={isCollaborative}
                onChange={(e) => setIsCollaborative(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
              />
              <label
                htmlFor="isCollabCheck"
                className="text-xs text-slate-300 select-none cursor-pointer"
              >
                Meta Colaborativa (Pareja/Familia)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md shadow-purple-600/30"
            >
              Crear Meta
            </button>
          </div>
        </form>
      )}

      {/* Grid de Metas: Estructura Vertical Sin Desbordes ni Colisiones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {goals.map((goal) => {
          const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isCompleted = goal.currentAmount >= goal.targetAmount;

          return (
            <div
              key={goal.id}
              className="p-4 rounded-2xl bg-[#070A12]/90 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-sm group"
            >
              <div>
                {/* Cabecera: Icono + Tipo a la izquierda | Porcentaje limpio a la derecha */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#090D18] border border-slate-700/80 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-bold border border-slate-700/50 flex items-center gap-1">
                      {goal.isCollaborative ? (
                        <>
                          <Users className="w-3 h-3 text-cyan-400" />
                          <span>Compartida</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-purple-400" />
                          <span>Individual</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Porcentaje en Chip Violeta (Sin Desborde) */}
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-mono font-black shrink-0">
                    {formatPercentage(percent)}
                  </span>
                </div>

                {/* Título de la Meta en su Propia Línea */}
                <div className="mt-3">
                  <h4
                    className="text-sm font-black text-white tracking-tight truncate"
                    title={goal.title}
                  >
                    {goal.title}
                  </h4>
                </div>

                {/* Barra de Progreso */}
                <div className="w-full h-2.5 bg-[#090D18] rounded-full overflow-hidden border border-slate-800 my-2.5">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isCompleted
                        ? "bg-gradient-to-r from-emerald-400 to-[#00F5A0]"
                        : "bg-gradient-to-r from-purple-500 to-[#00F5A0]"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Detalle de Montos */}
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-white font-bold">
                    {formatCurrency(goal.currentAmount)}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Meta: <span className="text-purple-300 font-semibold">{formatCurrency(goal.targetAmount)}</span>
                  </span>
                </div>

                {/* Leaderboard en Metas Colaborativas */}
                {goal.isCollaborative && goal.members && goal.members.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                      Aportes del Equipo:
                    </span>
                    <div className="space-y-1">
                      {goal.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 truncate max-w-[100px]">{m.userName}</span>
                          <span className="font-mono text-cyan-300 font-semibold text-[10px]">
                            {formatCurrency(m.contributedAmount)} ({formatPercentage(m.percentageContribution)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones de la Meta (Aportar o Código) */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {goal.isCollaborative && goal.inviteCode && (
                  <button
                    onClick={() => handleCopyCode(goal.inviteCode!)}
                    className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    title="Copiar código de invitación"
                  >
                    <Share2 className="w-3 h-3 text-purple-400" />
                    <span>{copiedCode === goal.inviteCode ? "¡Copiado!" : goal.inviteCode}</span>
                  </button>
                )}

                <div className="ml-auto">
                  {contributeGoalId === goal.id ? (
                    <div className="flex items-center gap-1.5 w-full animate-in fade-in">
                      <input
                        type="number"
                        placeholder="Monto..."
                        value={contributeAmount}
                        onChange={(e) => setContributeAmount(e.target.value)}
                        className="w-24 px-2 py-1 bg-[#090D18] border border-purple-500 rounded-lg text-xs text-white font-mono"
                      />
                      <button
                        onClick={() => handleContribute(goal.id)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                      >
                        Sumar
                      </button>
                      <button
                        onClick={() => setContributeGoalId(null)}
                        className="px-1.5 py-1 text-slate-400 text-xs hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        hapticTap();
                        setContributeGoalId(goal.id);
                      }}
                      className="text-xs px-2.5 py-1 rounded-xl bg-[#0E1526] hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 font-bold flex items-center gap-1 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Aportar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
