"use client";

import React, { useState, useMemo } from "react";
import { Transaction } from "@/types";
import { formatCurrency, formatPercentage } from "@/lib/formatters/currency";
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
  ChevronLeft,
  ChevronRight,
  Layers,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  RotateCcw,
} from "lucide-react";

interface ReportsViewProps {
  transactions: Transaction[];
}

export type TimeRange = "day" | "week" | "month" | "year";

const MONTH_NAMES_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const MONTH_NAMES_FULL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayStr = getLocalDateString(now);

  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  
  // Estado de navegación temporal
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
  const [isMultiMonthMode, setIsMultiMonthMode] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = semana actual, -1 = semana anterior

  // Filtros del Explorador de Movimientos
  const [txSearchQuery, setTxSearchQuery] = useState<string>("");
  const [txTypeFilter, setTxTypeFilter] = useState<"all" | "expense" | "income" | "ant">("all");

  const { hapticTap, hapticSuccess } = useHaptics();

  // Calcular rango de la semana seleccionada
  const weekRange = useMemo(() => {
    const end = new Date();
    end.setDate(now.getDate() + weekOffset * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    return {
      start,
      end,
      startStr: getLocalDateString(start),
      endStr: getLocalDateString(end),
    };
  }, [weekOffset, now]);

  // Selección de presets rápidos
  const handlePresetSelect = (preset: "current" | "q3" | "h6" | "fullYear") => {
    hapticTap();
    setSelectedYear(currentYear);
    if (preset === "current") {
      setIsMultiMonthMode(false);
      setSelectedMonths([currentMonth]);
    } else if (preset === "q3") {
      setIsMultiMonthMode(true);
      const months: number[] = [];
      for (let i = 2; i >= 0; i--) {
        const m = (currentMonth - i + 12) % 12;
        months.push(m);
      }
      setSelectedMonths(months.sort((a, b) => a - b));
    } else if (preset === "h6") {
      setIsMultiMonthMode(true);
      const months: number[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = (currentMonth - i + 12) % 12;
        months.push(m);
      }
      setSelectedMonths(months.sort((a, b) => a - b));
    } else if (preset === "fullYear") {
      setIsMultiMonthMode(true);
      setSelectedMonths([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    }
  };

  // Toggle de un mes individual en la matriz
  const handleMonthToggle = (monthIndex: number) => {
    hapticTap();
    if (!isMultiMonthMode) {
      setSelectedMonths([monthIndex]);
      return;
    }

    if (selectedMonths.includes(monthIndex)) {
      if (selectedMonths.length > 1) {
        setSelectedMonths(selectedMonths.filter((m) => m !== monthIndex));
      }
    } else {
      setSelectedMonths([...selectedMonths, monthIndex].sort((a, b) => a - b));
    }
  };

  // Restablecer navegación al momento presente
  const handleResetToPresent = () => {
    hapticSuccess();
    setSelectedYear(currentYear);
    setSelectedMonths([currentMonth]);
    setSelectedDay(todayStr);
    setWeekOffset(0);
    setIsMultiMonthMode(false);
  };

  // Meses que tienen transacciones en el año actual
  const monthsWithTransactions = useMemo(() => {
    const set = new Set<number>();
    transactions.forEach((t) => {
      const d = new Date(t.transactedAt);
      if (d.getFullYear() === selectedYear) {
        set.add(d.getMonth());
      }
    });
    return set;
  }, [transactions, selectedYear]);

  // Filtrar transacciones del período seleccionado
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.transactedAt);
      const tDateStr = getLocalDateString(d);

      if (timeRange === "day") {
        return tDateStr === selectedDay;
      }

      if (timeRange === "week") {
        return tDateStr >= weekRange.startStr && tDateStr <= weekRange.endStr;
      }

      if (timeRange === "month") {
        return (
          d.getFullYear() === selectedYear &&
          selectedMonths.includes(d.getMonth())
        );
      }

      if (timeRange === "year") {
        return d.getFullYear() === selectedYear;
      }

      return true;
    });
  }, [transactions, timeRange, selectedDay, weekRange, selectedYear, selectedMonths]);

  // Cálculos de KPIs acumulados
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalSavingsTransferred = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "saving_transfer")
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const antExpensesTotal = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.isAntExpense)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const netBalance = totalIncome - totalExpense - totalSavingsTransferred;
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;

  // Promedios Mensuales (cuando hay 2 o más meses seleccionados)
  const monthCount = timeRange === "month" ? Math.max(1, selectedMonths.length) : 1;
  const isMultiMonthActive = timeRange === "month" && selectedMonths.length > 1;
  const avgMonthlyExpense = totalExpense / monthCount;
  const avgMonthlyIncome = totalIncome / monthCount;
  const avgMonthlySavings = (totalIncome - totalExpense) / monthCount;

  // Desglose por categorías
  const categoryBreakdown = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    return Object.entries(categoryTotals)
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
  }, [filteredTransactions, totalExpense]);

  // Datos para Gráfico Comparativo Mes a Mes (Modo Multi-Mes)
  const multiMonthChartData = useMemo(() => {
    if (!isMultiMonthActive) return [];
    return selectedMonths.map((mIdx) => {
      const inc = transactions
        .filter((t) => {
          const d = new Date(t.transactedAt);
          return (
            t.type === "income" &&
            d.getFullYear() === selectedYear &&
            d.getMonth() === mIdx
          );
        })
        .reduce((acc, t) => acc + t.amount, 0);

      const exp = transactions
        .filter((t) => {
          const d = new Date(t.transactedAt);
          return (
            t.type === "expense" &&
            d.getFullYear() === selectedYear &&
            d.getMonth() === mIdx
          );
        })
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        monthName: MONTH_NAMES_SHORT[mIdx],
        fullName: MONTH_NAMES_FULL[mIdx],
        income: inc,
        expense: exp,
        net: inc - exp,
        monthIndex: mIdx,
      };
    });
  }, [isMultiMonthActive, selectedMonths, transactions, selectedYear]);

  const maxMultiMonthAmount = useMemo(() => {
    if (!multiMonthChartData.length) return 1;
    return Math.max(...multiMonthChartData.map((d) => Math.max(d.income, d.expense)), 1);
  }, [multiMonthChartData]);

  // Datos para Gráfico de Semanas de Mes Único
  const singleMonthWeeksData = useMemo(() => {
    if (timeRange !== "month" || isMultiMonthActive) return [];
    const targetMonth = selectedMonths[0] ?? currentMonth;
    const daysInTargetMonth = new Date(selectedYear, targetMonth + 1, 0).getDate();

    return [
      { label: "Sem 1 (1-7)", start: 1, end: 7 },
      { label: "Sem 2 (8-14)", start: 8, end: 14 },
      { label: "Sem 3 (15-21)", start: 15, end: 21 },
      { label: `Sem 4 (22-${daysInTargetMonth})`, start: 22, end: daysInTargetMonth },
    ].map((w) => {
      const exp = transactions
        .filter((t) => {
          const d = new Date(t.transactedAt);
          return (
            t.type === "expense" &&
            d.getFullYear() === selectedYear &&
            d.getMonth() === targetMonth &&
            d.getDate() >= w.start &&
            d.getDate() <= w.end
          );
        })
        .reduce((acc, t) => acc + t.amount, 0);
      return { ...w, amount: exp };
    });
  }, [timeRange, isMultiMonthActive, selectedMonths, currentMonth, selectedYear, transactions]);

  const maxSingleMonthWeekAmount = useMemo(() => {
    if (!singleMonthWeeksData.length) return 1;
    return Math.max(...singleMonthWeeksData.map((w) => w.amount), 1);
  }, [singleMonthWeeksData]);

  // Datos para Gráfico Semanal (7 días)
  const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekRange.start);
      d.setDate(d.getDate() + i);
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
  }, [weekRange, transactions, todayStr]);

  const maxWeekAmount = useMemo(() => {
    return Math.max(...weekData.map((d) => d.amount), 1);
  }, [weekData]);

  // Datos para Gráfico Anual (12 Meses)
  const yearData = useMemo(() => {
    return MONTH_NAMES_SHORT.map((name, idx) => {
      const inc = transactions
        .filter((t) => {
          const d = new Date(t.transactedAt);
          return (
            t.type === "income" &&
            d.getFullYear() === selectedYear &&
            d.getMonth() === idx
          );
        })
        .reduce((acc, t) => acc + t.amount, 0);

      const exp = transactions
        .filter((t) => {
          const d = new Date(t.transactedAt);
          return (
            t.type === "expense" &&
            d.getFullYear() === selectedYear &&
            d.getMonth() === idx
          );
        })
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        month: name,
        income: inc,
        expense: exp,
        isCurrentMonth: selectedYear === currentYear && idx === currentMonth,
      };
    });
  }, [transactions, selectedYear, currentYear, currentMonth]);

  const maxYearAmount = useMemo(() => {
    return Math.max(...yearData.map((d) => Math.max(d.income, d.expense)), 1);
  }, [yearData]);

  // Transacciones filtradas para el explorador
  const explorerTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => {
      if (txTypeFilter === "expense" && t.type !== "expense") return false;
      if (txTypeFilter === "income" && t.type !== "income") return false;
      if (txTypeFilter === "ant" && !t.isAntExpense) return false;

      if (txSearchQuery.trim()) {
        const query = txSearchQuery.toLowerCase();
        const matchDesc = t.description.toLowerCase().includes(query);
        const matchAcc = t.accountName?.toLowerCase().includes(query) || false;
        const matchCat = t.category.toLowerCase().includes(query);
        const matchGoal = t.goalTitle?.toLowerCase().includes(query) || false;
        if (!matchDesc && !matchAcc && !matchCat && !matchGoal) return false;
      }

      return true;
    });
  }, [filteredTransactions, txTypeFilter, txSearchQuery]);

  // Exportar a CSV inteligente con nombre personalizado según período
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

    const sanitizeCsvCell = (val: string | number | undefined) => {
      if (val === undefined || val === null) return '""';
      let s = String(val);
      if (/^[=+\-@\t\r]/.test(s)) {
        s = "'" + s;
      }
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = filteredTransactions.map((t) => [
      sanitizeCsvCell(t.id),
      sanitizeCsvCell(t.transactedAt),
      sanitizeCsvCell(t.type),
      sanitizeCsvCell(t.description),
      sanitizeCsvCell(t.category),
      t.amount,
      sanitizeCsvCell(t.accountName || ""),
      t.isAntExpense ? '"SI"' : '"NO"',
      sanitizeCsvCell(t.goalTitle || ""),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    let periodFilenameSuffix: string = timeRange;
    if (timeRange === "month") {
      periodFilenameSuffix = isMultiMonthActive
        ? `acumulado_${selectedMonths.map((m) => MONTH_NAMES_SHORT[m]).join("-")}_${selectedYear}`
        : `${MONTH_NAMES_SHORT[selectedMonths[0]]}_${selectedYear}`;
    } else if (timeRange === "year") {
      periodFilenameSuffix = `anual_${selectedYear}`;
    } else if (timeRange === "day") {
      periodFilenameSuffix = `dia_${selectedDay}`;
    }

    link.setAttribute("href", url);
    link.setAttribute("download", `finpulse_reporte_${periodFilenameSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Texto legible del período activo
  const activePeriodLabel = useMemo(() => {
    if (timeRange === "day") {
      return `Jornada: ${selectedDay}${selectedDay === todayStr ? " (Hoy)" : ""}`;
    }
    if (timeRange === "week") {
      return `Semana: ${weekRange.startStr} al ${weekRange.endStr}`;
    }
    if (timeRange === "year") {
      return `Año Completo ${selectedYear}`;
    }
    if (isMultiMonthActive) {
      const names = selectedMonths.map((m) => MONTH_NAMES_SHORT[m]).join(", ");
      return `Acumulado (${selectedMonths.length} meses): ${names} de ${selectedYear}`;
    }
    return `Mes: ${MONTH_NAMES_FULL[selectedMonths[0]]} de ${selectedYear}`;
  }, [timeRange, selectedDay, todayStr, weekRange, isMultiMonthActive, selectedMonths, selectedYear]);

  return (
    <div className="obsidian-panel rounded-3xl p-5 sm:p-7 space-y-6 border border-slate-800/80">
      {/* 1. Barra de Título, Filtros de Rango y Exportar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">
              {LABELS.nav.reports}
            </h3>
            {isMultiMonthActive && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-black uppercase">
                Acumulado Multi-Mes
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Analítica de ingresos, gastos, promedio de vida y evolución financiera
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
              Mensual / Acumulado
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

          {/* Botón de Exportar a CSV Inteligente */}
          <button
            onClick={handleExportCSV}
            className="p-2 sm:px-3 sm:py-1.5 rounded-2xl bg-[#0E1526] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Exportar movimientos del período a CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Controles de Navegación por Historial y Selección Multi-Mes */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#070A12] border border-slate-800/90 space-y-4">
        {/* Navegación según TimeRange */}
        {timeRange === "month" && (
          <div className="space-y-3.5">
            {/* Cabecera del Navegador Mensual: Año y Modo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Selector de Año con Flechas */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    hapticTap();
                    setSelectedYear((prev) => prev - 1);
                  }}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                  title="Año anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-black font-mono text-white px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  {selectedYear}
                </span>
                <button
                  onClick={() => {
                    hapticTap();
                    setSelectedYear((prev) => prev + 1);
                  }}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                  title="Año siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Botón rápido si no está en el año/mes actual */}
                {(selectedYear !== currentYear || selectedMonths[0] !== currentMonth) && (
                  <button
                    onClick={handleResetToPresent}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 transition-all ml-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Volver a Hoy</span>
                  </button>
                )}
              </div>

              {/* Conmutador Modo Mes Único vs Multi-Mes Acumulado */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => {
                    hapticTap();
                    setIsMultiMonthMode(false);
                    if (selectedMonths.length > 1) {
                      setSelectedMonths([selectedMonths[selectedMonths.length - 1]]);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    !isMultiMonthMode
                      ? "bg-slate-800 text-white font-black shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Mes Único
                </button>
                <button
                  onClick={() => {
                    hapticTap();
                    setIsMultiMonthMode(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isMultiMonthMode
                      ? "bg-purple-600 text-white font-black shadow-md shadow-purple-600/30"
                      : "text-purple-300 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Acumular Varios Meses</span>
                </button>
              </div>
            </div>

            {/* Presets Rápidos de Selección Multi-Mes */}
            {isMultiMonthMode && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-1">
                  Atajos Rápidos:
                </span>
                <button
                  onClick={() => handlePresetSelect("current")}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  Solo Este Mes
                </button>
                <button
                  onClick={() => handlePresetSelect("q3")}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 transition-colors"
                >
                  Últimos 3 Meses
                </button>
                <button
                  onClick={() => handlePresetSelect("h6")}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 transition-colors"
                >
                  Últimos 6 Meses
                </button>
                <button
                  onClick={() => handlePresetSelect("fullYear")}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 transition-colors"
                >
                  Todo el {selectedYear} (12 Meses)
                </button>
              </div>
            )}

            {/* Matriz Táctil de los 12 Meses */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-1">
              {MONTH_NAMES_SHORT.map((name, idx) => {
                const isSelected = selectedMonths.includes(idx);
                const hasData = monthsWithTransactions.has(idx);
                const isActualMonth = selectedYear === currentYear && idx === currentMonth;

                return (
                  <button
                    key={idx}
                    onClick={() => handleMonthToggle(idx)}
                    className={`relative py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all flex flex-col items-center justify-center border ${
                      isSelected
                        ? isMultiMonthMode
                          ? "bg-purple-600/90 text-white border-purple-400 shadow-md shadow-purple-600/20"
                          : "bg-[#00F5A0] text-slate-950 border-[#00F5A0] font-black shadow-md shadow-[#00F5A0]/20"
                        : hasData
                        ? "bg-slate-900/90 text-slate-200 border-slate-700/80 hover:border-slate-500"
                        : "bg-slate-950/50 text-slate-500 border-slate-800/60 hover:text-slate-300"
                    }`}
                  >
                    <span>{name}</span>
                    {/* Indicador de Transacciones (Punto Lindo) */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {hasData && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected
                              ? isMultiMonthMode
                                ? "bg-white"
                                : "bg-slate-950"
                              : "bg-[#00F5A0]"
                          }`}
                        />
                      )}
                      {isActualMonth && !isSelected && (
                        <span className="text-[8px] font-black uppercase text-cyan-400">
                          Hoy
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navegador Diario */}
        {timeRange === "day" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00F5A0]" />
              <span className="text-xs font-bold text-white uppercase font-mono">
                Navegar por Día:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  const d = new Date(selectedDay);
                  d.setDate(d.getDate() - 1);
                  setSelectedDay(getLocalDateString(d));
                }}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

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

              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  const d = new Date(selectedDay);
                  d.setDate(d.getDate() + 1);
                  setSelectedDay(getLocalDateString(d));
                }}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navegador Semanal */}
        {timeRange === "week" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase font-mono">
                Semana: {weekRange.startStr} al {weekRange.endStr}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  hapticTap();
                  setWeekOffset((prev) => prev - 1);
                }}
                className="p-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Semana Anterior</span>
              </button>

              {weekOffset !== 0 && (
                <button
                  onClick={() => {
                    hapticTap();
                    setWeekOffset(0);
                  }}
                  className="px-3 py-1 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold border border-cyan-500/30"
                >
                  Semana Actual
                </button>
              )}

              <button
                onClick={() => {
                  hapticTap();
                  setWeekOffset((prev) => prev + 1);
                }}
                className="p-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center gap-1"
              >
                <span>Semana Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Navegador Anual */}
        {timeRange === "year" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase font-mono">
                Año Seleccionado:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  hapticTap();
                  setSelectedYear((prev) => prev - 1);
                }}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-base font-black font-mono text-white px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">
                {selectedYear}
              </span>
              <button
                onClick={() => {
                  hapticTap();
                  setSelectedYear((prev) => prev + 1);
                }}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Banner de Estado del Período Activo */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00F5A0]" />
            <span className="text-white font-bold">{activePeriodLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>{filteredTransactions.length} movimientos en este período</span>
            {isMultiMonthActive && (
              <span className="text-purple-400 font-bold">
                (Base de cálculo: {selectedMonths.length} meses)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Tarjetas de Resumen KPI con Código de Color y Superávit */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="obsidian-card p-4 rounded-2xl border-l-2 border-l-[#00F5A0]">
          <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
            Ingresos Totales
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
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Balance / Superávit
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                netBalance >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
              }`}
            >
              {savingsRate.toFixed(1)}% tasa
            </span>
          </div>
          <span
            className={`text-lg sm:text-xl font-black font-mono ${
              netBalance >= 0 ? "text-purple-300" : "text-rose-400"
            }`}
          >
            {netBalance >= 0 ? "+" : ""}
            {formatCurrency(netBalance)}
          </span>
        </div>

        <div className="obsidian-card p-4 rounded-2xl border-l-2 border-l-amber-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Gastos Hormiga 🐜
            </span>
            {totalExpense > 0 && (
              <span className="text-[10px] font-mono font-bold text-amber-400">
                {((antExpensesTotal / totalExpense) * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <span className="text-lg sm:text-xl font-black font-mono text-amber-400">
            {formatCurrency(antExpensesTotal)}
          </span>
        </div>
      </div>

      {/* Tarjeta Extra: Promedios Mensuales (Solo cuando se seleccionan 2 o más meses) */}
      {isMultiMonthActive && (
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase font-mono text-purple-200">
                Promedios Mensuales de tu Economía
              </h4>
              <p className="text-[11px] text-slate-400">
                Calculados a lo largo de los {selectedMonths.length} meses seleccionados ({selectedMonths.map((m) => MONTH_NAMES_SHORT[m]).join(", ")})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Costo de Vida Medio
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-rose-300">
                {formatCurrency(avgMonthlyExpense)} / mes
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Ingreso Medio
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-[#00F5A0]">
                {formatCurrency(avgMonthlyIncome)} / mes
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Ahorro Medio
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-purple-300">
                {avgMonthlySavings >= 0 ? "+" : ""}
                {formatCurrency(avgMonthlySavings)} / mes
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Gráficos Visuales de Evolución */}
      {/* Caso A: Gráfico Comparativo Mes a Mes en Modo Acumulado */}
      {isMultiMonthActive && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Comparativa de Meses Seleccionados ({selectedMonths.length} meses)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Verde: Ingresos | Rojo: Gastos
            </span>
          </h4>

          <div className="p-4 rounded-2xl bg-[#070A12]/90 border border-slate-800">
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 overflow-x-auto">
              {multiMonthChartData.map((d) => {
                const incHeight = Math.min(100, Math.max(6, (d.income / maxMultiMonthAmount) * 100));
                const expHeight = Math.min(100, Math.max(6, (d.expense / maxMultiMonthAmount) * 100));

                return (
                  <div
                    key={d.monthIndex}
                    className="flex-1 min-w-[50px] flex flex-col items-center gap-2 group h-full justify-end"
                  >
                    <div className="relative w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Barra Ingresos */}
                      <div
                        className="w-1/2 max-w-[20px] bg-[#00F5A0] rounded-t-md transition-all shadow-sm group-hover:brightness-125"
                        style={{ height: `${incHeight}%` }}
                        title={`Ingresos ${d.fullName}: ${formatCurrency(d.income)}`}
                      />
                      {/* Barra Gastos */}
                      <div
                        className="w-1/2 max-w-[20px] bg-rose-500 rounded-t-md transition-all shadow-sm group-hover:brightness-125"
                        style={{ height: `${expHeight}%` }}
                        title={`Gastos ${d.fullName}: ${formatCurrency(d.expense)}`}
                      />

                      {/* Tooltip con balance neto del mes */}
                      <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-white text-[10px] font-mono px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-2xl">
                        <div>{d.fullName}</div>
                        <div className={d.net >= 0 ? "text-[#00F5A0]" : "text-rose-400"}>
                          Neto: {d.net >= 0 ? "+" : ""}{formatCurrency(d.net)}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-black text-slate-300">
                      {d.monthName}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-6 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#00F5A0]" /> Ingresos del mes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Gastos del mes
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Caso B: Gráfico de Semanas de Mes Único */}
      {timeRange === "month" && !isMultiMonthActive && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#00F5A0]" />
              Evolución Semanal de {MONTH_NAMES_FULL[selectedMonths[0]]} {selectedYear}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Promedio semanal: {formatCurrency(totalExpense / 4)}
            </span>
          </h4>

          <div className="p-4 rounded-2xl bg-[#070A12]/90 border border-slate-800">
            <div className="h-44 flex items-end justify-between gap-4 pt-6 pb-2">
              {singleMonthWeeksData.map((w, idx) => {
                const heightPct = Math.min(100, Math.max(8, (w.amount / maxSingleMonthWeekAmount) * 100));
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

      {/* Caso C: Gráfico Semanal (7 Días) */}
      {timeRange === "week" && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Curva de Gastos Diarios de la Semana
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

      {/* Caso D: Gráfico Anual (12 Meses con Barras Dobles) */}
      {timeRange === "year" && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Evolución Anual (Ingresos vs Gastos {selectedYear})
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

      {/* 5. Distribución por Categorías con Ranking Visual */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase font-mono text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-cyan-400" />
            {LABELS.reports.expensesByCategory} del Período
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {categoryBreakdown.length} categorías con gasto
          </span>
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
            <div className="text-center py-6 text-xs text-slate-500">
              <CheckCircle2 className="w-6 h-6 text-[#00F5A0] mx-auto mb-1.5" />
              <p className="text-slate-300 font-bold">Sin gastos en este período</p>
              <p className="text-slate-500 mt-0.5">
                No hay movimientos registrados para el filtro actual.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 6. Explorador y Auditoría de Movimientos del Período */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold uppercase font-mono text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00F5A0]" />
              Auditoría de Movimientos del Período
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
                {explorerTransactions.length} de {filteredTransactions.length}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Revisa con exactitud cada transacción que compone los totales de este informe
            </p>
          </div>

          {/* Filtros de Tipo */}
          <div className="flex items-center gap-1 bg-[#070A12] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTxTypeFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                txTypeFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTxTypeFilter("expense")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                txTypeFilter === "expense" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Gastos
            </button>
            <button
              onClick={() => setTxTypeFilter("income")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                txTypeFilter === "income" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Ingresos
            </button>
            <button
              onClick={() => setTxTypeFilter("ant")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                txTypeFilter === "ant" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Hormiga 🐜
            </button>
          </div>
        </div>

        {/* Buscador de Movimientos */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por comercio, concepto, meta o cuenta..."
            value={txSearchQuery}
            onChange={(e) => setTxSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#070A12] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>

        {/* Listado de Movimientos */}
        <div className="divide-y divide-slate-800/80 bg-[#070A12]/80 rounded-2xl p-2 border border-slate-800 max-h-80 overflow-y-auto">
          {explorerTransactions.map((tx) => (
            <div
              key={tx.id}
              className="py-2.5 px-2.5 flex items-center justify-between text-xs hover:bg-slate-850/40 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-2.5 truncate mr-3">
                <div className="text-[10px] font-mono text-slate-500 w-16 shrink-0">
                  {formatDate(tx.transactedAt)}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-200 font-bold truncate">
                      {tx.description}
                    </span>
                    {tx.isAntExpense && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0">
                        🐜 Hormiga
                      </span>
                    )}
                    {tx.goalTitle && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold shrink-0">
                        🎯 {tx.goalTitle}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {tx.category} • {tx.accountName || "Sin cuenta"}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
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

          {explorerTransactions.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No hay movimientos que coincidan con la búsqueda o filtro en este período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
