"use client";

import React, { useState } from "react";
import { Transaction } from "@/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDate } from "@/lib/formatters/date";
import { useHaptics } from "@/hooks/useHaptics";
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
  Target,
} from "lucide-react";

interface ReportsViewProps {
  transactions: Transaction[];
}

export type TimeRange = "day" | "week" | "month" | "year";

// Helper de fecha local para evitar desfase de huso horario UTC (TECH-06)
function getLocalDateString(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [selectedDay, setSelectedDay] = useState<string>(getLocalDateString(new Date()));
  const { hapticTap } = useHaptics();

  const now = new Date();
  const todayStr = getLocalDateString(now);

  // Filtrado según período con fecha local
  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.transactedAt);
    const tDateStr = getLocalDateString(tDate);

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

  // Cálculos de KPIs
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSavingsTransferred = filteredTransactions
    .filter((t) => t.type === "saving_transfer")
    .reduce((acc, t) => acc + t.amount, 0);

  const antExpensesTotal = filteredTransactions
    .filter((t) => t.isAntExpense)
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense - totalSavingsTransferred;
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;

  // Desglose por categorías de gastos
  const categoryTotals: Record<string, number> = {};
  filteredTransactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([catId, amount]) => {
      const catMeta = CATEGORIES.find((c) => c.id === catId);
      return {
        id: catId,
        name: catMeta?.name || catId,
        total: amount,
        color: catMeta?.color || "#94a3b8",
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Datos para gráfico semanal (7 días)
  const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const dayStr = getLocalDateString(d);
    const dayTotal = transactions
      .filter((t) => t.type === "expense" && getLocalDateString(t.transactedAt) === dayStr)
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      dayName: daysOfWeek[d.getDay()],
      dateStr: dayStr,
      amount: dayTotal,
      isToday: dayStr === todayStr,
    };
  });
  const maxWeekAmount = Math.max(...weekData.map((d) => d.amount), 1);

  // UX-02: Datos para gráfico de Semanas del Mes en Curso (4 Bloques)
  const currentMonthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthWeeksData = [
    { label: "Sem 1 (1-7)", start: 1, end: 7 },
    { label: "Sem 2 (8-14)", start: 8, end: 14 },
    { label: "Sem 3 (15-21)", start: 15, end: 21 },
    { label: `Sem 4 (22-${currentMonthDays})`, start: 22, end: currentMonthDays },
  ].map((w) => {
    const totalExp = transactions
      .filter((t) => {
        const d = new Date(t.transactedAt);
        return (
          t.type === "expense" &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          d.getDate() >= w.start &&
          d.getDate() <= w.end
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);
    return { ...w, amount: totalExp };
  });
  const maxMonthWeekAmount = Math.max(...monthWeeksData.map((w) => w.amount), 1);

  // Datos para gráfico anual (12 meses)
  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const yearData = monthNames.map((name, idx) => {
    const inc = transactions
      .filter((t) => {
        const d = new Date(t.transactedAt);
        return (
          t.type === "income" &&
          d.getMonth() === idx &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const exp = transactions
      .filter((t) => {
        const d = new Date(t.transactedAt);
        return (
          t.type === "expense" &&
          d.getMonth() === idx &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      month: name,
      income: inc,
      expense: exp,
      isCurrentMonth: idx === now.getMonth(),
    };
  });
  const maxYearAmount = Math.max(
    ...yearData.map((d) => Math.max(d.income, d.expense)),
    1
  );

  // Exportar a CSV
  const handleExportCSV = () => {
    hapticTap();
    const headers = [
      "ID",
      "Fecha",
      "Tipo",
      "Descripción",
      "Categoría",
      "Monto",
      "Cuenta",
      "Es Gasto Hormiga",
      "Meta de Ahorro",
    ];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.transactedAt,
      t.type,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.amount,
      t.accountName || "",
      t.isAntExpense ? "SI" : "NO",
      t.goalTitle || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `finpulse_reporte_${timeRange}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="obsidian-panel rounded-3xl p-5 sm:p-7 space-y-6 border border-slate-800/80">
      {/* Barra de Título, Filtros Temporales y Botón de Exportar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              {LABELS.nav.reports}
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Analítica de gastos, distribución por categorías y proyección
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de 4 Períodos Temporales */}
          <div className="flex items-center gap-1 bg-[#070A12] p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                hapticTap();
                setTimeRange("day");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                timeRange === "day"
                  ? "bg-[#00F5A0] text-slate-950 font-black shadow-md shadow-[#00F5A0]/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Diario
            </button>
            <button
              onClick={() => {
                hapticTap();
                setTimeRange("week");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                timeRange === "week"
                  ? "bg-[#00F5A0] text-slate-950 font-black shadow-md shadow-[#00F5A0]/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => {
                hapticTap();
                setTimeRange("month");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                timeRange === "month"
                  ? "bg-[#00F5A0] text-slate-950 font-black shadow-md shadow-[#00F5A0]/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => {
                hapticTap();
                setTimeRange("year");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                timeRange === "year"
                  ? "bg-[#00F5A0] text-slate-950 font-black shadow-md shadow-[#00F5A0]/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Anual
            </button>
          </div>

          {/* Botón de Exportar a CSV */}
          <button
            onClick={handleExportCSV}
            className="p-2 sm:px-3 sm:py-1.5 rounded-2xl bg-[#0E1526] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Exportar a CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Selector de Día Específico (Sólo en vista "day") */}
      {timeRange === "day" && (
        <div className="p-4 rounded-2xl bg-[#070A12] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00F5A0]" />
            <span className="text-xs font-bold text-white uppercase font-mono">
              Seleccionar Jornada:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setSelectedDay(todayStr);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                selectedDay === todayStr
                  ? "bg-[#00F5A0] text-slate-950 font-black shadow-md"
                  : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              }`}
            >
              Hoy
            </button>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => {
                hapticTap();
                setSelectedDay(e.target.value);
              }}
              className="px-3 py-1 bg-[#0B0E17] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#00F5A0]"
            />
          </div>
        </div>
      )}

      {/* Tarjetas de Resumen KPI con Código de Color */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="obsidian-card p-4 rounded-2xl border-l-2 border-l-[#00F5A0]">
          <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
            Ingresos
          </span>
          <span className="text-lg sm:text-xl font-black font-mono text-[#00F5A0]">
            {formatCurrency(totalIncome)}
          </span>
        </div>

        <div className="obsidian-card p-4 rounded-2xl border-l-2 border-l-rose-500">
          <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
            Gastos Totales
          </span>
          <span className="text-lg sm:text-xl font-black font-mono text-rose-400">
            {formatCurrency(totalExpense)}
          </span>
        </div>

        <div className="obsidian-card p-4 rounded-2xl border-l-2 border-l-purple-500">
          <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
            Ahorro / Metas
          </span>
          <span className="text-lg sm:text-xl font-black font-mono text-purple-400">
            {formatCurrency(totalSavingsTransferred)}
          </span>
        </div>

        <div className="obsidian-card p-4 rounded-2xl border-l-2 border-l-amber-500">
          <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
            Gastos Hormiga
          </span>
          <span className="text-lg sm:text-xl font-black font-mono text-amber-400">
            {formatCurrency(antExpensesTotal)}
          </span>
        </div>
      </div>

      {/* Detalle de Movimientos en Vista Diaria */}
      {timeRange === "day" && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#00F5A0]" />
            Movimientos del Día ({selectedDay})
          </h4>

          <div className="divide-y divide-slate-800/80 bg-[#070A12]/60 rounded-2xl p-3 border border-slate-800">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-850/40 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-bold">{tx.description}</span>
                  {tx.isAntExpense && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      🐜 Hormiga
                    </span>
                  )}
                  {tx.goalTitle && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      🎯 {tx.goalTitle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {tx.accountName}
                  </span>
                  <span
                    className={`font-mono font-black ${
                      tx.type === "income"
                        ? "text-[#00F5A0]"
                        : tx.type === "saving_transfer"
                        ? "text-purple-400"
                        : "text-rose-400"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-[#00F5A0] mx-auto mb-1" />
                <p className="font-bold text-slate-300">¡Día sin gastos registrados!</p>
                <p className="text-slate-500">Excelente para tu racha de ahorro y control financiero.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gráfico Semanal (7 Días) */}
      {timeRange === "week" && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Curva de Gastos Diarios (Últimos 7 Días)
          </h4>

          <div className="p-4 rounded-2xl bg-[#070A12]/90 border border-slate-800">
            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2">
              {weekData.map((d, idx) => {
                const heightPct = Math.min(100, Math.max(8, (d.amount / maxWeekAmount) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="relative w-full flex items-end justify-center h-full">
                      <div
                        className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 ${
                          d.isToday
                            ? "bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-lg shadow-cyan-500/30"
                            : d.amount > 0
                            ? "bg-gradient-to-t from-slate-800 to-slate-700 group-hover:from-cyan-500/40 group-hover:to-cyan-400/60"
                            : "bg-slate-900/60"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-white text-[10px] font-mono px-2 py-0.5 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-xl">
                        {formatCurrency(d.amount)}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        d.isToday ? "text-cyan-400 font-black" : "text-slate-400"
                      }`}
                    >
                      {d.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* UX-02: Gráfico de Semanas en la Vista Mensual */}
      {timeRange === "month" && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#00F5A0]" />
              Evolución Semanal del Mes ({monthNames[now.getMonth()]})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Promedio semanal: {formatCurrency(totalExpense / 4)}
            </span>
          </h4>

          <div className="p-4 rounded-2xl bg-[#070A12]/90 border border-slate-800">
            <div className="h-44 flex items-end justify-between gap-4 pt-6 pb-2">
              {monthWeeksData.map((w, idx) => {
                const heightPct = Math.min(100, Math.max(8, (w.amount / maxMonthWeekAmount) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="relative w-full flex items-end justify-center h-full">
                      <div
                        className="w-full max-w-[48px] rounded-t-xl transition-all duration-300 bg-gradient-to-t from-slate-800 to-[#00F5A0] group-hover:brightness-125 shadow-sm"
                        style={{ height: `${heightPct}%` }}
                      />
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-white text-[10px] font-mono px-2 py-0.5 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-xl">
                        {formatCurrency(w.amount)}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-300 font-bold">
                      {w.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico Anual (12 Meses con Barras Dobles) */}
      {timeRange === "year" && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Evolución Anual (Ingresos vs Gastos {now.getFullYear()})
          </h4>

          <div className="p-4 rounded-2xl bg-[#070A12]/90 border border-slate-800">
            <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 overflow-x-auto">
              {yearData.map((d, idx) => {
                const incHeight = Math.min(100, Math.max(6, (d.income / maxYearAmount) * 100));
                const expHeight = Math.min(100, Math.max(6, (d.expense / maxYearAmount) * 100));

                return (
                  <div key={idx} className="flex-1 min-w-[22px] flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="relative w-full flex items-end justify-center gap-1 h-full">
                      <div
                        className="w-1/2 max-w-[14px] bg-[#00F5A0] rounded-t-sm transition-all"
                        style={{ height: `${incHeight}%` }}
                        title={`Ingresos: ${formatCurrency(d.income)}`}
                      />
                      <div
                        className="w-1/2 max-w-[14px] bg-rose-500 rounded-t-sm transition-all"
                        style={{ height: `${expHeight}%` }}
                        title={`Gastos: ${formatCurrency(d.expense)}`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-mono ${
                        d.isCurrentMonth ? "text-[#00F5A0] font-black" : "text-slate-400"
                      }`}
                    >
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-6 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#00F5A0]" /> Ingresos
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
              <div className="w-full h-2.5 bg-[#070A12] rounded-full overflow-hidden border border-slate-800/80">
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
