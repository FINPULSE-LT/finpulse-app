"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { SavingsGoal } from "@/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { useHaptics } from "@/hooks/useHaptics";
import { Users, Calendar, Trophy, Coins } from "lucide-react";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onSave: (goalId: string, data: {
    title: string;
    targetAmount: number;
    targetDate?: string;
    isCollaborative?: boolean;
    memberContributions?: { userId: string; amount: number }[];
  }) => Promise<void>;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [memberContributions, setMemberContributions] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { hapticSuccess } = useHaptics();

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setTargetAmount(String(goal.targetAmount));
      setTargetDate(goal.targetDate ? goal.targetDate.split("T")[0] : "");
      setIsCollaborative(goal.isCollaborative);

      const contribMap: Record<string, string> = {};
      goal.members?.forEach((m) => {
        contribMap[m.userId] = String(m.contributedAmount);
      });
      setMemberContributions(contribMap);
    }
  }, [goal, isOpen]);

  if (!goal) return null;

  const handleMemberAmountChange = (userId: string, val: string) => {
    setMemberContributions((prev) => ({
      ...prev,
      [userId]: val,
    }));
  };

  const recalculatedTotal = Object.values(memberContributions).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    if (!title.trim() || isNaN(numTarget) || numTarget <= 0) {
      alert("Ingresa un nombre y monto objetivo válidos");
      return;
    }

    try {
      setIsSubmitting(true);
      const contribArray = Object.entries(memberContributions).map(([uId, amtStr]) => ({
        userId: uId,
        amount: parseFloat(amtStr) || 0,
      }));

      await onSave(goal.id, {
        title: title.trim(),
        targetAmount: numTarget,
        targetDate: targetDate || undefined,
        isCollaborative,
        memberContributions: contribArray,
      });

      hapticSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Error al actualizar la meta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Meta de Ahorro"
      subtitle={`Modifica el objetivo y los montos aportados de "${goal.title}"`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold">
              Nombre de la Meta *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold">
              Monto Objetivo ($) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Fecha Límite Estimada
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="editCollabCheck"
              checked={isCollaborative}
              onChange={(e) => setIsCollaborative(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="editCollabCheck" className="text-xs text-slate-300 select-none cursor-pointer">
              Meta Compartida en Pareja o Equipo
            </label>
          </div>
        </div>

        {/* Edición de Aportes por Integrante */}
        {goal.members && goal.members.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                Aportes Registrados por Integrante
              </span>
              <span className="text-xs font-mono text-cyan-300 font-bold">
                Total: {formatCurrency(recalculatedTotal)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Puedes ajustar manualmente el monto aportado por cada persona para corregir diferencias:
            </p>

            <div className="space-y-2">
              {goal.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white block truncate">{m.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {recalculatedTotal > 0
                        ? `${(((parseFloat(memberContributions[m.userId]) || 0) / recalculatedTotal) * 100).toFixed(1)}% del bote`
                        : "0%"}
                    </span>
                  </div>

                  <div className="w-36">
                    <input
                      type="number"
                      step="any"
                      value={memberContributions[m.userId] ?? ""}
                      onChange={(e) => handleMemberAmountChange(m.userId, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-purple-500/50 focus:border-purple-400 rounded-lg text-xs text-white font-mono text-right"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md shadow-purple-600/30 disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
