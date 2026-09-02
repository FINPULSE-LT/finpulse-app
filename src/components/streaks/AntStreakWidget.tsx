"use client";

import React from "react";
import { LABELS } from "@/constants/labels";
import { formatCurrency } from "@/lib/formatters/currency";
import { calculateLevel } from "@/lib/streaks/engine";
import { Flame, ShieldCheck, Zap, Award } from "lucide-react";

interface AntStreakWidgetProps {
  streakCount: number;
  rescuedMoney: number;
  freezeAvailable: boolean;
  onSimulateCleanDay?: () => void;
}

export const AntStreakWidget: React.FC<AntStreakWidgetProps> = ({
  streakCount,
  rescuedMoney,
  freezeAvailable,
}) => {
  const level = calculateLevel(streakCount);

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-slate-900/60 to-slate-900/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Lado Izquierdo: Fuego y Racha */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Flame className="w-7 h-7 fill-amber-400 animate-pulse" />
            </div>
            {streakCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-900">
                {streakCount}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {LABELS.streaks.daysCount(streakCount)}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                <Award className="w-3 h-3" />
                {level.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {streakCount > 0 ? LABELS.streaks.fireSubtitle : "Registra tus gastos del día para comenzar a sumar fuego."}
            </p>
          </div>
        </div>

        {/* Lado Derecho: Dinero Rescatado & Escudo */}
        <div className="flex items-center gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
              {LABELS.streaks.rescuedTitle}
            </span>
            <span className="text-lg font-extrabold font-mono text-emerald-400 tracking-tight">
              +{formatCurrency(rescuedMoney)}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs">
            {freezeAvailable ? (
              <>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300 text-[11px] font-medium hidden sm:inline">Escudo activo</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-slate-500" />
                <span className="text-slate-500 text-[11px]">Escudo usado</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
