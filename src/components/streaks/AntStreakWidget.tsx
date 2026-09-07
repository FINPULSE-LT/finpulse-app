"use client";

import React from "react";
import { LABELS } from "@/constants/labels";
import { formatCurrency } from "@/lib/formatters/currency";
import { calculateLevel } from "@/lib/streaks/engine";
import { Flame, ShieldCheck, Zap, Award, Info, X } from "lucide-react";

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
  const [showInfo, setShowInfo] = React.useState(false);
  const level = calculateLevel(streakCount);

  return (
    <div className="glass-card rounded-3xl p-4 sm:p-5 relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-slate-900/60 to-slate-900/80 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Lado Izquierdo: Fuego y Racha */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <Flame className="w-7 h-7 fill-amber-400 animate-pulse" />
            </div>
            {streakCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-900">
                {streakCount}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-white tracking-tight whitespace-nowrap">
                {LABELS.streaks.daysCount(streakCount)}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold whitespace-nowrap shrink-0">
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>{level.name}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {streakCount > 0 ? LABELS.streaks.fireSubtitle : "Registra tus gastos del día para comenzar a sumar fuego."}
            </p>
          </div>
        </div>

        {/* Lado Derecho: Dinero Rescatado & Escudo */}
        <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80 shrink-0">
          <div className="text-left md:text-right">
            <div className="flex items-center gap-1 md:justify-end">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold whitespace-nowrap">
                {LABELS.streaks.rescuedTitle}
              </span>
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
                title="¿Cómo se calcula el dinero rescatado?"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-base sm:text-lg font-extrabold font-mono text-emerald-400 tracking-tight whitespace-nowrap block">
              +{formatCurrency(rescuedMoney)}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-1.5 text-xs shrink-0 whitespace-nowrap shadow-sm">
            {freezeAvailable ? (
              <>
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-cyan-300 text-[11px] font-bold">Escudo activo</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-slate-500 text-[11px] font-medium">Escudo usado</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Tooltip Desplegable */}
      {showInfo && (
        <div className="mt-3.5 p-3 rounded-2xl bg-[#090D18] border border-cyan-500/30 text-xs text-slate-300 space-y-1 animate-in fade-in">
          <div className="flex items-center justify-between font-bold text-cyan-300 text-xs">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              ¿Cómo se calcula el Dinero Rescatado?
            </span>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Se calcula sumando <strong>$ 4.500</strong> por cada día consecutivo que completas sin registrar gastos hormiga ni compras impulsivas. Es el dinero estimado que lograste retener en tu economía y que de otro modo se hubiera esfumado en gastos invisibles.
          </p>
        </div>
      )}
    </div>
  );
};
