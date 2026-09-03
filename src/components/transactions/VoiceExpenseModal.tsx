"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { parseTransactionTextLocally, matchAccountFromSuggestion } from "@/lib/ai/parser";
import { ParsedTransactionResult, Account, SavingsGoal } from "@/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { useHaptics } from "@/hooks/useHaptics";
import { Mic, Square, Sparkles, Check, RefreshCw, Target } from "lucide-react";

interface VoiceExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  goals?: SavingsGoal[];
  onConfirm: (
    data: ParsedTransactionResult,
    selectedAccountId?: string,
    targetGoalId?: string
  ) => void;
}

export const VoiceExpenseModal: React.FC<VoiceExpenseModalProps> = ({
  isOpen,
  onClose,
  accounts,
  goals = [],
  onConfirm,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedTransactionResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  const { hapticTap, hapticSuccess, hapticWarning } = useHaptics();

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setTranscript("");
      setParsedResult(null);
      return;
    }

    // Inicializar Web Speech API del navegador si está soportado
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "es-AR";

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (currentTranscript.trim().length > 3) {
          const res = parseTransactionTextLocally(currentTranscript);
          setParsedResult(res);

          // Emparejamiento inteligente de cuentas
          if (res.accountSuggestion && accounts.length > 0) {
            const found = matchAccountFromSuggestion(res.accountSuggestion, accounts);
            if (found) setSelectedAccountId(found.id);
          }

          // Emparejamiento de metas si es ahorro
          if (res.type === "saving_transfer" && goals.length > 0) {
            const clean = currentTranscript.toLowerCase();
            const matchedGoal = goals.find((g) =>
              clean.includes(g.title.toLowerCase()) ||
              (g.title.toLowerCase().includes("vacaciones") && clean.includes("vacaciones"))
            );
            setSelectedGoalId(matchedGoal ? matchedGoal.id : goals[0].id);
          }
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopRecording();
    };
  }, [isOpen, accounts, goals]);

  const startRecording = () => {
    hapticTap();
    setTranscript("");
    setParsedResult(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        // En caso de que ya estuviese corriendo
      }
    } else {
      // Demostración si el navegador no soporta Speech Recognition
      setIsRecording(true);
      setTimeout(() => {
        const demoText = "Cena 18000 ayer con Visa";
        setTranscript(demoText);
        const res = parseTransactionTextLocally(demoText);
        setParsedResult(res);
        const matchedAcc = matchAccountFromSuggestion(res.accountSuggestion, accounts);
        if (matchedAcc) setSelectedAccountId(matchedAcc.id);
        setIsRecording(false);
        hapticSuccess();
      }, 1800);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const handleSave = () => {
    if (parsedResult && parsedResult.amount > 0) {
      hapticSuccess();
      onConfirm(
        {
          ...parsedResult,
          goalId: parsedResult.type === "saving_transfer" ? selectedGoalId : undefined,
        },
        selectedAccountId,
        parsedResult.type === "saving_transfer" ? selectedGoalId : undefined
      );
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registro por Nota de Voz con IA" maxWidth="md">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Di tu gasto de forma natural (ej: &quot;Almuerzo 12500 con Galicia&quot; o &quot;Ahorré 25000 para las vacaciones&quot;).
        </p>

        {/* Botón Central de Grabación */}
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isRecording
                ? "bg-rose-500 text-white animate-pulse shadow-rose-500/50 scale-110"
                : "bg-gradient-to-tr from-[#00F5A0] to-[#00D9F5] text-slate-950 hover:brightness-110 shadow-[#00F5A0]/30 hover:scale-105"
            }`}
          >
            {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8 stroke-[2.5]" />}
          </button>
          <span className="text-xs font-mono text-slate-400">
            {isRecording ? "🔴 Escuchando... Presiona para detener" : "Presiona el micrófono para hablar"}
          </span>
        </div>

        {/* Transcripción en vivo */}
        {transcript && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Audio Transcrito:</span>
            <p className="text-sm font-medium text-white italic">&quot;{transcript}&quot;</p>
          </div>
        )}

        {/* Interpretación IA del Audio */}
        {parsedResult && parsedResult.amount > 0 && (
          <div className="p-4 rounded-xl bg-[#090D18] border border-[#00F5A0]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00F5A0] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                IA Interpretó tu Audio:
              </span>
              <span className="text-xs font-mono font-black text-white">
                {formatCurrency(parsedResult.amount)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Concepto:</span>
                <span className="font-bold text-white">{parsedResult.description}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Tipo:</span>
                <span className="font-bold text-[#00F5A0] capitalize">{parsedResult.type}</span>
              </div>
            </div>

            {/* Selector de Meta si es ahorro */}
            {parsedResult.type === "saving_transfer" && goals.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-purple-400 block mb-1.5 uppercase font-mono font-bold flex items-center gap-1">
                  <Target className="w-3 h-3" /> Asignar a Meta:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {goals.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        hapticTap();
                        setSelectedGoalId(g.id);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        selectedGoalId === g.id
                          ? "bg-purple-600 text-white border-purple-400 font-bold"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      🎯 {g.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de cuenta para asignar */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1.5 uppercase font-mono">
                {parsedResult.type === "saving_transfer" ? "Debitar de:" : "Confirmar medio de pago:"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      hapticTap();
                      setSelectedAccountId(acc.id);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      selectedAccountId === acc.id
                        ? "bg-[#00F5A0] text-slate-950 border-[#00F5A0] font-bold"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Acciones del Modal */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!parsedResult || parsedResult.amount <= 0}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Confirmar y Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
