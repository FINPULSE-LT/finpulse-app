"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Account } from "@/types";
import { useHaptics } from "@/hooks/useHaptics";
import { Trash2 } from "lucide-react";

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onSave: (account: Partial<Account> & { id: string }) => Promise<void>;
  onDelete: (accountId: string) => Promise<void>;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<Account["accountType"]>("bank");
  const [balance, setBalance] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [colorHex, setColorHex] = useState("#10b981");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { hapticSuccess, hapticWarning } = useHaptics();

  useEffect(() => {
    if (account) {
      setName(account.name);
      setAccountType(account.accountType);
      setBalance(String(account.balance));
      setClosingDay(account.closingDay ? String(account.closingDay) : "20");
      setDueDay(account.dueDay ? String(account.dueDay) : "30");
      setColorHex(account.colorHex || "#10b981");
      setIsDeleting(false);
    }
  }, [account, isOpen]);

  if (!account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: account.id,
        name: name.trim(),
        accountType,
        balance: parseFloat(balance) || 0,
        closingDay: accountType === "credit_card" ? parseInt(closingDay, 10) : undefined,
        dueDay: accountType === "credit_card" ? parseInt(dueDay, 10) : undefined,
        colorHex,
      });
      hapticSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Error al actualizar la cuenta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    try {
      setIsSubmitting(true);
      hapticWarning();
      await onDelete(account.id);
      onClose();
    } catch (err: any) {
      alert(err.message || "Error al eliminar la cuenta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Cuenta"
      subtitle={`Modifica los datos o saldo de ${account.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold">
              Nombre de la Cuenta *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold">
              Tipo de Cuenta
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="bank">Banco / Caja de Ahorro</option>
              <option value="wallet">Billetera Virtual (MP, Ualá)</option>
              <option value="credit_card">Tarjeta de Crédito</option>
              <option value="cash">Efectivo</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold">
            Saldo Actual ($) *
          </label>
          <input
            type="number"
            step="any"
            required
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:border-cyan-500"
          />
        </div>

        {accountType === "credit_card" && (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold">
                Día de Cierre
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold">
                Día de Vencimiento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm"
              />
            </div>
          </div>
        )}

        {/* Zona de Peligro: Eliminar Cuenta */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isDeleting
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? "¿Confirmar eliminación?" : "Eliminar Cuenta"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] text-slate-950 font-black text-xs shadow-md"
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
