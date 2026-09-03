"use client";

import React from "react";
import { LayoutDashboard, ReceiptText, Trophy, BarChart3, Plus } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

interface MobileTabBarProps {
  activeTab: "dashboard" | "transactions" | "accounts" | "goals" | "reports";
  onTabChange: (tab: "dashboard" | "transactions" | "accounts" | "goals" | "reports") => void;
  onOpenQuickAction: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  onOpenQuickAction,
}) => {
  const { hapticTap } = useHaptics();

  const handleTabClick = (tab: "dashboard" | "transactions" | "accounts" | "goals" | "reports") => {
    hapticTap();
    onTabChange(tab);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D18]/95 backdrop-blur-xl border-t border-slate-800/90 px-4 py-2 shadow-2xl">
      <div className="flex items-center justify-around">
        <button
          onClick={() => handleTabClick("dashboard")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
            activeTab === "dashboard" ? "text-[#00F5A0] scale-105" : "text-slate-400"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => handleTabClick("transactions")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
            activeTab === "transactions" ? "text-rose-400 scale-105" : "text-slate-400"
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span>Gastos</span>
        </button>

        {/* Botón Central Flotante de Registro Rápido */}
        <button
          onClick={() => {
            hapticTap();
            onOpenQuickAction();
          }}
          className="w-13 h-13 -mt-6 rounded-full bg-gradient-to-tr from-[#00F5A0] to-[#00D9F5] hover:brightness-110 text-slate-950 flex items-center justify-center shadow-xl shadow-[#00F5A0]/40 border-4 border-[#090D18] transition-transform active:scale-90"
          aria-label="Registrar gasto"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>

        <button
          onClick={() => handleTabClick("goals")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
            activeTab === "goals" ? "text-purple-400 scale-105" : "text-slate-400"
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span>Metas</span>
        </button>

        <button
          onClick={() => handleTabClick("reports")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
            activeTab === "reports" ? "text-cyan-400 scale-105" : "text-slate-400"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Métricas</span>
        </button>
      </div>
    </div>
  );
};
