"use client";

import React, { useState, useRef, useEffect } from "react";
import { parseTransactionTextLocally } from "@/lib/ai/parser";
import { ParsedTransactionResult, Account, SavingsGoal } from "@/types";
import { LABELS } from "@/constants/labels";
import { formatCurrency } from "@/lib/formatters/currency";
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

      // Si el parser sugirió una cuenta y no tenemos seleccionada, intentamos emparejar
      if (result.accountSuggestion && accounts.length > 0) {
        const found = accounts.find((acc) =>
          acc.name.toLowerCase().includes(result.accountSuggestion!.toLowerCase()) ||
          acc.accountType.toLowerCase().includes(result.accountSuggestion!.toLowerCase())
        );
        if (found) setSelectedAccountId(found.id);
      } else if (!selectedAccountId && accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }

      // Si es un ahorro y hay metas, preseleccionar la primera si no hay una seleccionada
      if (result.type === "saving_transfer" && goals.length > 0 && !selectedGoalId) {
        setSelectedGoalId(goals[0].id);
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

    // Celebración con confetti si es ingreso o ahorro
    if (parsed.type === "income" || parsed.type === "saving_transfer") {
      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.8 },
      });
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
    <div className="obsidian-panel rounded-3xl p-4 sm:p-6 transition-all duration-300 relative overflow-hidden group">
      {/* Barra superior de estado */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="text-xs font-extrabold text-white tracking-wider uppercase font-mono">
            {LABELS.dashboard.quickInputTitle}
          </span>
        </div>

        {/* Gestor Rápido de Fecha del Registro */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              type="button"
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all border ${
                selectedDate === todayStr
                  ? "bg-slate-900 text-slate-300 border-slate-700/80 hover:border-cyan-500/50"
                  : "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fecha: {getDateLabel()}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 p-2.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl z-30 space-y-2 min-w-[200px] animate-in fade-in zoom-in-95">
                <span className="block text-[10px] uppercase font-mono text-slate-400 font-bold px-1">
                  Cambiar Fecha del Gasto
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(todayStr);
                      setShowDatePicker(false);
                    }}
                    className={`flex-1 py-1 text-xs rounded-lg font-medium transition-colors ${
                      selectedDate === todayStr
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(yesterdayStr);
                      setShowDatePicker(false);
                    }}
                    className={`flex-1 py-1 text-xs rounded-lg font-medium transition-colors ${
                      selectedDate === yesterdayStr
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    Ayer
                  </button>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setShowDatePicker(false);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            )}
          </div>

          <button
            onClick={onOpenManualModal}
            className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700"
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
            placeholder="Escribe: 'Almuerzo 12500 con Galicia ayer' o 'Ahorré 20000 para vacaciones'"
            className="w-full pl-4 pr-10 py-3.5 bg-slate-950/90 border border-slate-800/90 rounded-2xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner font-sans tracking-tight"
          />
        </div>

        {/* Botón de Grabación por Voz */}
        <button
          onClick={onOpenVoiceModal}
          className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-cyan-400 hover:text-slate-950 text-cyan-400 border border-slate-800 hover:border-cyan-300 transition-all shrink-0 shadow-lg group active:scale-95"
          title="Grabar nota de voz (V)"
          aria-label="Grabar audio con IA"
        >
          <Mic className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Botón Guardar Directo */}
        {parsed && parsed.amount > 0 && (
          <button
            onClick={handleConfirm}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shrink-0 shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
          >
            <span>Guardar</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>

      {/* Panel de Interpretación Inteligente en Vivo */}
      {parsed && parsed.amount > 0 && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-mono text-base font-extrabold tracking-tight ${
                  parsed.type === "income"
                    ? "text-emerald-400"
                    : parsed.type === "saving_transfer"
                    ? "text-cyan-400"
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
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1">
                  <Target className="w-3 h-3" /> Ahorro a Meta
                </span>
              )}

              {parsed.isAntExpense && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                  ⚠️ Gasto Hormiga
                </span>
              )}

              {parsed.installmentsTotal > 1 && (
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold font-mono">
                  {parsed.installmentsTotal} Cuotas
                </span>
              )}

              <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-mono">
                📅 {getDateLabel()}
              </span>
            </div>

            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              IA Lista
            </span>
          </div>

          {/* Selector de Meta cuando el tipo es Ahorro */}
          {parsed.type === "saving_transfer" && goals.length > 0 && (
            <div className="pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold mr-1 flex items-center gap-1">
                <Target className="w-3 h-3" /> Asignar a Meta:
              </span>
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGoalId(g.id)}
                  className={`text-xs px-3 py-1 rounded-xl border transition-all ${
                    selectedGoalId === g.id
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  🎯 {g.title}
                </button>
              ))}
            </div>
          )}

          {/* Chips de Medio de Pago */}
          <div className="pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">
              Medio de pago:
            </span>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`text-xs px-3 py-1 rounded-xl border transition-all ${
                  selectedAccountId === acc.id
                    ? "bg-slate-200 text-slate-950 border-white font-bold shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {acc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {parsed && parsed.amount === 0 && (
        <p className="text-[11px] text-amber-400/90 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Ingresa el monto para registrar (ej: &quot;Almuerzo 6500 ayer&quot;).
        </p>
      )}
    </div>
  );
};
