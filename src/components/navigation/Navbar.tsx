"use client";

import React from "react";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { LABELS } from "@/constants/labels";
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
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="cursor-pointer" onClick={() => onTabChange("dashboard")}>
          <BrandLogo size="sm" showTagline={false} />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onTabChange("dashboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === "dashboard"
                ? "bg-brand-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{LABELS.nav.dashboard}</span>
          </button>

          <button
            onClick={() => onTabChange("transactions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === "transactions"
                ? "bg-brand-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>{LABELS.nav.transactions}</span>
          </button>

          <button
            onClick={() => onTabChange("accounts")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === "accounts"
                ? "bg-brand-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{LABELS.nav.accounts}</span>
          </button>

          <button
            onClick={() => onTabChange("goals")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === "goals"
                ? "bg-brand-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{LABELS.nav.goals}</span>
          </button>

          <button
            onClick={() => onTabChange("reports")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === "reports"
                ? "bg-brand-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
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
            onClick={onOpenShortcuts}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Ver atajos de teclado (?)"
          >
            <Command className="w-4 h-4" />
          </button>

          {/* Estado de Usuario */}
          {userEmail ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs border border-brand-500/30">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-300 hidden lg:inline max-w-[120px] truncate">
                {userEmail}
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-brand-400" />
              <span>{LABELS.nav.login}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
