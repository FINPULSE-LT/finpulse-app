"use client";

import React, { useState } from "react";
import { Transaction } from "@/types";
import { CATEGORIES } from "@/constants/categories";
import { formatCurrency } from "@/lib/formatters/currency";
import { useHaptics } from "@/hooks/useHaptics";
import { PieChart as PieIcon, Sparkles } from "lucide-react";

interface ExpenseDonutWidgetProps {
  transactions: Transaction[];
  onSelectCategory?: (category: string) => void;
}

export const ExpenseDonutWidget: React.FC<ExpenseDonutWidgetProps> = ({
  transactions,
  onSelectCategory,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { hapticTap } = useHaptics();

  // Filtrar solo gastos del período actual
  const expenseTransactions = transactions.filter((t) => t.type === "expense");
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Agrupar por categoría
  const categoryTotals = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals)
    .map(([catId, amount]) => {
      const def = CATEGORIES.find((c) => c.id === catId);
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        id: catId,
        name: def?.name || catId,
        amount,
        percentage,
        colorHex: def?.color || "#3B82F6",
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Paleta de colores vibrantes inspirada en Monefy & Wallet
  const COLOR_PALETTE = [
    "#00F5A0", // Emerald Neo-Mint
    "#FF4D6D", // Coral Rose
    "#00D9F5", // Cyan Pulse
    "#F59E0B", // Amber Solar
    "#8B5CF6", // Cosmic Purple
    "#3B82F6", // Sapphire Blue
    "#EC4899", // Pink
    "#10B981", // Emerald Deep
  ];

  // Cálculo de los arcos SVG del Donut
  let cumulativeAngle = 0;
  const radius = 64;
  const strokeWidth = 18;
  const center = 80;
  const circumference = 2 * Math.PI * radius;

  const activeItem = activeCategory
    ? sortedCategories.find((c) => c.id === activeCategory)
    : null;

  return (
    <div className="obsidian-card rounded-3xl p-5 sm:p-6 border border-emerald-500/20 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-[#00F5A0] flex items-center justify-center font-bold">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight">
              Estructura de Gastos
            </h3>
            <p className="text-[11px] text-slate-400">
              Distribución táctil por rubro estilo Monefy & Wallet
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          {sortedCategories.length} categorías
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
        {/* Gráfico Donut Circular SVG Interactivo */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 160 160"
            >
              {/* Círculo Base Fondo */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="#0D1624"
                strokeWidth={strokeWidth}
              />

              {/* Segmentos de Categorías */}
              {totalExpense > 0 &&
                sortedCategories.map((cat, idx) => {
                  const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((cumulativeAngle / 100) * circumference);
                  cumulativeAngle += cat.percentage;
                  const color = cat.colorHex || COLOR_PALETTE[idx % COLOR_PALETTE.length];
                  const isHovered = activeCategory === cat.id;

                  return (
                    <circle
                      key={cat.id}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer hover:opacity-90"
                      onClick={() => {
                        hapticTap();
                        setActiveCategory(activeCategory === cat.id ? null : cat.id);
                        onSelectCategory?.(cat.id);
                      }}
                    />
                  );
                })}
            </svg>

            {/* Centro del Donut con Monto Destacado */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                {activeItem ? activeItem.name : "Gastos Totales"}
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-white tracking-tight">
                {formatCurrency(activeItem ? activeItem.amount : totalExpense)}
              </span>
              {activeItem && (
                <span className="text-[10px] font-mono text-[#00F5A0] font-bold">
                  {activeItem.percentage.toFixed(1)}% del total
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Categorías con Chips Táctiles y Porcentajes */}
        <div className="md:col-span-7 space-y-2.5">
          {sortedCategories.slice(0, 5).map((cat, idx) => {
            const color = cat.colorHex || COLOR_PALETTE[idx % COLOR_PALETTE.length];
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  hapticTap();
                  setActiveCategory(isSelected ? null : cat.id);
                  onSelectCategory?.(cat.id);
                }}
                className={`w-full p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-[#0E201B] border-[#00F5A0] shadow-md shadow-[#00F5A0]/10"
                    : "bg-[#080E18] border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-bold text-white tracking-tight truncate">
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <span className="text-xs font-mono font-bold text-white">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                    style={{
                      backgroundColor: `${color}20`,
                      color: color,
                      border: `1px solid ${color}40`,
                    }}
                  >
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              </button>
            );
          })}

          {sortedCategories.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-500">
              Registra un gasto para ver el desglose en el gráfico Donut.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
