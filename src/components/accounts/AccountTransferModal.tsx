"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Account } from "@/types";
import { formatCurrency } from "@/lib/formatters/currency";
import { useHaptics } from "@/hooks/useHaptics";
import { ArrowRightLeft, Calendar, FileText } from "lucide-react";

interface AccountTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onTransfer: (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => Promise<void>;
}

export const AccountTransferModal: React.FC<AccountTransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onTransfer,
}) => {
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { hapticTap, hapticSuccess, hapticWarning } = useHaptics();

  // Asegurar que las cuentas seleccionadas existan al abrir
  React.useEffect(() => {
    if (isOpen && accounts.length >= 2) {
      if (!fromAccountId || !accounts.some((a) => a.id === fromAccountId)) {
        setFromAccountId(accounts[0].id);
      }
      if (!toAccountId || toAccountId === accounts[0]?.id || !accounts.some((a) => a.id === toAccountId)) {
        setToAccountId(accounts[1]?.id || accounts[0]?.id);
      }
    }
  }, [isOpen, accounts]);

  const fromAcc = accounts.find((a) => a.id === fromAccountId);
  const toAcc = accounts.find((a) => a.id === toAccountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Por favor ingresa un monto válido mayor a 0");
      return;
    }

    if (fromAccountId === toAccountId) {
      hapticWarning();
      alert("La cuenta de origen y de destino deben ser diferentes");
      return;
    }

    try {
      setIsSubmitting(true);
      await onTransfer(fromAccountId, toAccountId, numAmount, notes.trim() || undefined);
      hapticSuccess();
      onClose();
      setAmount("");
      setNotes("");
    } catch (err: any) {
      alert(err.message || "Error al realizar la transferencia");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwap = () => {
    hapticTap();
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transferencia entre Cuentas"
      subtitle="Mueve saldo entre tus cuentas bancarias, billeteras o tarjetas"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selector Origen y Destino */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold">
              Cuenta Origen (Desde donde sale el dinero)
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — Saldo: {formatCurrency(acc.balance)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-transform active:rotate-180"
              title="Invertir origen y destino"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold">
              Cuenta Destino (Hacia donde ingresa el dinero)
            </label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — Saldo: {formatCurrency(acc.balance)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold">
            Monto a Transferir ($) *
          </label>
          <input
            type="number"
            step="any"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:border-[#00F5A0]"
          />
        </div>

        {/* Notas Opcionales */}
        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1 font-semibold">
            <FileText className="w-3 h-3 text-slate-400" />
            Nota o Motivo (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ej: Paso saldo a MP para rendimientos, pago de tarjeta..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Resumen Visual */}
        {fromAcc && toAcc && fromAccountId !== toAccountId && amount && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">{fromAcc.name}:</span>
              <span className="text-rose-400">-{formatCurrency(parseFloat(amount) || 0)}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">{toAcc.name}:</span>
              <span className="text-emerald-400">+{formatCurrency(parseFloat(amount) || 0)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] text-slate-950 font-black text-xs shadow-md shadow-[#00F5A0]/20 disabled:opacity-50"
          >
            {isSubmitting ? "Transfiriendo..." : "Confirmar Transferencia"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
