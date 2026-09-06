"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useHaptics } from "@/hooks/useHaptics";
import confetti from "canvas-confetti";
import { Users, KeyRound, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

interface JoinGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGoal: (code: string) => Promise<{ success: boolean; error?: string; goalTitle?: string }>;
}

export const JoinGoalModal: React.FC<JoinGoalModalProps> = ({
  isOpen,
  onClose,
  onJoinGoal,
}) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { hapticTap, hapticSuccess, hapticCelebration } = useHaptics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setIsLoading(true);
      setErrorMessage("");
      hapticTap();

      const result = await onJoinGoal(code.trim());

      if (result.success) {
        hapticCelebration();
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
        });
        setCode("");
        onClose();
      } else {
        setErrorMessage(result.error || "No se pudo unir a la meta");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al procesar la solicitud");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Unirse a una Meta de Ahorro"
      subtitle="Ingresa el código o enlace recibido para comenzar a ahorrar en equipo"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="p-3.5 rounded-2xl bg-[#090D18] border border-purple-500/30 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Al unirte a una meta compartida, verás su progreso en tu panel y tus aportes sumarán al objetivo común.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5 font-bold">
            Código o Enlace de la Meta *
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Ej: FIN-LEEUPD o pega el enlace completo"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#060A10] border border-slate-700/80 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-[#00F5A0] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{isLoading ? "Buscando..." : "Unirme a la Meta"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </Modal>
  );
};
