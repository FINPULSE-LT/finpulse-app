"use client";

import React from "react";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { LABELS } from "@/constants/labels";
import { useHaptics } from "@/hooks/useHaptics";
import {
  Command,
  LogIn,
  LogOut,
  LayoutDashboard,
  ReceiptText,
  CreditCard,
  Trophy,
  BarChart3,
  Sparkles,
} from "lucide-react";

interface NavbarProps {
  activeTab: "dashboard" | "transactions" | "accounts" | "goals" | "reports";
  onTabChange: (tab: "dashboard" | "transactions" | "accounts" | "goals" | "reports") => void;
  onOpenShortcuts: () => void;
  userEmail?: string;
  isDemoMode?: boolean;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenShortcuts,
  userEmail,
  isDemoMode,
  onOpenAuthModal,
  onLogout,
}) => {
  const { hapticTap, hapticWarning } = useHaptics();

  const handleTabClick = (tab: "dashboard" | "transactions" | "accounts" | "goals" | "reports") => {
    hapticTap();
    onTabChange(tab);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/40 bg-[#06110D]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Oficial FinPulse */}
        <div onClick={() => handleTabClick("dashboard")}>
          <BrandLogo size="sm" showTagline={false} />
        </div>

        {/* Desktop Navigation Links con Código de Color Funcional */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#081712]/90 p-1.5 rounded-2xl border border-emerald-900/40 shadow-inner">
          <button
            onClick={() => handleTabClick("dashboard")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === "dashboard"
                ? "bg-[#00F5A0] text-slate-950 font-black shadow-md shadow-[#00F5A0]/25"
                : "text-slate-300 hover:text-white"
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
                : "text-slate-300 hover:text-rose-400"
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
                : "text-slate-300 hover:text-blue-400"
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
                : "text-slate-300 hover:text-purple-400"
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
                : "text-slate-300 hover:text-cyan-400"
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
            className="p-2.5 rounded-xl bg-[#081712] hover:bg-[#0D241C] text-slate-300 hover:text-white border border-emerald-900/50 transition-colors"
            title="Ver atajos de teclado (?)"
          >
            <Command className="w-4 h-4" />
          </button>

          {/* Badge de Modo Demo */}
          {isDemoMode && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-[#00F5A0] text-[11px] font-mono font-bold border border-emerald-500/30">
              <Sparkles className="w-3 h-3" />
              <span>Modo Demo</span>
            </span>
          )}

          {/* Estado de Usuario o Login */}
          {userEmail ? (
            <div className="flex items-center gap-2 pl-2 border-l border-emerald-900/50">
              <div className="w-8 h-8 rounded-full bg-[#00F5A0]/20 text-[#00F5A0] flex items-center justify-center font-bold text-xs border border-[#00F5A0]/40">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-200 hidden lg:inline max-w-[120px] truncate font-medium">
                {userEmail}
              </span>
              {onLogout && (
                <button
                  onClick={() => {
                    hapticWarning();
                    onLogout();
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : isDemoMode && onLogout ? (
            <button
              onClick={() => {
                hapticWarning();
                onLogout();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#081712] hover:bg-[#0D241C] border border-emerald-900/50 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors font-bold"
              title="Volver a la portada de inicio"
            >
              <LogOut className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Salir de Demo</span>
            </button>
          ) : (
            <button
              onClick={() => {
                hapticTap();
                if (onOpenAuthModal) onOpenAuthModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#081712] hover:bg-[#0D241C] border border-emerald-900/50 text-xs text-slate-200 flex items-center gap-1.5 transition-colors font-bold"
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
