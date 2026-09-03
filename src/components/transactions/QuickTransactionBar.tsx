"use client";

import React, { useState, useRef } from "react";
import { parseTransactionTextLocally, matchAccountFromSuggestion } from "@/lib/ai/parser";
import { ParsedTransactionResult, Account, SavingsGoal } from "@/types";
import { LABELS } from "@/constants/labels";
import { formatCurrency } from "@/lib/formatters/currency";
import { useHaptics } from "@/hooks/useHaptics";
import { Sparkles, Mic, ArrowRight, Check, AlertCircle, Plus, Calendar, Target, ChevronDown } from "lucide-react";
import confetti from "canvas-confetti";

interface QuickTransactionBarProps {
  accounts: Account[];
  goals: SavingsGoal[];
  onSaveParsedTransaction: (
    data: ParsedTransactionResult,
    selectedAccountId?: string,
    targetGoalId?: string,
    customDate?: string
  ) => void;
  onOpenVoiceModal: () => void;
  onOpenManualModal: () => void;
}

export const QuickTransactionBar: React.FC<QuickTransactionBarProps> = ({
  accounts,
  goals,
  onSaveParsedTransaction,
  onOpenVoiceModal,
  onOpenManualModal,
}) => {
  const [inputText, setInputText] = useState("");
  const [parsed, setParsed] = useState<ParsedTransactionResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { hapticTap, hapticSuccess, hapticCelebration } = useHaptics();

  // Fecha predeterminada de hoy
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val.trim().length > 2) {
      const result = parseTransactionTextLocally(val);
      setParsed(result);

      // Si el parser detectó una fecha relativa ("ayer", etc.)
      if (result.dateSuggestion) {
        setSelectedDate(result.dateSuggestion);
      }

      // Emparejamiento Inteligente de Cuentas (BUG-01 Solucionado)
      if (result.accountSuggestion && accounts.length > 0) {
        const matchedAcc = matchAccountFromSuggestion(result.accountSuggestion, accounts);
        if (matchedAcc) {
          setSelectedAccountId(matchedAcc.id);
        }
      } else if (!selectedAccountId && accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }

      // Emparejamiento Inteligente de Metas si es Ahorro
      if (result.type === "saving_transfer" && goals.length > 0) {
        const cleanVal = val.toLowerCase();
        const matchedGoal = goals.find((g) =>
          cleanVal.includes(g.title.toLowerCase()) ||
          (g.title.toLowerCase().includes("vacaciones") && cleanVal.includes("vacaciones")) ||
          (g.title.toLowerCase().includes("emergencia") && cleanVal.includes("emergencia"))
        );
        setSelectedGoalId(matchedGoal ? matchedGoal.id : goals[0].id);
      }
    } else {
      setParsed(null);
    }
  };

  const handleConfirm = () => {
    if (!parsed || parsed.amount <= 0) return;

    onSaveParsedTransaction(
      {
        ...parsed,
        goalId: parsed.type === "saving_transfer" ? selectedGoalId : undefined,
      },
      selectedAccountId,
      parsed.type === "saving_transfer" ? selectedGoalId : undefined,
      selectedDate
    );

    // Respuesta háptica & Confetti
    if (parsed.type === "income" || parsed.type === "saving_transfer") {
      hapticCelebration();
      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.8 },
      });
    } else {
      hapticSuccess();
    }

    setInputText("");
    setParsed(null);
    setSelectedDate(todayStr);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && parsed && parsed.amount > 0) {
      e.preventDefault();
      handleConfirm();
    }
  };

  const getDateLabel = () => {
    if (selectedDate === todayStr) return "Hoy";
    if (selectedDate === yesterdayStr) return "Ayer";
    const [y, m, d] = selectedDate.split("-");
    return `${d}/${m}`;
  };

  return (
    <div className="obsidian-panel rounded-3xl p-4 sm:p-6 transition-all duration-300 relative overflow-hidden group border border-[#00F5A0]/20 hover:border-[#00F5A0]/40">
      {/* Barra superior de estado */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#00F5A0]/15 text-[#00F5A0] flex items-center justify-center font-bold shadow-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-black text-white tracking-wider uppercase font-mono">
            {LABELS.dashboard.quickInputTitle}
          </span>
        </div>

        {/* Gestor Rápido de Fecha del Registro */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => {
                hapticTap();
                setShowDatePicker(!showDatePicker);
              }}
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
                selectedDate === todayStr
                  ? "bg-[#0E1526] text-slate-300 border-slate-700/80 hover:border-[#00F5A0]/50"
                  : "bg-[#00F5A0]/15 text-[#00F5A0] border-[#00F5A0]/40 shadow-sm"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span>Fecha: {getDateLabel()}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 p-3 bg-[#0B0F19]/95 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-2xl z-30 space-y-2.5 min-w-[210px] animate-in fade-in zoom-in-95">
                <span className="block text-[10px] uppercase font-mono text-slate-400 font-bold px-1">
                  Fecha del Movimiento
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setSelectedDate(todayStr);
                      setShowDatePicker(false);
                    }}
                    className={`flex-1 py-1.5 text-xs rounded-xl font-bold transition-colors ${
                      selectedDate === todayStr
                        ? "bg-[#00F5A0] text-slate-950 shadow-md shadow-[#00F5A0]/30"
                        : "bg-slate-900 text-slate-300 hover:text-white"
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setSelectedDate(yesterdayStr);
                      setShowDatePicker(false);
                    }}
                    className={`flex-1 py-1.5 text-xs rounded-xl font-bold transition-colors ${
                      selectedDate === yesterdayStr
                        ? "bg-[#00F5A0] text-slate-950 shadow-md shadow-[#00F5A0]/30"
                        : "bg-slate-900 text-slate-300 hover:text-white"
                    }`}
                  >
                    Ayer
                  </button>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    hapticTap();
                    setSelectedDate(e.target.value);
                    setShowDatePicker(false);
                  }}
                  className="w-full px-3 py-1.5 bg-[#05070D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00F5A0] font-mono"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => {
              hapticTap();
              onOpenManualModal();
            }}
            className="text-[11px] text-slate-400 hover:text-[#00F5A0] flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Formulario completo</span>
          </button>
        </div>
      </div>

      {/* Input principal y Botones de Acción */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ej: 'Cena 18000 ayer con Visa' o 'Ahorré 25000 para las vacaciones'"
            className="w-full pl-4 pr-10 py-3.5 bg-[#070A12]/95 border border-slate-800 rounded-2xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-[#00F5A0] focus:ring-2 focus:ring-[#00F5A0]/20 transition-all shadow-inner font-sans tracking-tight"
          />
        </div>

        {/* Botón de Grabación por Voz */}
        <button
          onClick={() => {
            hapticTap();
            onOpenVoiceModal();
          }}
          className="p-3.5 rounded-2xl bg-[#0E1526] hover:bg-[#00F5A0] hover:text-slate-950 text-[#00F5A0] border border-slate-800 hover:border-[#00F5A0] transition-all shrink-0 shadow-lg group active:scale-95"
          title="Grabar nota de voz (V)"
          aria-label="Grabar audio con IA"
        >
          <Mic className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Botón Guardar Directo */}
        {parsed && parsed.amount > 0 && (
          <button
            onClick={handleConfirm}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 shadow-lg shadow-[#00F5A0]/25 transition-all active:scale-95"
          >
            <span>Guardar</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>

      {/* Panel de Interpretación Inteligente en Vivo */}
      {parsed && parsed.amount > 0 && (
        <div className="mt-4 p-4 rounded-2xl bg-[#070A12]/90 border border-slate-800/90 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-mono text-base font-black tracking-tight ${
                  parsed.type === "income"
                    ? "text-[#00F5A0]"
                    : parsed.type === "saving_transfer"
                    ? "text-purple-400"
                    : "text-rose-400"
                }`}
              >
                {parsed.type === "income" ? "+" : "-"}
                {formatCurrency(parsed.amount)}
              </span>

              <span className="text-slate-200 font-bold text-sm">
                {parsed.description}
              </span>

              {parsed.type === "saving_transfer" && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                  <Target className="w-3 h-3 text-purple-400" /> Ahorro a Meta
                </span>
              )}

              {parsed.isAntExpense && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                  ⚠️ Gasto Hormiga
                </span>
              )}

              {parsed.installmentsTotal > 1 && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold font-mono">
                  {parsed.installmentsTotal} Cuotas
                </span>
              )}

              <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-mono">
                📅 {getDateLabel()}
              </span>
            </div>

            <span className="text-[11px] text-[#00F5A0] font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              IA Lista
            </span>
          </div>

          {/* Selector de Meta cuando el tipo es Ahorro (con Cosmic Purple) */}
          {parsed.type === "saving_transfer" && goals.length > 0 && (
            <div className="pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-purple-400 uppercase font-mono font-bold mr-1 flex items-center gap-1">
                <Target className="w-3 h-3" /> Destinar Ahorro a:
              </span>
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    hapticTap();
                    setSelectedGoalId(g.id);
                  }}
                  className={`text-xs px-3 py-1 rounded-xl border transition-all ${
                    selectedGoalId === g.id
                      ? "bg-purple-600 text-white border-purple-400 font-black shadow-md shadow-purple-500/30"
                      : "bg-[#0E1526] text-slate-400 border-slate-800 hover:border-purple-500/40 hover:text-white"
                  }`}
                >
                  🎯 {g.title}
                </button>
              ))}
            </div>
          )}

          {/* Chips de Medio de Pago / Cuenta Origen */}
          <div className="pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">
              {parsed.type === "saving_transfer" ? "Debitar de:" : "Medio de pago:"}
            </span>
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    hapticTap();
                    setSelectedAccountId(acc.id);
                  }}
                  className={`text-xs px-3 py-1 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-[#00F5A0] text-slate-950 border-[#00F5A0] font-black shadow-md shadow-[#00F5A0]/20"
                      : "bg-[#0E1526] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {acc.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {parsed && parsed.amount === 0 && (
        <p className="text-[11px] text-amber-400/90 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Ingresa el monto para registrar (ej: &quot;Almuerzo 6500 ayer con Visa&quot;).
        </p>
      )}
    </div>
  );
};
