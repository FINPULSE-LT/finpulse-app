"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { parseTransactionTextLocally } from "@/lib/ai/parser";
import { ParsedTransactionResult, Account } from "@/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { Mic, Square, Sparkles, Check, RefreshCw } from "lucide-react";

interface VoiceExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onConfirm: (data: ParsedTransactionResult, selectedAccountId?: string) => void;
}

export const VoiceExpenseModal: React.FC<VoiceExpenseModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onConfirm,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedTransactionResult | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const recognitionRef = useRef<any>(null);

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

          if (res.accountSuggestion && accounts.length > 0) {
            const found = accounts.find((acc) =>
              acc.name.toLowerCase().includes(res.accountSuggestion!.toLowerCase())
            );
            if (found) setSelectedAccountId(found.id);
          } else if (!selectedAccountId && accounts.length > 0) {
            setSelectedAccountId(accounts[0].id);
          }
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      startRecording();
    } else {
      // Fallback de demo si el navegador no tiene Web Speech API
      setTranscript("Cena con amigos 22000 en visa debito");
      const res = parseTransactionTextLocally("Cena con amigos 22000 en visa debito");
      setParsedResult(res);
      if (accounts.length > 0) setSelectedAccountId(accounts[0].id);
    }

    return () => {
      stopRecording();
    };
  }, [isOpen]);

  const startRecording = () => {
    setTranscript("");
    setParsedResult(null);
    try {
      recognitionRef.current?.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsRecording(false);
  };

  const handleSave = () => {
    if (parsedResult && parsedResult.amount > 0) {
      onConfirm(parsedResult, selectedAccountId);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registro por Nota de Voz con IA"
      subtitle="Habla con naturalidad: 'Gasté 4500 en el supermercado con débito' o 'Café 2500 efectivo'"
      maxWidth="md"
    >
      <div className="space-y-5 text-center py-2">
        {/* Visualizador de Onda Sonora y Micrófono */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative">
            {isRecording && (
              <>
                <div className="absolute -inset-3 rounded-full bg-brand-500/20 animate-ping" />
                <div className="absolute -inset-6 rounded-full bg-brand-500/10 animate-pulse" />
              </>
            )}

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                isRecording
                  ? "bg-rose-500 text-white shadow-rose-500/40 hover:bg-rose-600 scale-105"
                  : "bg-brand-500 text-slate-950 shadow-brand-500/40 hover:bg-brand-400 hover:scale-105"
              }`}
            >
              {isRecording ? (
                <Square className="w-8 h-8 fill-current" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <span className="text-xs font-mono font-medium mt-4 text-slate-300">
            {isRecording ? "Escuchando... Di tu movimiento" : "Presiona el botón para hablar"}
          </span>
        </div>

        {/* Transcripción de Audio */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-left min-h-[56px] flex items-center justify-between">
          <p className="text-sm text-slate-200 italic">
            {transcript ? `"${transcript}"` : "Tu voz aparecerá aquí en tiempo real..."}
          </p>
          {transcript && !isRecording && (
            <button
              onClick={startRecording}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 ml-2"
              title="Volver a grabar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Resultado Extraído por IA */}
        {parsedResult && parsedResult.amount > 0 && (
          <div className="p-4 rounded-xl bg-slate-900 border border-brand-500/30 text-left space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Datos extraídos con éxito:
              </span>
              <span className="text-sm font-bold font-mono text-white">
                {parsedResult.type === "income" ? "+" : "-"}
                {formatCurrency(parsedResult.amount)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Descripción:</span>
                <span className="font-semibold text-white">{parsedResult.description}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Gasto Hormiga:</span>
                <span className="font-semibold text-white">
                  {parsedResult.isAntExpense ? "⚠️ Sí (Ant-Expense)" : "No"}
                </span>
              </div>
            </div>

            {/* Selector de cuenta para asignar */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1.5 uppercase font-mono">
                Confirmar medio de pago:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      selectedAccountId === acc.id
                        ? "bg-brand-500 text-slate-950 border-brand-400 font-bold"
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
