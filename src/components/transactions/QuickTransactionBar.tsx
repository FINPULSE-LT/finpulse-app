"use client";

import React, { useState, useRef } from "react";
import { parseTransactionTextLocally } from "@/lib/ai/parser";
import { ParsedTransactionResult, Account } from "@/types";
import { LABELS } from "@/constants/labels";
import { formatCurrency } from "@/lib/formatters/currency";
import { Sparkles, Mic, ArrowRight, Check, AlertCircle, Plus } from "lucide-react";
import confetti from "canvas-confetti";

interface QuickTransactionBarProps {
  accounts: Account[];
  onSaveParsedTransaction: (data: ParsedTransactionResult, selectedAccountId?: string) => void;
  onOpenVoiceModal: () => void;
  onOpenManualModal: () => void;
}

export const QuickTransactionBar: React.FC<QuickTransactionBarProps> = ({
  accounts,
  onSaveParsedTransaction,
  onOpenVoiceModal,
  onOpenManualModal,
}) => {
  const [inputText, setInputText] = useState("");
  const [parsed, setParsed] = useState<ParsedTransactionResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val.trim().length > 3) {
      const result = parseTransactionTextLocally(val);
      setParsed(result);

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
    } else {
      setParsed(null);
    }
  };

  const handleConfirm = () => {
    if (!parsed || parsed.amount <= 0) return;

    onSaveParsedTransaction(parsed, selectedAccountId);

    // Celebración con confetti si es ingreso o ahorro
    if (parsed.type === "income" || parsed.type === "saving_transfer") {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    setInputText("");
    setParsed(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && parsed && parsed.amount > 0) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-brand-500/30 glow-emerald transition-all">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
          <Sparkles className="w-4 h-4 text-brand-400" />
          {LABELS.dashboard.quickInputTitle}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenManualModal}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Formulario detallado</span>
          </button>
        </div>
      </div>

      {/* Input principal y Botones */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={LABELS.dashboard.quickInputPlaceholder}
            className="w-full pl-4 pr-10 py-3 bg-slate-950/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-inner font-sans"
          />
        </div>

        {/* Botón de Voz */}
        <button
          onClick={onOpenVoiceModal}
          className="p-3 rounded-xl bg-slate-800 hover:bg-brand-500 hover:text-slate-950 text-brand-400 border border-slate-700 hover:border-brand-400 transition-all shrink-0 shadow-md group active:scale-95"
          title="Grabar nota de voz (V)"
          aria-label="Grabar audio con IA"
        >
          <Mic className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Botón de Confirmación Directa */}
        {parsed && parsed.amount > 0 && (
          <button
            onClick={handleConfirm}
            className="px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand-500/30 transition-all active:scale-95"
          >
            <span>Guardar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tarjeta de Interpretación de IA en Vivo */}
      {parsed && parsed.amount > 0 && (
        <div className="mt-3.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm font-mono">
                {parsed.type === "income" ? "+" : "-"}
                {formatCurrency(parsed.amount)}
              </span>
              <span className="text-slate-300 font-medium">
                {parsed.description}
              </span>

              {parsed.isAntExpense && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                  ⚠️ Gasto Hormiga
                </span>
              )}

              {parsed.installmentsTotal > 1 && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold">
                  {parsed.installmentsTotal} Cuotas
                </span>
              )}
            </div>

            <span className="text-[11px] text-brand-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              IA Interpretada
            </span>
          </div>

          {/* Chips Rápidos para Seleccionar Medio de Pago */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">
              Medio de pago:
            </span>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  selectedAccountId === acc.id
                    ? "bg-brand-500 text-slate-950 border-brand-400 font-bold shadow-sm"
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
        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          Ingresa el monto para completar el registro (ej: &quot;Almuerzo 6500&quot;).
        </p>
      )}
    </div>
  );
};
