"use client";

import React, { useState } from "react";
import { Transaction } from "@/types";
import { CATEGORIES } from "@/constants/categories";
import { formatCurrency } from "@/lib/formatters/currency";
import { useHaptics } from "@/hooks/useHaptics";
import { Sliders, AlertTriangle, CheckCircle, Plus, Edit2 } from "lucide-react";

interface CategoryBudget {
  categoryId: string;
  limit: number;
}

interface BudgetsWidgetProps {
  transactions: Transaction[];
  onOpenQuickExpense?: () => void;
}

const DEFAULT_BUDGETS: CategoryBudget[] = [
  { categoryId: "supermercado", limit: 120000 },
  { categoryId: "delivery_comida", limit: 45000 },
  { categoryId: "transporte_movilidad", limit: 35000 },
  { categoryId: "ocio_salidas", limit: 30000 },
  { categoryId: "cafe_kiosco", limit: 15000 },
];

export const BudgetsWidget: React.FC<BudgetsWidgetProps> = ({
  transactions,
}) => {
  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("finpulse_budgets");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEFAULT_BUDGETS;
        }
      }
    }
    return DEFAULT_BUDGETS;
  });

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState("");
  const { hapticTap, hapticSuccess } = useHaptics();

  // Calcular gastos acumulados del mes en curso por categoría
  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    if (t.type !== "expense") return false;
    const d = new Date(t.transactedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const categorySpentMap = currentMonthTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Días restantes en el mes actual para proyección diaria
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate());

  const handleSaveBudget = (catId: string) => {
    const val = parseFloat(newLimit);
    if (isNaN(val) || val <= 0) return;

    hapticSuccess();
    const updated = budgets.some((b) => b.categoryId === catId)
      ? budgets.map((b) => (b.categoryId === catId ? { ...b, limit: val } : b))
      : [...budgets, { categoryId: catId, limit: val }];

    setBudgets(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("finpulse_budgets", JSON.stringify(updated));
    }
    setEditingCategory(null);
    setNewLimit("");
  };

  return (
    <div className="obsidian-card rounded-3xl p-5 sm:p-6 border border-emerald-500/25 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00F5A0] shadow-[0_0_10px_#00F5A0]" />
            Presupuestos del Mes
          </h3>
          <p className="text-xs text-slate-400">
            Límites por categoría con semáforo inteligente estilo Mobills
          </p>
        </div>

        <span className="text-xs font-mono text-slate-400 bg-[#0A1613] px-3 py-1 rounded-full border border-emerald-900/50">
          Quedan <strong className="text-[#00F5A0]">{daysRemaining} días</strong>
        </span>
      </div>

      {/* Listado de Presupuestos con Barras Tricolor */}
      <div className="space-y-4">
        {budgets.map((b) => {
          const cat = CATEGORIES.find((c) => c.id === b.categoryId);
          const spent = categorySpentMap[b.categoryId] || 0;
          const percent = Math.min(100, (spent / b.limit) * 100);
          const remaining = b.limit - spent;
          const dailyRemaining = Math.max(0, remaining / daysRemaining);

          // Estado del semáforo
          const isDanger = percent >= 90;
          const isWarning = percent >= 70 && percent < 90;

          return (
            <div
              key={b.categoryId}
              className="p-3.5 rounded-2xl bg-[#080E18] border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {cat?.name || b.categoryId}
                  </span>
                  {isDanger && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      Límite al {percent.toFixed(0)}%
                    </span>
                  )}
                  {isWarning && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                      Atención ({percent.toFixed(0)}%)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {formatCurrency(spent)}{" "}
                    <span className="text-slate-400 font-normal">/ {formatCurrency(b.limit)}</span>
                  </span>
                  <button
                    onClick={() => {
                      hapticTap();
                      setEditingCategory(b.categoryId);
                      setNewLimit(b.limit.toString());
                    }}
                    className="p-1 text-slate-500 hover:text-white transition-colors"
                    title="Modificar límite"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Barra de Progreso Tricolor */}
              <div className="w-full h-2.5 bg-[#090D18] rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDanger
                      ? "bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                      : isWarning
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                      : "bg-gradient-to-r from-[#00D09C] to-[#00F5A0] shadow-[0_0_12px_rgba(0,245,160,0.4)]"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Saldo Restante y Proyección Diaria */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>
                  {remaining > 0 ? (
                    <>
                      Quedan: <strong className="text-white">{formatCurrency(remaining)}</strong>
                    </>
                  ) : (
                    <span className="text-rose-400 font-bold">
                      Superado por {formatCurrency(Math.abs(remaining))}
                    </span>
                  )}
                </span>
                {remaining > 0 && (
                  <span className="text-emerald-400/90 font-medium">
                    {formatCurrency(dailyRemaining)} / día
                  </span>
                )}
              </div>

              {/* Input Rápido para Modificar Límite */}
              {editingCategory === b.categoryId && (
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2 animate-in fade-in">
                  <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="Nuevo límite..."
                    className="px-2.5 py-1 bg-[#090D18] border border-emerald-500 rounded-lg text-xs text-white font-mono flex-1 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveBudget(b.categoryId)}
                    className="px-3 py-1 bg-[#00F5A0] text-slate-950 rounded-lg text-xs font-bold"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="px-2 py-1 text-slate-400 text-xs hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
