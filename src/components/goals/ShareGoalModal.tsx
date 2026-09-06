"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SavingsGoal } from "@/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { useHaptics } from "@/hooks/useHaptics";
import {
  Share2,
  Copy,
  Check,
  Mail,
  Send,
  Users,
  Sparkles,
  ExternalLink,
  MessageCircle,
  AlertCircle,
} from "lucide-react";

interface ShareGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  creatorName?: string;
}

export const ShareGoalModal: React.FC<ShareGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  creatorName = "Un usuario de FinPulse",
}) => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  const { hapticTap, hapticSuccess } = useHaptics();

  if (!goal) return null;

  const inviteCode = goal.inviteCode || goal.id;
  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/?unirseMeta=${goal.id}&codigo=${inviteCode}`
      : `https://finpulse-app-theta.vercel.app/?unirseMeta=${goal.id}&codigo=${inviteCode}`;

  const handleCopyLink = () => {
    hapticSuccess();
    navigator.clipboard.writeText(inviteLink);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2500);
  };

  const handleCopyCode = () => {
    hapticSuccess();
    navigator.clipboard.writeText(inviteCode);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    hapticTap();
    const text = encodeURIComponent(
      `¡Hola! 👋 Te invito a compartir la meta de ahorro "${goal.title}" en FinPulse.\n\nMonto objetivo: ${formatCurrency(
        goal.targetAmount
      )}\n\nÚnete tocando este enlace directo:\n${inviteLink}\n\nO ingresa el código ${inviteCode} en la app.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) return;

    try {
      setIsSendingEmail(true);
      setEmailStatus(null);
      setEmailError(null);

      const res = await fetch("/api/goals/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorName,
          recipientEmail: recipientEmail.trim(),
          goalTitle: goal.title,
          targetAmount: goal.targetAmount,
          inviteCode,
          goalId: goal.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar el correo");
      }

      hapticSuccess();
      setEmailStatus(`¡Invitación enviada con éxito a ${recipientEmail}!`);
      setRecipientEmail("");
    } catch (err: any) {
      setEmailError(err.message || "Error al enviar la invitación.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compartir Meta de Ahorro"
      subtitle={`Invita a tu pareja o equipo a sumarse a "${goal.title}"`}
      maxWidth="md"
    >
      <div className="space-y-5 py-2">
        {/* Resumen de la Meta */}
        <div className="p-4 rounded-2xl bg-[#090D18] border border-purple-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono text-purple-400 font-bold block">
              Meta Compartida
            </span>
            <h4 className="text-base font-black text-white">{goal.title}</h4>
            <span className="text-xs text-slate-400 font-mono">
              Objetivo: {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              Código Único
            </span>
            <span className="text-sm font-black font-mono text-[#00F5A0]">
              {inviteCode}
            </span>
          </div>
        </div>

        {/* 1. Opción WhatsApp (Rápida y Móvil) */}
        <div className="space-y-2">
          <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold">
            1. Enviar Invitación por WhatsApp
          </label>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-3 px-4 rounded-2xl bg-[#0E2E20] hover:bg-[#133C2A] border border-[#00F5A0]/40 text-[#00F5A0] font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Compartir por WhatsApp con 1 Toque</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-60" />
          </button>
        </div>

        {/* 2. Opción Enlace Directo (Copiar) */}
        <div className="space-y-2">
          <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold">
            2. Enlace Directo de 1 Clic
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 px-3 py-2 bg-[#060A10] border border-slate-700/80 rounded-xl text-xs text-slate-300 font-mono truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              {isLinkCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00F5A0]" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Enlace</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Al abrir este enlace en su celular o PC, la otra persona se unirá automáticamente a la meta.
          </p>
        </div>

        {/* 3. Opción Invitar por Correo Electrónico */}
        <form onSubmit={handleSendEmailInvite} className="space-y-2 pt-1 border-t border-slate-800">
          <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold">
            3. Invitar Directamente por Correo
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="correo-de-tu-pareja@gmail.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#060A10] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSendingEmail}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingEmail ? "Enviando..." : "Enviar Mail"}</span>
            </button>
          </div>

          {emailStatus && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-[#00F5A0] shrink-0" />
              <span>{emailStatus}</span>
            </div>
          )}

          {emailError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{emailError}</span>
            </div>
          )}
        </form>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};
