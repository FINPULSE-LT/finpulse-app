"use client";

import React, { useState } from "react";
import { COACH_PERSONALITIES, COACH_MESSAGES, CoachPersonalityType } from "@/constants/coach";
import { Sparkles, Smile, Flame, ChevronDown } from "lucide-react";

interface CoachWidgetProps {
  currentMode: CoachPersonalityType;
  onModeChange: (newMode: CoachPersonalityType) => void;
  streakCount: number;
}

export const CoachWidget: React.FC<CoachWidgetProps> = ({
  currentMode,
  onModeChange,
  streakCount,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const activePersonality = COACH_PERSONALITIES[currentMode];

  // Selección de mensaje dinámico según la racha y el modo
  const messages = COACH_MESSAGES.streakClean[currentMode];
  const dynamicMessage = streakCount > 0
    ? messages[streakCount % messages.length]
    : "Comienza hoy tu racha libre de gastos hormiga registrando tus movimientos.";

  const getIcon = (type: CoachPersonalityType) => {
    switch (type) {
      case "zen":
        return <Sparkles className="w-5 h-5 text-teal-400" />;
      case "strict":
        return <Flame className="w-5 h-5 text-rose-400" />;
      default:
        return <Smile className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden border border-slate-800 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-md">
            {getIcon(currentMode)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">
                {activePersonality.name}
              </h4>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${activePersonality.badge}`}>
                Coach Financiero
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed italic">
              &quot;{dynamicMessage}&quot;
            </p>
          </div>
        </div>

        {/* Selector de Exigencia */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium transition-colors"
          >
            <span>Cambiar tono</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30">
              <span className="block px-2.5 py-1 text-[10px] uppercase font-mono text-slate-400 font-semibold">
                Nivel de Exigencia
              </span>
              {(Object.keys(COACH_PERSONALITIES) as CoachPersonalityType[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    onModeChange(mode);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                    currentMode === mode
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                  }`}
                >
                  {getIcon(mode)}
                  <span>{COACH_PERSONALITIES[mode].name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
