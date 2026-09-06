"use client";

import React from "react";
import { Transaction, Account } from "@/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { useHaptics } from "@/hooks/useHaptics";
import { ShieldCheck, TrendingUp, AlertCircle, Sparkles, Award } from "lucide-react";

interface PulseScoreWidgetProps {
  accounts: Account[];
  transactions: Transaction[];
  streakCount: number;
}

export const PulseScoreWidget: React.FC<PulseScoreWidgetProps> = ({
  accounts,
  transactions,
  streakCount,
}) => {
  const { hapticTap } = useHaptics();

  // 1. Cálculos de Ingresos y Gastos del Mes
  const now = new Date();
  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.transactedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalAntExpense = monthTransactions
    .filter((t) => t.isAntExpense)
    .reduce((acc, t) => acc + t.amount, 0);

  // 2. Saldos y Deuda de Tarjetas
  const liquidBalance = accounts
    .filter((a) => a.accountType !== "credit_card")
    .reduce((acc, a) => acc + a.balance, 0);

  const creditCardDebt = accounts
    .filter((a) => a.accountType === "credit_card")
    .reduce((acc, a) => acc + Math.max(0, a.balance), 0);

  // 3. Algoritmo de Score 0 - 1000
  // Pilar A: Tasa de Ahorro (0 a 350 pts)
  const savingsRate = totalIncome > 0 ? Math.max(0, (totalIncome - totalExpense) / totalIncome) : 0;
  const savingsPoints = Math.min(350, Math.round(savingsRate * 1400));

  // Pilar B: Colchón de Liquidez (0 a 250 pts)
  const monthlyBurn = totalExpense > 0 ? totalExpense : 50000;
  const monthsOfRunway = liquidBalance / monthlyBurn;
  const runwayPoints = Math.min(250, Math.round((monthsOfRunway / 3) * 250));

  // Pilar C: Control de Endeudamiento (0 a 250 pts)
  const debtRatio = totalIncome > 0 ? creditCardDebt / totalIncome : 0;
  const debtPoints = Math.max(0, Math.min(250, Math.round((1 - debtRatio) * 250)));

  // Pilar D: Disciplina y Racha (0 a 150 pts)
  const antRatio = totalExpense > 0 ? totalAntExpense / totalExpense : 0;
  const antPoints = Math.max(0, Math.min(75, Math.round((1 - antRatio * 3) * 75)));
  const streakPoints = Math.min(75, streakCount * 15);
  const disciplinePoints = antPoints + streakPoints;

  const totalScore = Math.max(100, Math.min(1000, savingsPoints + runwayPoints + debtPoints + disciplinePoints));

  // Clasificación Fintonic Style
  let statusText = "Excelente";
  let statusColor = "text-[#00F5A0]";
  let statusBadge = "bg-emerald-500/20 text-[#00F5A0] border-emerald-500/40";

  if (totalScore < 550) {
    statusText = "Atención Requerida";
    statusColor = "text-rose-400";
    statusBadge = "bg-rose-500/20 text-rose-300 border-rose-500/40";
  } else if (totalScore < 750) {
    statusText = "Saludable";
    statusColor = "text-amber-400";
    statusBadge = "bg-amber-500/20 text-amber-300 border-amber-500/40";
  }

  // Ángulo del tacómetro semicircular (180 grados)
  const needleAngle = -90 + (totalScore / 1000) * 180;

  return (
    <div className="obsidian-card rounded-3xl p-5 sm:p-6 border border-purple-500/25 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight">
              PulseScore Financiero
            </h3>
            <p className="text-[11px] text-slate-400">
              Índice de salud crediticia y solvencia estilo Fintonic
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${statusBadge}`}>
          {statusText}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-1">
        {/* Tacómetro Semicircular SVG */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-40 h-24 flex items-end justify-center overflow-hidden">
            <svg viewBox="0 0 160 90" className="w-full h-full">
              {/* Arco Base Semicircular */}
              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke="#0D1624"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Arco con Gradiente de Score */}
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF4D6D" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#00F5A0" />
                </linearGradient>
              </defs>

              <path
                d="M 20 80 A 60 60 0 0 1 140 80"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="188.5"
                strokeDashoffset={188.5 - (totalScore / 1000) * 188.5}
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Valor Numérico Central */}
            <div className="absolute bottom-0 flex flex-col items-center">
              <span className="text-3xl font-black font-mono text-white tracking-tight">
                {totalScore}
              </span>
              <span className="text-[9px] uppercase font-mono text-slate-400">
                de 1000 pts
              </span>
            </div>
          </div>
        </div>

        {/* Pilares y Consejos Accionables */}
        <div className="sm:col-span-7 space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#080E18] border border-slate-800">
            <span className="text-slate-300">Tasa de Ahorro ({(savingsRate * 100).toFixed(0)}%)</span>
            <span className="font-mono font-bold text-[#00F5A0]">+{savingsPoints} pts</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#080E18] border border-slate-800">
            <span className="text-slate-300">Reserva de Emergencia ({monthsOfRunway.toFixed(1)} meses)</span>
            <span className="font-mono font-bold text-cyan-400">+{runwayPoints} pts</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[#080E18] border border-slate-800">
            <span className="text-slate-300">Disciplina & Racha ({streakCount} días)</span>
            <span className="font-mono font-bold text-amber-400">+{disciplinePoints} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
