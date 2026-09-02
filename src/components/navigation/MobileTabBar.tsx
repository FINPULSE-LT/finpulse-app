"use client";

import React from "react";
import { LayoutDashboard, ReceiptText, Trophy, BarChart3, Plus } from "lucide-react";

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
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800 px-4 py-2">
      <div className="flex items-center justify-around">
        <button
          onClick={() => onTabChange("dashboard")}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === "dashboard" ? "text-brand-400 font-bold" : "text-slate-400"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => onTabChange("transactions")}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === "transactions" ? "text-brand-400 font-bold" : "text-slate-400"
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span>Gastos</span>
        </button>

        {/* Botón Central Flotante de Registro Rápido */}
        <button
          onClick={onOpenQuickAction}
          className="w-12 h-12 -mt-5 rounded-full bg-brand-500 hover:bg-brand-400 text-slate-950 flex items-center justify-center shadow-lg shadow-brand-500/40 border-4 border-slate-950 transition-transform active:scale-90"
          aria-label="Registrar gasto"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          onClick={() => onTabChange("goals")}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === "goals" ? "text-brand-400 font-bold" : "text-slate-400"
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span>Metas</span>
        </button>

        <button
          onClick={() => onTabChange("reports")}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === "reports" ? "text-brand-400 font-bold" : "text-slate-400"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Métricas</span>
        </button>
      </div>
    </div>
  );
};
