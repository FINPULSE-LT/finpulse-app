"use client";

import React, { useState } from "react";
import { Transaction } from "@/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDate } from "@/lib/formatters/date";
import { LABELS } from "@/constants/labels";
import { CATEGORIES } from "@/constants/categories";
import {
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface ReportsViewProps {
  transactions: Transaction[];
}

export type TimeRange = "day" | "week" | "month" | "year";

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Filtrado según período
  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.transactedAt);
    const tDateStr = t.transactedAt.split("T")[0];

    if (timeRange === "day") {
      return tDateStr === selectedDay;
    }

    if (timeRange === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return tDate >= oneWeekAgo && tDate <= now;
    }

    if (timeRange === "month") {
      return (
        tDate.getMonth() === now.getMonth() &&
        tDate.getFullYear() === now.getFullYear()
      );
    }

    if (timeRange === "year") {
      return tDate.getFullYear() === now.getFullYear();
    }

    return true;
  });

  // Totales del período seleccionado
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalAntExpense = filteredTransactions
    .filter((t) => t.type === "expense" && t.isAntExpense)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSavings = filteredTransactions
    .filter((t) => t.type === "saving_transfer")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Desglose por Categoría del período
  const expensesByCategory: Record<string, number> = {};
  filteredTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + t.amount;
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

  // Datos para vista Semanal: 7 días
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const weekDayData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const dStr = d.toISOString().split("T")[0];
    const dayExpenses = transactions
      .filter((t) => t.type === "expense" && t.transactedAt.startsWith(dStr))
      .reduce((acc, curr) => acc + curr.amount, 0);
    return {
      name: dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1],
      date: dStr,
      amount: dayExpenses,
      isToday: dStr === todayStr,
    };
  });
  const maxWeekAmount = Math.max(...weekDayData.map((w) => w.amount), 1);

  // Datos para vista Anual: 12 meses
  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];
  const yearMonthData = Array.from({ length: 12 }, (_, monthIdx) => {
    const monthExpenses = transactions
      .filter((t) => {
        const d = new Date(t.transactedAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === monthIdx && t.type === "expense";
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    const monthIncomes = transactions
      .filter((t) => {
        const d = new Date(t.transactedAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === monthIdx && t.type === "income";
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      month: monthNames[monthIdx],
      expenses: monthExpenses,
      incomes: monthIncomes,
      isCurrentMonth: monthIdx === now.getMonth(),
    };
  });
  const maxYearAmount = Math.max(
    ...yearMonthData.map((m) => Math.max(m.expenses, m.incomes)),
    1
  );

  const handleExportCsv = () => {
    const headers = "ID,Fecha,Tipo,Descripcion,Categoria,Monto,Cuenta,GastoHormiga,Meta\n";
    const rows = filteredTransactions
      .map(
        (t) =>
          `"${t.id}","${t.transactedAt}","${t.type}","${t.description}","${t.category}",${t.amount},"${t.accountName || ""}",${t.isAntExpense},"${t.goalTitle || ""}"`
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
    <div className="obsidian-card rounded-3xl p-5 sm:p-7 space-y-6">
      {/* Header & Filtro de 4 Períodos (Diario, Semanal, Mensual, Anual) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">
              {LABELS.nav.reports}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Analítica financiera, comparativas temporales y mapas de calor
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de 4 Períodos */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold">
            <button
              onClick={() => setTimeRange("day")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === "day"
                  ? "bg-cyan-500 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Diario
            </button>
            <button
              onClick={() => setTimeRange("week")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === "week"
                  ? "bg-cyan-500 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === "month"
                  ? "bg-cyan-500 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeRange === "year"
                  ? "bg-cyan-500 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Anual
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
            title="Exportar reporte a CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selector de día específico si estamos en vista Diario */}
      {timeRange === "day" && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <span className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Día analizado:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDay(todayStr)}
              className={`px-2.5 py-1 text-xs rounded-xl font-mono ${
                selectedDay === todayStr
                  ? "bg-cyan-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              }`}
            >
              Hoy
            </button>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      )}

      {/* KPI Cards de Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
            Ingresos ({timeRange})
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-400 block">
            {formatCurrency(totalIncome)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
            Gastos Totales
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-rose-400 block">
            {formatCurrency(totalExpense)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
            Balance / Ahorro
          </span>
          <span
            className={`text-lg sm:text-xl font-extrabold font-mono block ${
              netBalance >= 0 ? "text-cyan-400" : "text-rose-400"
            }`}
          >
            {formatCurrency(netBalance)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
          <span className="text-[10px] uppercase font-mono text-amber-400 block mb-1">
            Gastos Hormiga 🐜
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-amber-300 block">
            {formatCurrency(totalAntExpense)}
          </span>
        </div>
      </div>

      {/* VISTA ESPECÍFICA SEGÚN PERÍODO */}

      {/* 1. VISTA DIARIA */}
      {timeRange === "day" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Movimientos del Día ({selectedDay})
            </h4>
            <span className="text-xs font-mono text-slate-400">
              {filteredTransactions.length} registros
            </span>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="space-y-2">
              {filteredTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        t.type === "income"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : t.type === "saving_transfer"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {t.type === "income" ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : t.type === "saving_transfer" ? (
                        <Zap className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {t.description}
                        </span>
                        {t.isAntExpense && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                            🐜 Hormiga
                          </span>
                        )}
                        {t.goalTitle && (
                          <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                            🎯 {t.goalTitle}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {t.accountName || "Cuenta general"} • {t.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-mono font-extrabold ${
                      t.type === "income"
                        ? "text-emerald-400"
                        : t.type === "saving_transfer"
                        ? "text-cyan-400"
                        : "text-rose-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
              <p className="text-xs text-slate-300 font-medium">
                No hay movimientos registrados para este día.
              </p>
              <p className="text-[11px] text-slate-500">
                ¡Día sin gastos! Excelente para tu racha de ahorro.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. VISTA SEMANAL (Gráfico de Barras de los 7 días) */}
      {timeRange === "week" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Gastos de los últimos 7 días
            </h4>
            <span className="text-xs font-mono text-slate-400">
              Total semanal: {formatCurrency(totalExpense)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4">
              {weekDayData.map((d, i) => {
                const heightPct = Math.max(8, (d.amount / maxWeekAmount) * 100);
                return (
                  <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ${Math.round(d.amount)}
                    </span>
                    <div className="w-full bg-slate-900 rounded-xl overflow-hidden h-full flex items-end">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-xl transition-all duration-500 ${
                          d.isToday
                            ? "bg-gradient-to-t from-cyan-500 to-cyan-300 shadow-md shadow-cyan-500/30"
                            : "bg-slate-700 hover:bg-slate-600"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-mono font-bold ${
                        d.isToday ? "text-cyan-400" : "text-slate-400"
                      }`}
                    >
                      {d.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. VISTA ANUAL (12 Meses: Ingresos vs Gastos) */}
      {timeRange === "year" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Evolución Anual {now.getFullYear()}
            </h4>
            <span className="text-xs font-mono text-slate-400">
              Ahorro anual acumulado: {formatCurrency(netBalance)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="grid grid-cols-12 gap-1.5 items-end h-40 pt-4">
              {yearMonthData.map((m, i) => {
                const expHeight = Math.max(6, (m.expenses / maxYearAmount) * 100);
                const incHeight = Math.max(6, (m.incomes / maxYearAmount) * 100);
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      {/* Barra Ingresos */}
                      <div
                        style={{ height: `${incHeight}%` }}
                        className="w-1/2 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-sm transition-all"
                        title={`${m.month} Ingresos: ${formatCurrency(m.incomes)}`}
                      />
                      {/* Barra Gastos */}
                      <div
                        style={{ height: `${expHeight}%` }}
                        className="w-1/2 bg-rose-500/80 hover:bg-rose-400 rounded-t-sm transition-all"
                        title={`${m.month} Gastos: ${formatCurrency(m.expenses)}`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-mono ${
                        m.isCurrentMonth
                          ? "text-cyan-400 font-bold"
                          : "text-slate-500"
                      }`}
                    >
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 pt-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Gastos
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Distribución por Categorías */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-cyan-400" />
          {LABELS.reports.expensesByCategory}
        </h4>

        <div className="space-y-2.5">
          {categoryBreakdown.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-200 font-bold">{cat.name}</span>
                <span className="font-mono text-slate-400">
                  {formatCurrency(cat.total)} ({cat.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                <div
                  className="h-full rounded-full transition-all duration-500 shadow-sm"
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
    </div>
  );
};
