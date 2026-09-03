"use client";

import React from "react";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { LABELS } from "@/constants/labels";
import { useHaptics } from "@/hooks/useHaptics";
import { Command, UserCircle2, LogIn, LayoutDashboard, ReceiptText, CreditCard, Trophy, BarChart3 } from "lucide-react";

interface NavbarProps {
  activeTab: "dashboard" | "transactions" | "accounts" | "goals" | "reports";
  onTabChange: (tab: "dashboard" | "transactions" | "accounts" | "goals" | "reports") => void;
  onOpenShortcuts: () => void;
  userEmail?: string;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenShortcuts,
  userEmail,
  onOpenAuthModal,
}) => {
  const { hapticTap } = useHaptics();

  const handleTabClick = (tab: "dashboard" | "transactions" | "accounts" | "goals" | "reports") => {
    hapticTap();
    onTabChange(tab);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-[#090D18]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Oficial FinPulse */}
        <div onClick={() => handleTabClick("dashboard")}>
          <BrandLogo size="sm" showTagline={false} />
        </div>

        {/* Desktop Navigation Links con Código de Color Funcional */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#070A12]/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => handleTabClick("dashboard")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "dashboard"
                ? "bg-[#00F5A0] text-slate-950 font-black shadow-md shadow-[#00F5A0]/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{LABELS.nav.dashboard}</span>
          </button>

          <button
            onClick={() => handleTabClick("transactions")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "transactions"
                ? "bg-rose-500 text-white font-black shadow-md shadow-rose-500/25"
                : "text-slate-400 hover:text-rose-400"
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>{LABELS.nav.transactions}</span>
          </button>

          <button
            onClick={() => handleTabClick("accounts")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "accounts"
                ? "bg-blue-600 text-white font-black shadow-md shadow-blue-500/25"
                : "text-slate-400 hover:text-blue-400"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{LABELS.nav.accounts}</span>
          </button>

          <button
            onClick={() => handleTabClick("goals")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "goals"
                ? "bg-purple-600 text-white font-black shadow-md shadow-purple-500/25"
                : "text-slate-400 hover:text-purple-400"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{LABELS.nav.goals}</span>
          </button>

          <button
            onClick={() => handleTabClick("reports")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "reports"
                ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-cyan-400"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{LABELS.nav.reports}</span>
          </button>
        </nav>

        {/* Acciones del Lado Derecho */}
        <div className="flex items-center gap-2.5">
          {/* Botón de Atajos */}
          <button
            onClick={() => {
              hapticTap();
              onOpenShortcuts();
            }}
            className="p-2.5 rounded-xl bg-[#0E1526] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Ver atajos de teclado (?)"
          >
            <Command className="w-4 h-4" />
          </button>

          {/* Estado de Usuario */}
          {userEmail ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-[#00F5A0]/20 text-[#00F5A0] flex items-center justify-center font-bold text-xs border border-[#00F5A0]/40">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-300 hidden lg:inline max-w-[120px] truncate">
                {userEmail}
              </span>
            </div>
          ) : (
            <button
              onClick={() => {
                hapticTap();
                if (onOpenAuthModal) onOpenAuthModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0E1526] hover:bg-slate-850 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5 transition-colors font-bold"
            >
              <LogIn className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span>{LABELS.nav.login}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
