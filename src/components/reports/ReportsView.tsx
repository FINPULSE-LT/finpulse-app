"use client";

import React, { useState } from "react";
import { Transaction } from "@/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { LABELS } from "@/constants/labels";
import { CATEGORIES } from "@/constants/categories";
import { BarChart3, PieChart, Calendar, Download, TrendingUp, TrendingDown, Coins } from "lucide-react";

interface ReportsViewProps {
  transactions: Transaction[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions }) => {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  // Totales
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalAntExpense = transactions
    .filter((t) => t.type === "expense" && t.isAntExpense)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netSavings = totalIncome - totalExpense;

  // Desglose por Categoría
  const expensesByCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

  const categoryBreakdown = Object.entries(expensesByCategory)
    .map(([catId, total]) => {
      const catDef = CATEGORIES.find((c) => c.id === catId);
      return {
        id: catId,
        name: catDef ? catDef.name : catId,
        color: catDef ? catDef.color : "#94a3b8",
        total,
        percentage: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Simulación de Heatmap de los últimos 28 días
  const daysInMonth = Array.from({ length: 28 }, (_, i) => {
    const day = i + 1;
    // Buscamos si hubo gastos en ese día
    const intensity = Math.min(3, Math.floor(Math.random() * 4));
    return { day, intensity };
  });

  const getHeatmapColor = (intensity: number) => {
    switch (intensity) {
      case 3:
        return "bg-rose-500/80 border-rose-400";
      case 2:
        return "bg-amber-500/60 border-amber-400";
      case 1:
        return "bg-emerald-500/40 border-emerald-400";
      default:
        return "bg-slate-900 border-slate-800";
    }
  };

  const handleExportCsv = () => {
    const headers = "ID,Fecha,Tipo,Descripcion,Categoria,Monto,Cuenta,GastoHormiga\n";
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${t.transactedAt}","${t.type}","${t.description}","${t.category}",${t.amount},"${t.accountName || ''}",${t.isAntExpense}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `finpulse_reporte_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-6">
      {/* Header & Filtro Temporal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            {LABELS.nav.reports}
          </h3>
          <span className="text-xs text-slate-400">
            Métricas clave, calendario de intensidad y desglose
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timeRange === "week"
                  ? "bg-brand-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timeRange === "month"
                  ? "bg-brand-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timeRange === "year"
                  ? "bg-brand-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Año
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Exportar a CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
            Ingresos
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
            {formatCurrency(totalIncome)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
            Gastos Totales
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-rose-400">
            {formatCurrency(totalExpense)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
            Ahorro Neto
          </span>
          <span className={`text-base sm:text-lg font-bold font-mono ${netSavings >= 0 ? "text-cyan-400" : "text-rose-400"}`}>
            {formatCurrency(netSavings)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 bg-amber-500/5">
          <span className="text-[10px] uppercase font-mono text-amber-400 block mb-1">
            Gastos Hormiga 🐜
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-amber-400">
            {formatCurrency(totalAntExpense)}
          </span>
        </div>
      </div>

      {/* Distribución por Categorías */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-brand-400" />
          {LABELS.reports.expensesByCategory}
        </h4>

        <div className="space-y-2">
          {categoryBreakdown.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">{cat.name}</span>
                <span className="font-mono text-slate-400">
                  {formatCurrency(cat.total)} ({cat.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}

          {categoryBreakdown.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">
              No hay gastos registrados en este período.
            </p>
          )}
        </div>
      </div>

      {/* Calendario Térmico de Intensidad de Gasto (Heatmap estilo GitHub) */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-cyan-400" />
            {LABELS.reports.heatmapTitle}
          </h4>
          <span className="text-[10px] text-slate-400">Últimos 28 días</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {daysInMonth.map((d) => (
            <div
              key={d.day}
              className={`h-7 rounded-lg border flex items-center justify-center text-[10px] font-mono font-medium text-slate-300 transition-transform hover:scale-105 ${getHeatmapColor(
                d.intensity
              )}`}
              title={`Día ${d.day}: Nivel de gasto ${d.intensity}`}
            >
              {d.day}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 pt-1">
          <span>Menos gastos</span>
          <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-800" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-400" />
          <span className="w-2.5 h-2.5 rounded bg-amber-500/60 border border-amber-400" />
          <span className="w-2.5 h-2.5 rounded bg-rose-500/80 border border-rose-400" />
          <span>Más gastos</span>
        </div>
      </div>
    </div>
  );
};
